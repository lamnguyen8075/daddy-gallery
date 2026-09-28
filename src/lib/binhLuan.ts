import { supabase } from "./supabase";

export type CommentRow = {
  id: string;
  photoId: string;
  name: string;
  body: string;
  createdAt: string;
};

const maxName = 40;
const maxBody = 500;

const guestNames = [
  "Cáo lém",
  "Heo ngủ ngày",
  "Mèo lười biếng",
  "Gấu ôm mật",
  "Cá vàng há hốc",
  "Sóc siêu quậy",
  "Thỏ hay quên",
  "Cánh cụt đi lạc",
  "Gà con lạc đàn",
  "Ếch ộp ộp",
  "Ong mật bay vòng",
  "Vịt bầu lắc lư",
  "Nhím xù lông",
  "Rái cá nghịch",
  "Chó đốm tinh nghịch",
  "Bướm vàng lượn",
  "Hoa giấy vui tính",
  "Hoa sen hay cười",
  "Cúc họa mi",
  "Hoa hồng nhí nhảnh",
] as const;

export function randomGuestName() {
  return guestNames[Math.floor(Math.random() * guestNames.length)];
}

function asComment(row: {
  id: string;
  photo_id: string;
  ten: string | null;
  noi_dung: string;
  created_at: string;
}): CommentRow {
  return {
    id: row.id,
    photoId: row.photo_id,
    name: (row.ten || "").trim() || randomGuestName(),
    body: row.noi_dung.trim(),
    createdAt: row.created_at,
  };
}

export async function fetchComments(photoId: string): Promise<CommentRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("binh_luan")
    .select("id, photo_id, ten, noi_dung, created_at")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(120);
  if (error) throw new Error(error.message);
  return (data ?? []).map(asComment);
}

export async function addComment(photoId: string, body: string): Promise<CommentRow> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const ten = randomGuestName().slice(0, maxName);
  const noi_dung = body.trim().slice(0, maxBody);
  if (!noi_dung) {
    throw new Error("Viết vài chữ rồi gửi nhé.");
  }

  const { data, error } = await supabase
    .from("binh_luan")
    .insert({ photo_id: photoId, ten, noi_dung })
    .select("id, photo_id, ten, noi_dung, created_at")
    .single();

  if (error || !data) {
    const missing = /schema cache|does not exist|binh_luan/i.test(error?.message ?? "");
    throw new Error(
      missing
        ? "Chưa mở bình luận. Trong SQL editor, chạy file supabase/binh_luan.sql."
        : error?.message || "Không gửi được lời nhắn.",
    );
  }

  return asComment(data);
}

export { maxBody };
