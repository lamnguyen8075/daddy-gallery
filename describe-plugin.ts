import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Plugin } from "vite";
import { captionObjectPath } from "./src/lib/captions";

type DescribeBody = {
  id?: string;
  image?: string;
};

type Caption = {
  title: string;
  description: string;
  v?: number;
};

const CAPTION_VERSION = 3;

type DescribeOptions = {
  apiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  bucket: string;
};

export function describePlugin(options: DescribeOptions): Plugin {
  const db =
    options.supabaseUrl && options.supabaseKey
      ? createClient(options.supabaseUrl, options.supabaseKey)
      : null;

  async function handleGet(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
    try {
      const id = requestUrl(req).searchParams.get("id");
      if (!id) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing photo" }));
        return;
      }

      const cached = (await readCaption(db, options.bucket, id)) ?? readDiskCaption(id);
      if (!cached) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ...cached, cached: true }));
    } catch (error) {
      console.error("[describe] get", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Could not read caption" }));
    }
  }

  async function handleDescribe(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end();
      return;
    }

    if (!options.apiKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing MINIMAX_API_KEY" }));
      return;
    }

    try {
      const body = JSON.parse(await readBody(req)) as DescribeBody;
      if (!body.image || !body.id) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing photo" }));
        return;
      }

      let cached = await readCaption(db, options.bucket, body.id);
      if (!cached) cached = readDiskCaption(body.id);
      if (cached) {
        if (db) await saveCaption(db, options.bucket, body.id, body.image, cached);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ...cached, cached: true }));
        return;
      }

      const caption = await describeImage(options.apiKey, body.image);
      const saved = await saveCaption(db, options.bucket, body.id, body.image, caption);
      writeDiskCaption(body.id, caption);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ...caption, cached: false, saved }));
    } catch (error) {
      console.error("[describe]", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Could not describe this photo" }));
    }
  }

  function attach(server: { middlewares: { use: (path: string, handler: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: () => void) => void) => void } }) {
    server.middlewares.use("/api/describe", (req, res, next) => {
      if (req.method === "GET") {
        void handleGet(req, res);
        return;
      }
      if (req.method === "POST") {
        void handleDescribe(req, res);
        return;
      }
      next();
    });
  }

  return {
    name: "describe-photo",
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}

function requestUrl(req: import("http").IncomingMessage) {
  const originalUrl = (req as { originalUrl?: string }).originalUrl;
  return new URL(originalUrl || req.url || "/", "http://localhost");
}

function readBody(req: import("http").IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => {
      chunks.push(chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk)));
    });
    req.on("end", () => {
      const total = chunks.reduce((sum, part) => sum + part.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const part of chunks) {
        merged.set(part, offset);
        offset += part.byteLength;
      }
      resolve(new TextDecoder().decode(merged));
    });
    req.on("error", reject);
  });
}

async function readCaption(db: SupabaseClient | null, bucket: string, id: string) {
  if (!db) return null;
  const { data, error } = await db.storage.from(bucket).download(captionObjectPath(id));
  if (error || !data) return null;
  try {
    const parsed = JSON.parse(await data.text()) as { title?: string; description?: string };
    if (!parsed.title || !parsed.description) return null;
    return { title: parsed.title, description: parsed.description } satisfies Caption;
  } catch {
    return null;
  }
}

async function saveCaption(
  db: SupabaseClient | null,
  bucket: string,
  id: string,
  image: string,
  caption: Caption,
) {
  if (!db) return false;
  const body = JSON.stringify({
    id,
    image,
    title: caption.title,
    description: caption.description,
  });
  const { error } = await db.storage.from(bucket).upload(captionObjectPath(id), body, {
    contentType: "application/json",
    upsert: true,
  });
  if (error) {
    console.error("[describe] save caption", error.message);
    return false;
  }
  return true;
}

const captionsFile = join(process.cwd(), ".data", "captions.json");

function readDiskStore() {
  try {
    return JSON.parse(readFileSync(captionsFile, "utf8")) as Record<string, Caption>;
  } catch {
    return {};
  }
}

function readDiskCaption(id: string) {
  const stored = readDiskStore()[id];
  if (!stored?.title || !stored.description || stored.v !== CAPTION_VERSION) return null;
  return { title: stored.title, description: stored.description };
}

function writeDiskCaption(id: string, caption: Caption) {
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  const store = readDiskStore();
  store[id] = { ...caption, v: CAPTION_VERSION };
  writeFileSync(captionsFile, JSON.stringify(store, null, 2));
}

async function describeImage(apiKey: string, imageUrl: string): Promise<Caption> {
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
                'Đây là ảnh trong "Phòng tranh của Ba", nơi lưu những món thủ công Ba làm ở nhà.',
                "Viết chân thành, gần gũi. Có chỗ cho tình yêu, gia đình, quê hương, sự giản dị.",
                "Nói như người nhà nói chuyện. Đừng sướt mướt, đừng nhớ nhung, đừng như hồi ký.",
                "Không dùng: kỷ niệm, nhớ lại, nhớ nhung, ngày xưa, giữ mãi, lời nhắn.",
                "Không viết hộ nỗi nhớ của Ba.",
                "Trả về JSON thuần, không markdown, đúng dạng:",
                '{"title":"...","description":"..."}',
                "title: 3 đến 8 chữ tiếng Việt, gọi món đồ, giọng nhẹ.",
                "description: đúng 2 hoặc 3 câu. Tả món đồ, rồi nói giản dị về nhà, người thân, hoặc quê. Không gạch đầu dòng, không emoji, không lời dẫn.",
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

  const payload = (await response.json()) as {
    error?: { message?: string };
    base_resp?: { status_msg?: string };
    choices?: { message?: { content?: string | Array<{ type?: string; text?: string }> | null } }[];
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.base_resp?.status_msg || "MiniMax request failed");
  }

  const content = payload.choices?.[0]?.message?.content;
  const raw = (typeof content === "string" ? content : content?.map((part) => part.text ?? "").join(" "))
    ?.replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
  if (!raw) throw new Error("Empty description");
  return parseCaption(raw);
}

function parseCaption(raw: string): Caption {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Caption was not JSON");
  const parsed = JSON.parse(match[0]) as { title?: string; description?: string };
  const title = parsed.title?.replace(/^["“]|["”]$/g, "").trim() ?? "";
  const description = parsed.description?.trim() ?? "";
  if (!title || !description) throw new Error("Incomplete caption");
  return { title, description };
}
