export type Shape = 
  // Standard
  | 'rounded-3xl' 
  | 'rounded-t-[3rem] rounded-b-2xl' 
  | 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' 
  | 'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl'
  | 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl'
  | 'rounded-t-xl rounded-b-[4rem]'
  | 'rounded-l-xl rounded-r-[4rem]'
  | 'rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md'
  // Geometric & Organic
  | 'rounded-[2rem] rounded-tr-none'
  | 'rounded-[2.5rem] rounded-bl-none'
  | 'rounded-[3rem] rounded-t-lg'
  | 'rounded-[1.5rem] rounded-tr-[5rem]'
  | 'rounded-2xl'
  | 'rounded-none rounded-tr-3xl rounded-bl-3xl'
  | 'rounded-[4rem] rounded-tr-none rounded-bl-none'
  | 'rounded-t-full rounded-b-lg'
  | 'rounded-b-full rounded-t-lg'
  | 'rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-none rounded-bl-none'
  | 'rounded-[2rem] rounded-tl-none rounded-br-none'
  | 'rounded-l-[3rem] rounded-r-lg'
  | 'rounded-r-[3rem] rounded-l-lg'
  | 'rounded-[3rem] rounded-br-lg'
  | 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4rem]'
  | 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[4rem]'
  | 'rounded-lg'
  | 'rounded-[50px]';

export type ColorTheme = 
  // Original
  | 'rose' | 'blue' | 'green' | 'yellow' | 'violet' 
  | 'orange' | 'slate' | 'teal' | 'cyan' | 'lime' 
  | 'fuchsia' | 'emerald' | 'indigo' | 'stone' | 'neutral'
  // Expansion (Pastikan ini ada biar gak error)
  | 'mint' | 'graphite' | 'cherry' | 'gold' | 'lavender' 
  | 'sky' | 'salmon' | 'charcoal' | 'coffee' | 'lilac';

export interface Note {
  id: string;
  title: string;
  content: string; // HTML string
  folderId: string | null;
  color: ColorTheme;
  shape: Shape;
  icon: string;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color: ColorTheme;
  shape: Shape;
}

export interface AppState {
  notes: Note[];
  folders: Folder[];
}
