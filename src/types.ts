import { Shape, ColorTheme } from './type';

export type Theme = 'light' | 'dark';

// 2. Kita definisikan tipe data Note dan Folder di sini
// (Karena file type.ts lu cuma punya Shape & ColorTheme)

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
  color?: ColorTheme;
  shape?: Shape; // Ini make shape dari file type.ts lu
  icon?: string;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  isSystem?: boolean;
  color?: ColorTheme;
  shape?: Shape; // Ini make shape dari file type.ts lu
}

export interface ExportData {
  version: number;
  timestamp: number;
  notes: Note[];
  folders: Folder[];
}

// 3. Kita export ulang biar bisa dipake di file lain
export type { Shape, ColorTheme };
