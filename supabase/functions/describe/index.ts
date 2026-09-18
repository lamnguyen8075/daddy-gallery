import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Caption = {
  title: string;
  description: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MINIMAX_API_KEY")?.trim();
    if (!apiKey) {
      return json({ error: "Missing MINIMAX_API_KEY" }, 500);
    }

    const body = (await req.json()) as { id?: string; image?: string };
    if (!body.id || !body.image) {
      return json({ error: "Missing photo" }, 400);
    }

    const caption = await describeImage(apiKey, body.image);
    await saveCaption(body.id, body.image, caption);
    return json(caption);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not describe this photo";
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function captionObjectPath(id: string) {
  return `captions/${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
}

async function saveCaption(id: string, image: string, caption: Caption) {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bucket = Deno.env.get("GALLERY_BUCKET")?.trim() || "handmade";
  if (!url || !key) return;

  const supabase = createClient(url, key);
  const payload = JSON.stringify({
    id,
    image,
    title: caption.title,
    description: caption.description,
    v: "show",
  });
  await supabase.storage.from(bucket).upload(captionObjectPath(id), payload, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
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
