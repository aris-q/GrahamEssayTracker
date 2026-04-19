import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export interface EssayRow {
  id: string;
  title: string;
  url: string;
  status: "done" | "reread_worthy" | "need_to_reread" | null;
  length: "short" | "medium" | "long" | null;
  date_read: string | null;
  comments: string;
}
