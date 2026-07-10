export interface Media {
  id: string;
  filename: string;
  original_url: string;
  thumbnail_url: string | null;
  type: "photo" | "video";
  size: number;
  width: number | null;
  height: number | null;
  caption: string | null;
  tags: string[];
  taken_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaInput {
  filename: string;
  original_url: string;
  thumbnail_url?: string;
  type: "photo" | "video";
  size: number;
  width?: number;
  height?: number;
  caption?: string;
  tags?: string[];
  taken_at?: string;
}

export interface MediaUpdate {
  filename?: string;
  caption?: string;
  tags?: string[];
}
