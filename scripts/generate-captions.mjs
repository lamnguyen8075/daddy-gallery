import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const apiKey = env.MINIMAX_API_KEY;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const bucket = env.VITE_SUPABASE_BUCKET || "handmade";

if (!apiKey || !supabaseUrl || !supabaseKey) {
  throw new Error("Need MINIMAX_API_KEY, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY in .env");
}

const db = createClient(supabaseUrl, supabaseKey);

function captionPath(id) {
  return `captions/${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
}

function parseCaption(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Caption was not JSON");
  const parsed = JSON.parse(match[0]);
  const title = parsed.title?.replace(/^["“]|["”]$/g, "").trim() ?? "";
  const description = parsed.description?.trim() ?? "";
  if (!title || !description) throw new Error("Incomplete caption");
  return { title, description };
}

async function listFolder(prefix) {
  const { data, error } = await db.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return data ?? [];
}

function isFolder(entry) {
  return entry.id === null || entry.metadata === null;
}

async function listPhotos() {
  const items = [];
  const root = await listFolder("");
  for (const entry of root) {
    if (isFolder(entry)) {
      if (entry.name === "captions") continue;
      const files = await listFolder(entry.name);
      for (const file of files) {
        if (isFolder(file) || !/\.(jpe?g|png|webp|gif|avif|heic)$/i.test(file.name)) continue;
        const storagePath = `${entry.name}/${file.name}`;
        items.push({
          id: file.id ?? storagePath,
          image: db.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl,
        });
      }
      continue;
    }
    if (!/\.(jpe?g|png|webp|gif|avif|heic)$/i.test(entry.name)) continue;
    items.push({
      id: entry.id ?? entry.name,
      image: db.storage.from(bucket).getPublicUrl(entry.name).data.publicUrl,
    });
  }
  return items;
}

function readDiskStore() {
  try {
    return JSON.parse(readFileSync(new URL("../.data/captions.json", import.meta.url), "utf8"));
  } catch {
    return {};
  }
}

async function readStoredCaption(id) {
  const { data, error } = await db.storage.from(bucket).download(captionPath(id));
  if (error || !data) return null;
  try {
    const parsed = JSON.parse(await data.text());
    if (!parsed.title || !parsed.description) return null;
    return { title: parsed.title, description: parsed.description };
  } catch {
    return null;
  }
}

async function saveCaption(id, image, caption) {
  const body = JSON.stringify({ id, image, title: caption.title, description: caption.description, v: "show" });
  const { error } = await db.storage.from(bucket).upload(captionPath(id), body, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  if (error) throw error;
}

async function describeImage(imageUrl) {
  const response = await fetch("https://api.minimax.io/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "MiniMax-M3",
      temperature: 0.65,
      max_completion_tokens: 320,
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Đây là một triển lãm nghệ thuật thủ công vui, tươi. Viết như chú thích treo tường trong phòng trưng bày.",
                "Giọng vui, nhẹ, thích thú với món đồ. Như đang xem tác phẩm, không phải đang nhớ ai.",
                "Không sướt mướt, không hoài niệm, không hồi ký, không cảm động.",
                "Không nhắc: Ba, Má, mẹ, bố, gia đình, quê hương, nhà, người thân, kỷ niệm, nhớ, ngày xưa, giữ mãi.",
                "Tả màu, hình dáng, chất liệu, và cái hay của tác phẩm.",
                "Trả về JSON thuần, không markdown, đúng dạng:",
                '{"title":"...","description":"..."}',
                "title: 3 đến 8 chữ tiếng Việt, gọi món đồ, vui và rõ.",
                "description: đúng 2 hoặc 3 câu. Chỉ nói về tác phẩm. Không gạch đầu dòng, không emoji, không lời dẫn.",
              ].join(" "),
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.base_resp?.status_msg || `MiniMax ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  const raw = (typeof content === "string" ? content : content?.map((part) => part.text ?? "").join(" "))
    ?.replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
  if (!raw) throw new Error("Empty description");
  return parseCaption(raw);
}

async function withRetry(task, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (i + 1)));
    }
  }
  throw lastError;
}

const force = process.argv.includes("--force");
const photos = await listPhotos();
const disk = force ? {} : readDiskStore();
let skipped = 0;
let fromDisk = 0;
let generated = 0;
let failed = 0;

console.log(`Found ${photos.length} photos${force ? " (regenerating all)" : ""}`);

for (const [index, photo] of photos.entries()) {
  const n = `${index + 1}/${photos.length}`;
  if (!force) {
    const existing = await readStoredCaption(photo.id);
    if (existing) {
      skipped += 1;
      console.log(`[${n}] skip ${existing.title}`);
      continue;
    }

    const local = disk[photo.id];
    if (local?.title && local.description) {
      await saveCaption(photo.id, photo.image, { title: local.title, description: local.description });
      fromDisk += 1;
      console.log(`[${n}] stored ${local.title}`);
      continue;
    }
  }

  try {
    const caption = await withRetry(() => describeImage(photo.image));
    await saveCaption(photo.id, photo.image, caption);
    generated += 1;
    console.log(`[${n}] wrote ${caption.title}`);
  } catch (error) {
    failed += 1;
    console.error(`[${n}] fail ${error instanceof Error ? error.message : error}`);
  }
}

console.log(
  JSON.stringify({ photos: photos.length, skipped, fromDisk, generated, failed }, null, 2),
);

if (failed) process.exitCode = 1;
