import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, PanInfo, useDragControls, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
  Trash2, X, Palette, Sun, Moon, Folder as FolderIcon,
  Check, Minimize2, Maximize2, Search, Heart, Download, Upload, 
  AlertCircle, Plus, CornerDownLeft, 
  Undo, Redo, Pin, PinOff, Star, RefreshCcw, Layers, FileText, Settings,
  // Icons for Constants
  Zap, Coffee, Cloud, Music, Camera, MapPin, Smile, Book, Anchor, Feather, Key, Gift, Bell, Crown, 
  Gamepad, Headphones, Umbrella, Scissors, Atom, FlaskConical, Dna, Microscope, Calculator, 
  Sigma, Brain, Globe, Hourglass, Compass, Telescope, GraduationCap, Archive, Grid, Layout, Clock, AlertTriangle, MoreVertical,
  FilePlus, FolderPlus, Sparkles, Wand2, Languages, Eraser, Bot, Loader2, Copy, Eye, EyeOff
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- TYPES (Inlined for Stability) ---
export type Shape = 
  | 'rounded-3xl' | 'rounded-t-[3rem] rounded-b-2xl' | 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' 
  | 'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl' | 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl'
  | 'rounded-t-xl rounded-b-[4rem]' | 'rounded-l-xl rounded-r-[4rem]' | 'rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md'
  | 'rounded-[2rem] rounded-tr-none' | 'rounded-[2.5rem] rounded-bl-none' | 'rounded-[3rem] rounded-t-lg'
  | 'rounded-[1.5rem] rounded-tr-[5rem]' | 'rounded-2xl' | 'rounded-none rounded-tr-3xl rounded-bl-3xl'
  | 'rounded-[4rem] rounded-tr-none rounded-bl-none' | 'rounded-t-full rounded-b-lg' | 'rounded-b-full rounded-t-lg'
  | 'rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-none rounded-bl-none' | 'rounded-[2rem] rounded-tl-none rounded-br-none'
  | 'rounded-l-[3rem] rounded-r-lg' | 'rounded-r-[3rem] rounded-l-lg' | 'rounded-[3rem] rounded-br-lg'
  | 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4rem]' | 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[4rem]'
  | 'rounded-lg' | 'rounded-[50px]';

export type ColorTheme = 
  | 'rose' | 'blue' | 'green' | 'yellow' | 'violet' | 'orange' | 'slate' | 'teal' | 'cyan' | 'lime' 
  | 'fuchsia' | 'emerald' | 'indigo' | 'stone' | 'neutral' | 'mint' | 'graphite' | 'cherry' | 'gold' | 'lavender' 
  | 'sky' | 'salmon' | 'charcoal' | 'coffee' | 'lilac';

export type AppThemeColor = 'default' | 'violet' | 'blue' | 'green' | 'orange' | 'rose' | 'yellow' | 'teal' | 'indigo' | 'lime' | 'fuchsia';

export interface Note {
  id: string; title: string; content: string; folderId: string | null; color: ColorTheme; shape: Shape; icon: string; updatedAt: number;
  isPinned?: boolean; isDeleted?: boolean; deletedAt?: number;
}
export interface Folder {
  id: string; name: string; color: ColorTheme; shape: Shape;
  isPinned?: boolean; isDeleted?: boolean;
}

// --- CONSTANTS (Inlined) ---
const springTransition = { type: "spring", stiffness: 400, damping: 30, mass: 1 };

export const APP_THEMES: Record<AppThemeColor, { bg: string, text: string, ring: string, hover: string, border: string, lightBg: string, tabActive: string }> = {
    default: { bg: 'bg-zinc-900', text: 'text-zinc-900', ring: 'ring-zinc-900', hover: 'hover:bg-zinc-100', border: 'border-zinc-200', lightBg: 'bg-[#fdfdfd]', tabActive: '!bg-zinc-900 !text-white' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-600', ring: 'ring-violet-600', hover: 'hover:bg-violet-50', border: 'border-violet-200', lightBg: 'bg-violet-50/30', tabActive: '!bg-violet-600 !text-white' },
    blue:   { bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-600', hover: 'hover:bg-blue-50', border: 'border-blue-200', lightBg: 'bg-blue-50/30', tabActive: '!bg-blue-600 !text-white' },
    green:  { bg: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-600', hover: 'hover:bg-emerald-50', border: 'border-emerald-200', lightBg: 'bg-emerald-50/30', tabActive: '!bg-emerald-600 !text-white' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', ring: 'ring-orange-600', hover: 'hover:bg-orange-50', border: 'border-orange-200', lightBg: 'bg-orange-50/30', tabActive: '!bg-orange-600 !text-white' },
    rose:   { bg: 'bg-rose-600', text: 'text-rose-600', ring: 'ring-rose-600', hover: 'hover:bg-rose-50', border: 'border-rose-200', lightBg: 'bg-rose-50/30', tabActive: '!bg-rose-600 !text-white' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-500', hover: 'hover:bg-yellow-50', border: 'border-yellow-200', lightBg: 'bg-yellow-50/30', tabActive: '!bg-yellow-500 !text-black' }, // Text black for yellow visibility
    teal:   { bg: 'bg-teal-600', text: 'text-teal-600', ring: 'ring-teal-600', hover: 'hover:bg-teal-50', border: 'border-teal-200', lightBg: 'bg-teal-50/30', tabActive: '!bg-teal-600 !text-white' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-600', hover: 'hover:bg-indigo-50', border: 'border-indigo-200', lightBg: 'bg-indigo-50/30', tabActive: '!bg-indigo-600 !text-white' },
    lime:   { bg: 'bg-lime-600', text: 'text-lime-600', ring: 'ring-lime-600', hover: 'hover:bg-lime-50', border: 'border-lime-200', lightBg: 'bg-lime-50/30', tabActive: '!bg-lime-600 !text-black' },
    fuchsia:{ bg: 'bg-fuchsia-600', text: 'text-fuchsia-600', ring: 'ring-fuchsia-600', hover: 'hover:bg-fuchsia-50', border: 'border-fuchsia-200', lightBg: 'bg-fuchsia-50/30', tabActive: '!bg-fuchsia-600 !text-white' },
};

export const LIGHT_COLORS: Record<ColorTheme, string> = {
  rose: 'bg-rose-300 text-rose-950', blue: 'bg-blue-300 text-blue-950', green: 'bg-green-300 text-green-950', yellow: 'bg-amber-300 text-amber-950',
  violet: 'bg-violet-300 text-violet-950', orange: 'bg-orange-300 text-orange-950', slate: 'bg-slate-300 text-slate-950', teal: 'bg-teal-300 text-teal-950',
  cyan: 'bg-cyan-300 text-cyan-950', lime: 'bg-lime-300 text-lime-950', fuchsia: 'bg-fuchsia-300 text-fuchsia-950', emerald: 'bg-emerald-300 text-emerald-950',
  indigo: 'bg-indigo-300 text-indigo-950', stone: 'bg-stone-300 text-stone-950', neutral: 'bg-neutral-300 text-neutral-950', mint: 'bg-emerald-200 text-emerald-900',
  graphite: 'bg-zinc-400 text-zinc-950', cherry: 'bg-red-300 text-red-950', gold: 'bg-yellow-400 text-yellow-950', lavender: 'bg-purple-300 text-purple-950',
  sky: 'bg-sky-300 text-sky-950', salmon: 'bg-red-200 text-red-950', charcoal: 'bg-gray-400 text-gray-950', coffee: 'bg-amber-400 text-amber-950', lilac: 'bg-fuchsia-200 text-fuchsia-950',
};

export const DARK_COLORS: Record<ColorTheme, string> = {
  rose: 'bg-rose-800 text-rose-50', blue: 'bg-blue-800 text-blue-50', green: 'bg-green-800 text-green-50', yellow: 'bg-amber-700 text-amber-50',
  violet: 'bg-violet-800 text-violet-50', orange: 'bg-orange-800 text-orange-50', slate: 'bg-slate-700 text-slate-50', teal: 'bg-teal-800 text-teal-50',
  cyan: 'bg-cyan-800 text-cyan-50', lime: 'bg-lime-800 text-lime-50', fuchsia: 'bg-fuchsia-800 text-fuchsia-50', emerald: 'bg-emerald-800 text-emerald-50',
  indigo: 'bg-indigo-800 text-indigo-50', stone: 'bg-stone-700 text-stone-50', neutral: 'bg-neutral-700 text-neutral-50', mint: 'bg-emerald-900 text-emerald-100',
  graphite: 'bg-zinc-800 text-zinc-100', cherry: 'bg-red-900 text-red-100', gold: 'bg-yellow-800 text-yellow-100', lavender: 'bg-purple-900 text-purple-100',
  sky: 'bg-sky-800 text-sky-100', salmon: 'bg-red-900 text-red-50', charcoal: 'bg-gray-800 text-gray-100', coffee: 'bg-amber-900 text-amber-100', lilac: 'bg-fuchsia-900 text-fuchsia-100',
};

export const SHAPES: Shape[] = [
  'rounded-3xl', 'rounded-t-[3rem] rounded-b-2xl', 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl',
  'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl', 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl',
  'rounded-t-xl rounded-b-[4rem]', 'rounded-l-xl rounded-r-[4rem]', 'rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md',
  'rounded-[2rem] rounded-tr-none', 'rounded-[2.5rem] rounded-bl-none', 'rounded-[3rem] rounded-t-lg',
  'rounded-[1.5rem] rounded-tr-[5rem]', 'rounded-2xl', 'rounded-none rounded-tr-3xl rounded-bl-3xl',
  'rounded-[4rem] rounded-tr-none rounded-bl-none', 'rounded-t-full rounded-b-lg', 'rounded-b-full rounded-t-lg',
  'rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-none rounded-bl-none', 'rounded-[2rem] rounded-tl-none rounded-br-none',
  'rounded-l-[3rem] rounded-r-lg', 'rounded-r-[3rem] rounded-l-lg', 'rounded-[3rem] rounded-br-lg',
  'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4rem]', 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[4rem]',
  'rounded-lg', 'rounded-[50px]'
];

export const ICONS: Record<string, React.ElementType> = {
  'file-text': FileText, 'star': Star, 'heart': Heart, 'zap': Zap, 'coffee': Coffee, 
  'sun': Sun, 'moon': Moon, 'cloud': Cloud, 'music': Music, 'camera': Camera, 
  'map-pin': MapPin, 'smile': Smile, 'folder': FolderIcon, 'book': Book, 
  'anchor': Anchor, 'feather': Feather, 'key': Key, 'gift': Gift, 'bell': Bell, 
  'crown': Crown, 'gamepad': Gamepad, 'headphones': Headphones, 'umbrella': Umbrella, 
  'scissors': Scissors, 'atom': Atom, 'flask': FlaskConical, 'dna': Dna, 
  'microscope': Microscope, 'calc': Calculator, 'sigma': Sigma, 'brain': Brain, 
  'globe': Globe, 'hourglass': Hourglass, 'compass': Compass, 'telescope': Telescope, 
  'grad': GraduationCap, 'archive': Archive, 'grid': Grid, 'layout': Layout, 
  'clock': Clock, 'alert': AlertTriangle
};

// --- Custom Hooks ---

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const useVisualViewport = () => {
  const [viewport, setViewport] = useState({ 
    height: typeof window !== 'undefined' ? window.innerHeight : 0, 
    offsetTop: 0 
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.visualViewport) {
        setViewport({ height: window.visualViewport.height, offsetTop: window.visualViewport.offsetTop });
      } else {
        setViewport({ height: window.innerHeight, offsetTop: 0 });
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return viewport;
};

// --- GEMINI AI HELPER ---
const generateAIContent = async (prompt: string, apiKey: string) => {
    if (!apiKey) return "API Key belum diatur. Silakan masukkan di pengaturan.";
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        const data = await response.json();
        if (data.error) {
             return `Error: ${data.error.message}`;
        }
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak dapat menghasilkan respons saat ini.";
    } catch (error) {
        console.error("AI Error:", error);
        return "Terjadi kesalahan koneksi. Silakan coba lagi.";
    }
};

// --- Helper Components ---

const IconButton = ({ onClick, icon: Icon, className = "", active = false, activeClass = "bg-zinc-800 text-white" }: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    className={`p-3 rounded-full transition-transform active:scale-90 flex-shrink-0 flex items-center justify-center ${active ? activeClass : 'hover:bg-black/10 text-inherit'} ${className}`}
  >
    <Icon size={24} />
  </button>
);

const ToolbarButton = ({ onClick, icon: Icon, active = false, isDark, appTheme }: any) => {
    const theme = APP_THEMES[appTheme as AppThemeColor];
    return (
      <button 
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`p-3 rounded-xl transition-colors flex-shrink-0 ${active ? `${theme.bg} text-white` : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'}`}
      >
        <Icon size={20} />
      </button>
    );
}

// --- Modals ---

const AIActionModal = ({ isOpen, onClose, noteContent, onApply, isDark, appTheme, apiKey }: any) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const theme = APP_THEMES[appTheme as AppThemeColor];
    
    useEffect(() => { if(isOpen) setResult(''); }, [isOpen]);

    if (!isOpen) return null;

    const handleAction = async (action: string) => {
        if (!apiKey) {
            setResult("Oops! Kamu belum memasukkan API Key Gemini. Masuk ke Settings -> Masukkan API Key dulu ya.");
            return;
        }

        setIsLoading(true);
        setResult('');
        let prompt = "";
        const content = noteContent.replace(/<[^>]+>/g, ' ').trim();

        if (!content && action !== 'idea') {
            setResult("Catatan masih kosong. Tulis sesuatu dulu ya!");
            setIsLoading(false);
            return;
        }

        switch (action) {
            case 'summarize': prompt = `Ringkaslah teks berikut ini menjadi poin-poin singkat dalam bahasa Indonesia:\n\n${content}`; break;
            case 'continue': prompt = `Lanjutkan tulisan berikut ini secara logis dan kreatif (pertahankan gaya bahasa asli):\n\n${content}`; break;
            case 'fix': prompt = `Perbaiki tata bahasa, ejaan, dan tanda baca teks berikut (pertahankan bahasa asli):\n\n${content}`; break;
            case 'translate': prompt = `Terjemahkan teks berikut ke Bahasa Inggris (jika Indonesia) atau Bahasa Indonesia (jika Inggris):\n\n${content}`; break;
            case 'idea': prompt = `Berikan 5 ide topik menarik untuk ditulis di catatan harian atau jurnal.`; break;
        }

        const res = await generateAIContent(prompt, apiKey);
        setResult(res);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div className={`flex items-center gap-2 ${theme.text}`}>
                        <Sparkles size={24}/>
                        <h3 className={`text-xl font-bold`}>AI Assistant</h3>
                    </div>
                    <button onClick={onClose}><X size={24} className="opacity-50"/></button>
                </div>

                {!result && !isLoading && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => handleAction('summarize')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                            <FileText size={24} className={theme.text}/>
                            <span className="font-medium text-sm">Ringkas</span>
                        </button>
                        <button onClick={() => handleAction('continue')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                            <Wand2 size={24} className={theme.text}/>
                            <span className="font-medium text-sm">Lanjutkan</span>
                        </button>
                        <button onClick={() => handleAction('fix')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                            <Eraser size={24} className={theme.text}/>
                            <span className="font-medium text-sm">Perbaiki</span>
                        </button>
                        <button onClick={() => handleAction('translate')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                            <Languages size={24} className={theme.text}/>
                            <span className="font-medium text-sm">Translate</span>
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-70">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <Loader2 size={40} className={theme.text}/>
                        </motion.div>
                        <p className="mt-4 font-medium text-sm">Sedang berpikir...</p>
                    </div>
                )}

                {result && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className={`p-4 rounded-2xl mb-4 text-sm leading-relaxed overflow-y-auto max-h-[40vh] ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                            {result}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { onApply(result, 'append'); onClose(); }} className={`flex-1 py-3 rounded-xl font-bold text-white ${theme.bg}`}>
                                + Tambah
                            </button>
                             <button onClick={() => { onApply(result, 'replace'); onClose(); }} className={`flex-1 py-3 rounded-xl font-bold border ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}>
                                Ganti
                            </button>
                             <button onClick={() => { navigator.clipboard.writeText(result); onClose(); }} className={`p-3 rounded-xl font-bold border ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}>
                                <Copy size={20}/>
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDark, message, actionLabel = "Delete" }: any) => {
  const [suppress, setSuppress] = useState(false);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4"><AlertCircle size={32}/></div>
          <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
          <p className="opacity-60 text-sm">{message || "This action cannot be undone."}</p>
        </div>
        <div className="flex items-center gap-2 mb-6 justify-center opacity-70 cursor-pointer" onClick={() => setSuppress(!suppress)}>
           <div className={`w-5 h-5 rounded border-2 border-current flex items-center justify-center ${suppress ? 'bg-indigo-500 border-indigo-500 text-white' : ''}`}>
              {suppress && <Check size={14}/>}
           </div>
           <span className="text-xs font-medium">Don't remind me again</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium opacity-60 hover:opacity-100 hover:bg-black/5">Cancel</button>
          <button onClick={() => onConfirm(suppress)} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600">{actionLabel}</button>
        </div>
      </motion.div>
    </div>
  );
}

const MoveDialog = ({ isOpen, onClose, onConfirm, folders, isDark, selectedCount, appTheme }: any) => {
    const [selectedTarget, setSelectedTarget] = useState<string | 'root' | null>(null);
    const theme = APP_THEMES[appTheme as AppThemeColor];

    useEffect(() => { if (isOpen) setSelectedTarget(null); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition}
               className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[80vh] ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`} onClick={e => e.stopPropagation()}
            >
               <div className="flex justify-between items-center mb-4 flex-none">
                   <h3 className="text-xl font-bold">Move ({selectedCount})</h3>
                   <button onClick={onClose}><X size={24} className="opacity-50"/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                  <button onClick={() => setSelectedTarget('root')} className={`w-full p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition-all ${selectedTarget === 'root' ? `${theme.bg} text-white` : 'hover:bg-black/5'}`}><CornerDownLeft size={20}/> Dashboard (Home)</button>
                  {folders.map((f: Folder) => (
                     <button key={f.id} onClick={() => setSelectedTarget(f.id)} className={`w-full p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition-all ${selectedTarget === f.id ? `${theme.bg} text-white` : 'hover:bg-black/5'}`}><FolderIcon size={20}/> {f.name}</button>
                  ))}
               </div>
               <div className="flex gap-3 flex-none mt-auto pt-2 border-t border-black/5">
                   <button onClick={onClose} className="flex-1 py-3 font-medium opacity-50 hover:opacity-100">Cancel</button>
                   <button disabled={!selectedTarget} onClick={() => { if (selectedTarget) { onConfirm(selectedTarget === 'root' ? null : selectedTarget); }}} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${selectedTarget ? theme.bg : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-50'}`}>Move</button>
               </div>
            </motion.div>
         </div>
    );
};

const NoteSettingsModal = ({ isOpen, onClose, note, onUpdate, isDark, colors, appTheme }: any) => {
    if (!isOpen || !note) return null;
    const theme = APP_THEMES[appTheme as AppThemeColor];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Note Settings</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button></div>
                <div className="mb-6 p-4 rounded-2xl bg-black/5 flex justify-between items-center">
                   <div className="flex items-center gap-3"><Pin size={20} className={note.isPinned ? theme.text : "opacity-50"} /><span className="font-bold">Pin Note</span></div>
                   <button onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })} className={`w-12 h-7 rounded-full transition-colors relative ${note.isPinned ? theme.bg : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${note.isPinned ? 'left-6' : 'left-1'}`} />
                   </button>
                </div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4><div className="flex flex-wrap gap-3">{Object.keys(colors).map(c => { const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0]; const isActive = note.color === c; return (<button key={c} onClick={() => onUpdate(note.id, {color: c})} className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? `ring-4 ring-offset-2 ${theme.ring} dark:ring-offset-zinc-900` : ''}`} />) })}</div></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4><div className="grid grid-cols-4 gap-3">{SHAPES.slice(0, 12).map((s,i) => <button key={i} onClick={() => onUpdate(note.id, {shape: s})} className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${note.shape === s ? `!opacity-100 ring-2 ${theme.ring}` : ''}`} />)}</div></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Icon</h4><div className="grid grid-cols-6 gap-2">{Object.keys(ICONS).map(k => { const I = ICONS[k]; return <button key={k} onClick={() => onUpdate(note.id, {icon: k})} className={`p-2 hover:bg-black/5 rounded flex items-center justify-center ${note.icon === k ? `${theme.text} ${theme.bg} bg-opacity-10` : ''}`}><I size={20}/></button> })}</div></div>
            </motion.div>
        </div>
    );
};

const FolderSettingsModal = ({ isOpen, onClose, folder, onUpdate, isDark, colors, appTheme }: any) => {
    if (!isOpen || !folder) return null;
    const theme = APP_THEMES[appTheme as AppThemeColor];
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Folder Settings</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-2 uppercase tracking-wider">Rename</h4><input value={folder.name} onChange={(e) => onUpdate(folder.id, { name: e.target.value })} className={`w-full p-3 rounded-xl text-lg font-medium outline-none ${isDark ? 'bg-zinc-800 focus:bg-zinc-700' : 'bg-zinc-100 focus:bg-zinc-200'}`} /></div>
                <div className="mb-6 p-4 rounded-2xl bg-black/5 flex justify-between items-center">
                   <div className="flex items-center gap-3"><Pin size={20} className={folder.isPinned ? theme.text : "opacity-50"} /><span className="font-bold">Pin Folder</span></div>
                   <button onClick={() => onUpdate(folder.id, { isPinned: !folder.isPinned })} className={`w-12 h-7 rounded-full transition-colors relative ${folder.isPinned ? theme.bg : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${folder.isPinned ? 'left-6' : 'left-1'}`} />
                   </button>
                </div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4><div className="flex flex-wrap gap-3">{Object.keys(colors).map(c => { const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0]; const isActive = folder.color === c; return (<button key={c} onClick={() => onUpdate(folder.id, {color: c})} className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? `ring-4 ring-offset-2 ${theme.ring} dark:ring-offset-zinc-900` : ''}`} />) })}</div></div>
                <div><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4><div className="grid grid-cols-4 gap-3">{SHAPES.slice(0, 12).map((s,i) => <button key={i} onClick={() => onUpdate(folder.id, {shape: s})} className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${folder.shape === s ? `!opacity-100 ring-2 ${theme.ring}` : ''}`} />)}</div></div>
            </motion.div>
        </div>
    )
}

// --- MAIN SETTINGS MODAL ---
const SettingsModal = ({ isOpen, onClose, isDark, toggleTheme, onExport, onImport, appTheme, setAppTheme, apiKey, setApiKey }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showKey, setShowKey] = useState(false);
  
  if (!isOpen) return null;
  const theme = APP_THEMES[appTheme as AppThemeColor];
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Desnote</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button>
        </div>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
             {/* THEME SELECTOR */}
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Material You Theme</h4>
                <div className="flex flex-wrap gap-2 justify-start">
                    {Object.keys(APP_THEMES).map((key) => {
                        const t = APP_THEMES[key as AppThemeColor];
                        return (
                            <button 
                                key={key} 
                                onClick={() => setAppTheme(key)}
                                title={key}
                                className={`w-8 h-8 rounded-full ${t.bg} transition-transform active:scale-90 ${appTheme === key ? 'ring-4 ring-offset-2 ring-current dark:ring-offset-zinc-800' : ''}`}
                            />
                        )
                    })}
                </div>
            </div>

             {/* API KEY INPUT */}
             <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className={theme.text}/>
                    <h4 className="text-xs font-bold opacity-50 uppercase tracking-wider">Gemini API Key</h4>
                </div>
                <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"} 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your API Key here..."
                        className={`w-full p-3 rounded-xl text-sm font-medium outline-none pr-10 ${isDark ? 'bg-zinc-900 focus:bg-zinc-950' : 'bg-white focus:bg-zinc-50'}`}
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-3 opacity-50 hover:opacity-100"
                    >
                        {showKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
                <p className="text-[10px] mt-2 opacity-60 leading-tight">
                    API Key is stored locally on your device. We do not store or share your key.
                </p>
            </div>

            <div className="space-y-1">
                <button onClick={toggleTheme} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                    {isDark ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className={theme.text} />}
                    <span className="font-medium text-lg">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button onClick={onExport} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                    <Download size={22} className="text-blue-500"/>
                    <span className="font-medium text-lg">Backup Data (JSON)</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                    <Upload size={22} className="text-green-500"/>
                    <span className="font-medium text-lg">Import Data</span>
                    <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={onImport}/>
                </button>
            </div>
            
            <a href="https://saweria.co/Densl" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-colors">
                 <Heart size={20} fill="black" />
                 <span>Support on Saweria</span>
            </a>
        </div>
        
        <div className="mt-6 text-center opacity-50 text-sm font-medium">
           v1.4 • Made with 🖤 in Jakarta
        </div>
      </motion.div>
    </div>
  );
};

// --- Note Editor ---
const NoteEditor = ({ note, onUpdate, onClose, onDelete, isDark, showSettings, onCloseSettings, onOpenSettings, appTheme, apiKey }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { height: viewportHeight, offsetTop } = useVisualViewport();
  const [showAI, setShowAI] = useState(false);

  if (!note) return null;

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const bgClass = isDark ? 'bg-[#121212]' : (colors[note.color] || colors.slate).split(' ')[0];
  const textClass = isDark ? 'text-white' : (colors[note.color] || colors.slate).split(' ')[1];
  const themeClass = `${bgClass} ${textClass}`;
  const theme = APP_THEMES[appTheme as AppThemeColor];
  
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const checkFormats = () => {
    const formats = [];
    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    if (document.queryCommandState('underline')) formats.push('underline');
    if (document.queryCommandState('justifyLeft')) formats.push('justifyLeft');
    if (document.queryCommandState('justifyCenter')) formats.push('justifyCenter');
    if (document.queryCommandState('justifyRight')) formats.push('justifyRight');
    if (document.queryCommandState('insertUnorderedList')) formats.push('insertUnorderedList');
    setActiveFormats(formats);
  };
  const format = (cmd: string, val?: string) => { editorRef.current?.focus(); setTimeout(() => { document.execCommand(cmd, false, val); checkFormats(); }, 0); };
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== note.content) { editorRef.current.innerHTML = note.content; } }, []);

  const handleAIApply = (text: string, mode: 'replace' | 'append') => {
      const newContent = mode === 'replace' ? text : (note.content + "<br/><br/>" + text);
      onUpdate(note.id, { content: newContent });
      if (editorRef.current) editorRef.current.innerHTML = newContent;
  }

  return (
    <div 
        className={`fixed left-0 w-full z-[100] flex flex-col ${themeClass}`}
        style={{ height: viewportHeight, top: offsetTop, transition: 'height 0.1s ease-out' }}
    >
       <NoteSettingsModal isOpen={showSettings} onClose={onCloseSettings} note={note} onUpdate={onUpdate} isDark={isDark} colors={colors} appTheme={appTheme} />
       <AIActionModal isOpen={showAI} onClose={() => setShowAI(false)} noteContent={note.content} onApply={handleAIApply} isDark={isDark} appTheme={appTheme} apiKey={apiKey} />

       <div className={`flex-none flex justify-between items-center p-4 bg-transparent`}>
          <button onClick={onClose} className={`p-3 rounded-full hover:bg-white/10`}><ArrowLeft/></button>
          <div className="flex gap-2 relative items-center">
             <IconButton icon={Sparkles} onClick={() => setShowAI(true)} className={`${theme.text} bg-white/10`} />
             <div className="w-px h-6 bg-current opacity-20 mx-1 self-center flex-shrink-0"/>
             <IconButton icon={note.isPinned ? PinOff : Pin} onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })} className={note.isPinned ? theme.text : "opacity-50"} />
             <IconButton icon={Undo} onClick={() => document.execCommand('undo')} />
             <IconButton icon={Redo} onClick={() => document.execCommand('redo')} />
             <IconButton icon={Palette} onClick={onOpenSettings} />
             <IconButton icon={Trash2} onClick={onDelete} className="text-current hover:bg-red-500/20" />
          </div>
       </div>
       <div className={`flex-1 overflow-y-auto px-6 py-6 bg-transparent`}>
          <div className="max-w-4xl mx-auto pb-4">
              <input value={note.title} onChange={(e) => onUpdate(note.id, {title: e.target.value})} placeholder="Title" className="w-full bg-transparent text-4xl font-bold outline-none mb-6 placeholder-current/30 text-left" dir="ltr" />
              <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(e) => { onUpdate(note.id, {content: e.currentTarget.innerHTML}); checkFormats(); }} onKeyUp={checkFormats} onMouseUp={checkFormats} onTouchEnd={checkFormats} className="outline-none text-xl leading-relaxed min-h-[30vh] empty:before:content-['Type_something...'] empty:before:opacity-50 text-left [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dir="ltr" />
          </div>
       </div>
       <div className={`flex-none w-full p-2 border-t border-black/5 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start px-4 md:justify-center">
             <ToolbarButton icon={Bold} onClick={() => format('bold')} active={activeFormats.includes('bold')} isDark={isDark} appTheme={appTheme} />
             <ToolbarButton icon={Italic} onClick={() => format('italic')} active={activeFormats.includes('italic')} isDark={isDark} appTheme={appTheme} />
             <ToolbarButton icon={Underline} onClick={() => format('underline')} active={activeFormats.includes('underline')} isDark={isDark} appTheme={appTheme} />
             <div className="w-px h-6 bg-current opacity-20 mx-2 self-center flex-shrink-0"/>
             <ToolbarButton icon={List} onClick={() => format('insertUnorderedList')} active={activeFormats.includes('insertUnorderedList')} isDark={isDark} appTheme={appTheme} />
             <ToolbarButton icon={AlignLeft} onClick={() => format('justifyLeft')} active={activeFormats.includes('justifyLeft')} isDark={isDark} appTheme={appTheme} />
             <ToolbarButton icon={AlignCenter} onClick={() => format('justifyCenter')} active={activeFormats.includes('justifyCenter')} isDark={isDark} appTheme={appTheme} />
             <ToolbarButton icon={AlignRight} onClick={() => format('justifyRight')} active={activeFormats.includes('justifyRight')} isDark={isDark} appTheme={appTheme} />
          </div>
       </div>
    </div>
  );
};

// --- FAB COMPONENT ---
const FloatingActionButton = ({ isOpen, onToggle, onCreateNote, onCreateFolder, appTheme, isDark }: any) => {
    const theme = APP_THEMES[appTheme as AppThemeColor];

    return (
        <div className="fixed bottom-6 right-6 z-[95] flex flex-col items-end gap-3">
             <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.button
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                            onClick={() => { onCreateFolder(); onToggle(); }}
                            className={`flex items-center gap-2 pr-5 pl-4 py-3 rounded-full shadow-lg font-bold backdrop-blur-md border ${isDark ? 'bg-zinc-800/90 border-zinc-700 text-white' : 'bg-white/90 border-white text-zinc-800'}`}
                        >
                            <FolderPlus size={20} className={theme.text} />
                            <span>Folder</span>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => { onCreateNote(); onToggle(); }}
                            className={`flex items-center gap-2 pr-5 pl-4 py-3 rounded-full shadow-lg font-bold backdrop-blur-md border ${isDark ? 'bg-zinc-800/90 border-zinc-700 text-white' : 'bg-white/90 border-white text-zinc-800'}`}
                        >
                            <FilePlus size={20} className={theme.text} />
                            <span>Note</span>
                        </motion.button>
                    </>
                )}
            </AnimatePresence>
            
            <button 
                onClick={onToggle}
                className={`w-16 h-16 rounded-[1.2rem] shadow-xl flex items-center justify-center text-white transition-all active:scale-90 ${theme.bg} ${theme.ring} hover:brightness-110`}
            >
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
                    <Plus size={32} />
                </motion.div>
            </button>
        </div>
    )
}

// --- Main App Logic ---
type TabType = 'all' | 'favorites' | 'folders' | 'notes' | 'trash';

export default function App() {
  const [isDark, setIsDark] = useLocalStorage<boolean>('desnote-theme', false);
  const [appTheme, setAppTheme] = useLocalStorage<AppThemeColor>('desnote-app-theme', 'default');
  const [suppressDelete, setSuppressDelete] = useLocalStorage<boolean>('suppress_delete', false);
  const [apiKey, setApiKey] = useLocalStorage<string>('desnote-api-key', '');
  const [isFabOpen, setIsFabOpen] = useState(false);

  useEffect(() => { if (isDark) { document.body.classList.add('dark'); } else { document.body.classList.remove('dark'); } }, [isDark]);

  const [notes, setNotes] = useLocalStorage<Note[]>('desnote-notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('desnote-folders', [
    { id: '1', name: 'Personal', color: 'rose', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' },
    { id: '2', name: 'Work', color: 'blue', shape: 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' }
  ]);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [peekingNoteId, setPeekingNoteId] = useState<string | null>(null); 
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: string, id: string | null, actionLabel?: string, message?: string}>({isOpen: false, type: '', id: null});
  const [folderSettingsId, setFolderSettingsId] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showNoteSettings, setShowNoteSettings] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const theme = APP_THEMES[appTheme as AppThemeColor];

  // History Pop State Handling
  const historyPopped = useRef(false);
  useEffect(() => {
    if (!historyPopped.current) {
        if (activeNoteId || expandedFolderId || peekingNoteId || showSettingsModal || isSelectionMode || showNoteSettings || folderSettingsId || showMoveDialog || deleteModal.isOpen || isFabOpen) {
            window.history.pushState(null, '', window.location.href);
        }
    }
    historyPopped.current = false; 
    const handlePopState = (event: PopStateEvent) => {
      historyPopped.current = true; 
      if (isFabOpen) { setIsFabOpen(false); return; }
      if (deleteModal.isOpen) { setDeleteModal(prev => ({...prev, isOpen: false})); return; }
      if (showMoveDialog) { setShowMoveDialog(false); return; }
      if (folderSettingsId) { setFolderSettingsId(null); return; }
      if (showNoteSettings) { setShowNoteSettings(false); return; }
      if (peekingNoteId) { setPeekingNoteId(null); return; }
      if (activeNoteId) { setActiveNoteId(null); return; }
      if (expandedFolderId) { setExpandedFolderId(null); return; }
      if (showSearch) { setShowSearch(false); return; }
      if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); return; }
      if (showSettingsModal) { setShowSettingsModal(false); return; }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeNoteId, expandedFolderId, showSettingsModal, isSelectionMode, showSearch, peekingNoteId, folderSettingsId, showMoveDialog, deleteModal.isOpen, showNoteSettings, isFabOpen]);

  const getFilteredData = () => {
      let filteredNotes = notes.filter(n => activeTab === 'trash' ? n.isDeleted : !n.isDeleted);
      let filteredFolders = folders.filter(f => activeTab === 'trash' ? f.isDeleted : !f.isDeleted);
      if (activeTab === 'favorites') { filteredNotes = filteredNotes.filter(n => n.isPinned); filteredFolders = filteredFolders.filter(f => f.isPinned); } 
      else if (activeTab === 'folders') { filteredNotes = []; } 
      else if (activeTab === 'notes') { filteredFolders = []; } 
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (activeTab === 'folders') filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q));
          else if (activeTab === 'notes') filteredNotes = filteredNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
          else { filteredNotes = filteredNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)); filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q)); }
      }
      filteredNotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return { filteredNotes, filteredFolders };
  };
  const { filteredNotes, filteredFolders } = getFilteredData();

  const createNote = (folderId: string | null = null) => {
    const newNote: Note = { id: uuidv4(), title: '', content: '', folderId, color: 'slate', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl', icon: 'file-text', updatedAt: Date.now() };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };
  const createFolder = () => {
    const newFolder: Folder = { id: uuidv4(), name: 'New Folder', color: 'violet', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' };
    setFolders([...folders, newFolder]);
  };
  const executeDelete = (type: string, id: string | null) => {
      if (!id) return;
      if (activeTab === 'trash') { if (type === 'note') setNotes(prev => prev.filter(n => n.id !== id)); else setFolders(prev => prev.filter(f => f.id !== id)); } 
      else { if (type === 'note') setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true, updatedAt: Date.now() } : n)); else { setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null, updatedAt: Date.now() } : n)); setFolders(prev => prev.map(f => f.id === id ? { ...f, isDeleted: true } : f)); } }
      if (activeNoteId === id) setActiveNoteId(null);
  };
  const requestDelete = (type: string, id: string) => {
      if (activeTab === 'trash') setDeleteModal({ isOpen: true, type, id, actionLabel: "Destroy Forever", message: "Permanently delete this item?" });
      else { if (suppressDelete) executeDelete(type, id); else setDeleteModal({ isOpen: true, type, id, actionLabel: "Delete", message: "Move this item to trash?" }); }
  };
  const restoreItem = (type: string, id: string) => { if (type === 'note') setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: false, updatedAt: Date.now() } : n)); else setFolders(prev => prev.map(f => f.id === id ? { ...f, isDeleted: false } : f)); };
  const prepareMove = () => { if (selectedIds.size === 0) return; setItemsToMove(Array.from(selectedIds)); setShowMoveDialog(true); };
  const handleMoveSelected = (targetId: string | null) => { if (itemsToMove.length === 0) return; setNotes(prev => prev.map(n => itemsToMove.includes(n.id) ? { ...n, folderId: targetId, updatedAt: Date.now() } : n)); setIsSelectionMode(false); setSelectedIds(new Set()); setItemsToMove([]); setShowMoveDialog(false); };
  const toggleFavoriteSelected = () => {
      const ids = Array.from(selectedIds); if (ids.length === 0) return;
      const allPinned = ids.every(id => { const n = notes.find(x => x.id === id); if (n) return n.isPinned; const f = folders.find(x => x.id === id); if (f) return f.isPinned; return false; });
      setNotes(prev => prev.map(n => ids.includes(n.id) ? { ...n, isPinned: !allPinned } : n)); setFolders(prev => prev.map(f => ids.includes(f.id) ? { ...f, isPinned: !allPinned } : f));
      setIsSelectionMode(false); setSelectedIds(new Set());
  };
  const toggleSelection = (id: string) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
  
  const handleExport = () => {
    const data = { notes, folders, version: 1 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `desnote-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => { try { const data = JSON.parse(event.target?.result as string); if (data.notes) setNotes(data.notes); if (data.folders) setFolders(data.folders); alert('Import successful!'); setShowSettingsModal(false); } catch (err) { alert('Invalid file.'); } };
      reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#121212] text-[#f0f0f0]' : `${theme.lightBg} text-[#1a1c1e]`}`}>
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onExport={handleExport} onImport={handleImport} appTheme={appTheme} setAppTheme={setAppTheme} apiKey={apiKey} setApiKey={setApiKey} />
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({...deleteModal, isOpen: false})} isDark={isDark} message={deleteModal.message} actionLabel={deleteModal.actionLabel} onConfirm={(suppress: boolean) => { if(suppress) setSuppressDelete(true); executeDelete(deleteModal.type, deleteModal.id); setDeleteModal({...deleteModal, isOpen: false}); }} />
      <FolderSettingsModal isOpen={!!folderSettingsId} onClose={() => setFolderSettingsId(null)} folder={folders.find(f => f.id === folderSettingsId)} isDark={isDark} colors={isDark ? DARK_COLORS : LIGHT_COLORS} onUpdate={(id: string, u: any) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...u} : f))} appTheme={appTheme} />
      <MoveDialog isOpen={showMoveDialog} onClose={() => setShowMoveDialog(false)} onConfirm={handleMoveSelected} folders={folders.filter(f => !f.isDeleted)} isDark={isDark} selectedCount={itemsToMove.length} appTheme={appTheme} />

      <AnimatePresence mode="wait">
        {activeNoteId ? (
          <NoteEditor key="editor" note={notes.find(n => n.id === activeNoteId)} isDark={isDark} showSettings={showNoteSettings} onOpenSettings={() => setShowNoteSettings(true)} onCloseSettings={() => setShowNoteSettings(false)} onUpdate={(id: string, u: Partial<Note>) => setNotes(prev => prev.map(n => n.id === id ? {...n, ...u, updatedAt: Date.now()} : n))} onClose={() => setActiveNoteId(null)} onDelete={() => requestDelete('note', activeNoteId!)} appTheme={appTheme} apiKey={apiKey} />
        ) : (
          <Dashboard 
            key="dashboard" notes={filteredNotes} folders={filteredFolders} allNotes={notes} isDark={isDark} toggleSettings={() => setShowSettingsModal(true)} activeTab={activeTab} setActiveTab={setActiveTab} expandedFolderId={expandedFolderId} setExpandedFolderId={setExpandedFolderId} peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId} onOpenNote={(id: string) => { setPeekingNoteId(null); setActiveNoteId(id); }} onDeleteFolder={(id) => requestDelete('folder', id)} onDeleteNote={(id) => requestDelete('note', id)} onRestoreItem={restoreItem} onCreateNoteInFolder={createNote} isSelectionMode={isSelectionMode} selectedIds={selectedIds} setSelectedIds={setSelectedIds} setIsSelectionMode={setIsSelectionMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showSearch={showSearch} setShowSearch={setShowSearch} openFolderSettings={(id) => setFolderSettingsId(id)} onMoveClick={prepareMove} deleteSelected={() => { selectedIds.forEach(id => { const isNote = notes.some(n => n.id === id); executeDelete(isNote ? 'note' : 'folder', id); }); setIsSelectionMode(false); setSelectedIds(new Set()); }} toggleFavoriteSelected={toggleFavoriteSelected} toggleSelection={toggleSelection} appTheme={appTheme}
          />
        )}
      </AnimatePresence>

      {!activeNoteId && !isSelectionMode && activeTab !== 'trash' && (
         <FloatingActionButton isOpen={isFabOpen} onToggle={() => setIsFabOpen(!isFabOpen)} onCreateNote={() => createNote()} onCreateFolder={() => createFolder()} appTheme={appTheme} isDark={isDark} />
      )}
    </div>
  );
}

// --- Header Component ---
const Header = ({ activeTab, setActiveTab, toggleSettings, isSelectionMode, toggleSelectionMode, isDark, searchQuery, setSearchQuery, showSearch, setShowSearch, selectedCount, deleteSelected, onMoveClick, hasFolderSelected, toggleFavoriteSelected, appTheme }: any) => {
    const theme = APP_THEMES[appTheme as AppThemeColor];
    const tabs = [ { id: 'all', label: 'All', icon: Layers }, { id: 'favorites', label: 'Favorites', icon: Star }, { id: 'folders', label: 'Folders', icon: FolderIcon }, { id: 'notes', label: 'Notes', icon: FileText }, { id: 'trash', label: 'Trash', icon: Trash2 }, ];
    const getHeaderTitle = () => { if (activeTab === 'all') return "Your Space"; if (activeTab === 'favorites') return "Favorites"; if (activeTab === 'folders') return "Folders"; if (activeTab === 'notes') return "Notes"; if (activeTab === 'trash') return "Trash"; return "Desnote"; };

    return (
        <div className={`sticky top-0 z-[60] pt-4 px-4 pb-2 transition-colors duration-300 ${isDark ? 'bg-[#121212]/95' : 'bg-transparent'} backdrop-blur-md`}>
            <div className="flex justify-between items-center mb-4 min-h-[48px]">
                {isSelectionMode ? (
                     <div className="flex items-center gap-2 w-full">
                        <button onClick={toggleSelectionMode} className="p-2 -ml-2 rounded-full hover:bg-black/5"><X size={24}/></button>
                        <span className="font-bold text-lg flex-1">{selectedCount} Selected</span>
                        <button onClick={toggleFavoriteSelected} className="p-2 rounded-full hover:bg-black/5 text-yellow-500"><Star size={22} fill="currentColor"/></button>
                        <button onClick={onMoveClick} className="p-2 rounded-full hover:bg-black/5"><FolderIcon size={22}/></button>
                        <button onClick={deleteSelected} className="p-2 rounded-full bg-red-500/10 text-red-500"><Trash2 size={22}/></button>
                     </div>
                ) : (
                    <>
                        <h1 className={`text-3xl font-bold tracking-tight transition-colors ${theme.text}`}>{getHeaderTitle()}</h1>
                        <div className="flex items-center gap-1">
                             <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-full hover:bg-black/5 ${showSearch ? `${theme.text} ${theme.lightBg}` : ''}`}><Search size={24} /></button>
                             <button onClick={toggleSettings} className="p-2 rounded-full hover:bg-black/5"><Settings size={24} /></button>
                        </div>
                    </>
                )}
            </div>
            <AnimatePresence>
                {showSearch && !isSelectionMode && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                         <div className={`flex items-center px-4 py-3 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-white/50'} ring-1 ${isDark ? 'ring-zinc-700' : 'ring-zinc-200'} focus-within:ring-2 ${theme.ring}`}>
                             <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="bg-transparent w-full outline-none font-medium" />
                             {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16}/></button>}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!isSelectionMode && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <LayoutGroup>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id; const Icon = tab.icon;
                        // FIX: Ensure icon color contrasts well with the background
                        const activeClass = isActive ? theme.tabActive : (isDark ? 'bg-[#27272a] text-[#a1a1aa]' : 'bg-white text-zinc-500 border border-black/5');
                        
                        return (
                            <motion.button layout key={tab.id} onClick={() => setActiveTab(tab.id)} initial={false}
                                className={`h-10 px-4 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden transition-all duration-300 ${activeClass}`}
                            >
                                <div className={`flex items-center justify-center gap-2 relative z-10`}>
                                    <Icon size={18} />
                                    {isActive && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} className="font-semibold whitespace-nowrap text-sm">{tab.label}</motion.span>}
                                </div>
                            </motion.button>
                        )
                    })}
                    </LayoutGroup>
                </div>
            )}
        </div>
    );
}

// --- Dashboard ---
const Dashboard = ({ notes, folders, allNotes, isDark, toggleSettings, activeTab, setActiveTab, expandedFolderId, setExpandedFolderId, peekingNoteId, setPeekingNoteId, onOpenNote, onUpdateFolder, onDeleteFolder, onDeleteNote, onRestoreItem, onCreateNoteInFolder, isSelectionMode, selectedIds, setSelectedIds, setIsSelectionMode, searchQuery, setSearchQuery, showSearch, setShowSearch, deleteSelected, openFolderSettings, onMoveClick, toggleFavoriteSelected, toggleSelection, appTheme }: any) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  let displayNotes; if (activeTab === 'trash' || activeTab === 'notes') displayNotes = notes; else displayNotes = notes.filter((n: Note) => n.folderId === null);
  const handleLongPress = (id: string) => { if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([id])); } };

  return (
    <div className="pb-32 max-w-7xl mx-auto" onClick={() => { setExpandedFolderId(null); }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} toggleSettings={toggleSettings} isSelectionMode={isSelectionMode} toggleSelectionMode={() => { if(isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); } else setIsSelectionMode(true); }} isDark={isDark} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showSearch={showSearch} setShowSearch={setShowSearch} selectedCount={selectedIds.size} deleteSelected={deleteSelected} onMoveClick={onMoveClick} hasFolderSelected={Array.from(selectedIds).some(id => folders.some((f: Folder) => f.id === id))} toggleFavoriteSelected={toggleFavoriteSelected} appTheme={appTheme} />
      <div className="px-4 mt-2">
        <LayoutGroup>
            <motion.div layout transition={springTransition} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {folders.map((folder: Folder) => (
                <FolderItem key={folder.id} folder={folder} notes={allNotes.filter((n: Note) => n.folderId === folder.id && !n.isDeleted)} isExpanded={expandedFolderId === folder.id} isDark={isDark} colors={colors} onToggle={() => setExpandedFolderId(folder.id)} onClose={() => setExpandedFolderId(null)} onOpenNote={onOpenNote} onDelete={() => onDeleteFolder(folder.id)} onUpdate={onUpdateFolder} onRestore={() => onRestoreItem('folder', folder.id)} onCreateNote={() => onCreateNoteInFolder(folder.id)} isSelectionMode={isSelectionMode} isSelected={selectedIds.has(folder.id)} onSelect={() => toggleSelection(folder.id)} onDeleteNote={onDeleteNote} onSettings={() => openFolderSettings(folder.id)} peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId} isTrash={activeTab === 'trash'} onLongPress={() => handleLongPress(folder.id)} toggleSelection={toggleSelection} selectedIds={selectedIds} appTheme={appTheme} />
            ))}
            {displayNotes.map((note: Note) => (
                <NoteCard key={note.id} note={note} isDark={isDark} colors={colors} onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)} onDelete={() => onDeleteNote(note.id)} onRestore={() => onRestoreItem('note', note.id)} isSelected={selectedIds.has(note.id)} isSelectionMode={isSelectionMode} isPeeking={peekingNoteId === note.id} onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)} inFolder={false} searchQuery={searchQuery} isTrash={activeTab === 'trash'} onLongPress={() => handleLongPress(note.id)} appTheme={appTheme} />
            ))}
            </motion.div>
        </LayoutGroup>
        {folders.length === 0 && displayNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <div className="w-24 h-24 bg-current rounded-full mb-4 flex items-center justify-center">{activeTab === 'trash' ? <Trash2 size={40}/> : <Layers size={40}/>}</div>
                <p className="font-bold text-lg">Nothing here yet</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- Folder Item ---
const FolderItem = ({ folder, notes, isExpanded, isDark, colors, onToggle, onClose, onOpenNote, onDelete, onUpdate, onCreateNote, onRestore, isSelectionMode, isSelected, onSelect, onDeleteNote, onSettings, peekingNoteId, setPeekingNoteId, isTrash, onLongPress, toggleSelection, selectedIds, appTheme }: any) => {
  const themeClass = colors[folder.color] || colors.slate;
  const theme = APP_THEMES[appTheme as AppThemeColor];
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const handlePointerDown = (e: React.PointerEvent) => { if (isSelectionMode) return; startPoint.current = { x: e.clientX, y: e.clientY }; longPressTimer.current = setTimeout(() => { onLongPress(); }, 500); };
  const handlePointerUp = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
  const onPanStart = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }
  const onDragEnd = (event: any, info: PanInfo) => { if (Math.abs(info.offset.x) > 100 && !isSelectionMode && !isExpanded) { onDelete(); } };

  return (
    <motion.div layout transition={springTransition} className={`${isExpanded ? 'col-span-full' : 'col-span-1 aspect-square'}`} onClick={(e) => { e.stopPropagation(); if (isSelectionMode) onSelect(); else if (!isTrash) isExpanded ? onClose() : onToggle(); }} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ zIndex: isExpanded ? 40 : 1 }}>
        <div className={`relative w-full rounded-3xl ${isExpanded ? '' : 'h-full'}`}>
            <motion.div drag={!isExpanded && !isSelectionMode ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} onDragStart={onPanStart} onDragEnd={onDragEnd} whileTap={!isExpanded && !isSelectionMode ? { scale: 0.95 } : {}} className={`${themeClass} ${folder.shape} relative z-10 w-full ${isExpanded ? 'h-auto min-h-full pb-12' : 'h-full'} ${isSelected ? `ring-4 ${theme.ring} ring-offset-2 ring-offset-transparent` : ''}`}>
                <div className={`p-5 flex flex-col ${isExpanded ? '' : 'h-full'}`}>
                    <div className="flex justify-between items-start mb-2">
                         <div className="pr-2 relative flex-1"><h2 className="text-2xl font-bold leading-tight line-clamp-2 pr-4">{folder.name}</h2>{folder.isPinned && !isExpanded && <div className="absolute -top-1 -right-2 text-yellow-400 bg-black/10 rounded-full p-0.5 scale-75"><Star fill="currentColor" size={16}/></div>}</div>
                        {isExpanded && !isSelectionMode && <IconButton icon={Palette} onClick={(e: any) => { e.stopPropagation(); onSettings(); }} />}
                        {isTrash && <IconButton icon={RefreshCcw} onClick={(e: any) => { e.stopPropagation(); onRestore(); }} />}
                    </div>
                    {!isExpanded && <div className="text-sm opacity-60 font-medium mt-auto">{notes.length} Notes</div>}
                </div>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springTransition} className="p-4 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {notes.map((note: Note) => (
                                <NoteCard key={note.id} note={note} isDark={isDark} colors={colors} inFolder={true} onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)} isSelectionMode={isSelectionMode} isSelected={selectedIds.has(note.id)} onDelete={() => onDeleteNote(note.id)} isPeeking={peekingNoteId === note.id} onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)} onLongPress={() => toggleSelection(note.id)} appTheme={appTheme} />
                            ))}
                            <button onClick={(e) => { e.stopPropagation(); onCreateNote(); }} className={`border-2 border-dashed rounded-3xl aspect-square flex flex-col items-center justify-center opacity-50 hover:opacity-100 ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}><Plus size={32} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    </motion.div>
  );
};

// --- Note Card ---
const NoteCard = ({ note, onClick, onDelete, onRestore, inFolder, isDark, colors, isSelected, isSelectionMode, isPeeking, onPeek, searchQuery, isTrash, onLongPress, appTheme }: any) => {
  const Icon = (ICONS && ICONS[note.icon]) ? ICONS[note.icon] : FileText; 
  const themeClass = colors[note.color] || colors.slate;
  const theme = APP_THEMES[appTheme as AppThemeColor];
  const safeIsPeeking = isPeeking || false;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const handlePointerDown = () => { if (isSelectionMode || safeIsPeeking) return; longPressTimer.current = setTimeout(() => { if (onLongPress) onLongPress(); }, 500); };
  const handlePointerUp = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
  const onPanStart = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }
  const onDragEnd = (event: any, info: PanInfo) => { if (Math.abs(info.offset.x) > 100 && !isSelectionMode && !isTrash) { onDelete(); } };
  const previewText = note.content.replace(/<[^>]+>/g, ' ').trim() || "No content";

  return (
    <motion.div layout layoutId={`note-${note.id}`} transition={springTransition} className={`${safeIsPeeking ? 'col-span-2 row-span-2' : 'col-span-1 aspect-square'}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ zIndex: safeIsPeeking ? 50 : 1, position: 'relative' }}>
        <motion.div drag={!isSelectionMode && !safeIsPeeking ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} onDragStart={onPanStart} onDragEnd={onDragEnd} onClick={(e) => { e.stopPropagation(); onClick(); }} whileTap={!isSelectionMode && !safeIsPeeking ? { scale: 0.95 } : {}} className={`w-full h-full relative cursor-pointer group overflow-hidden ${themeClass} ${note.shape} ${isSelected ? `ring-4 ${theme.ring} ring-offset-2 ring-offset-transparent` : ''} ${safeIsPeeking ? 'shadow-2xl' : ''}`}>
           <div className="p-5 h-full flex flex-col relative pointer-events-none"> 
               {safeIsPeeking ? ( <div className="flex flex-col h-full overflow-hidden"> <h3 className="text-3xl font-bold mb-4 leading-tight">{note.title || "Untitled"}</h3> <div className="text-lg opacity-80 leading-relaxed overflow-hidden max-h-[300px]">{previewText}</div> </div> ) : ( <><h3 className="text-xl font-bold leading-tight line-clamp-2 relative z-10">{note.title || "Untitled"}</h3> {note.isPinned && <div className="absolute top-4 right-4 text-yellow-500 bg-black/10 rounded-full p-1"><Star fill="currentColor" size={12}/></div>} <div className="absolute bottom-4 right-4 opacity-10">{Icon && <Icon size={80} />}</div></> )}
               {isSelected && <div className={`absolute top-4 left-4 ${theme.bg} text-white p-1 rounded-full`}><Check size={16}/></div>}
           </div>
           {isTrash && ( <button onClick={(e) => {e.stopPropagation(); onRestore()}} className="absolute bottom-3 right-3 p-2 bg-white/20 rounded-full backdrop-blur pointer-events-auto"><RefreshCcw size={18}/></button> )}
           {!isSelectionMode && !isTrash && onPeek && ( <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onPeek(!safeIsPeeking); }} className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm z-20 pointer-events-auto transition-transform active:scale-90 ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>{safeIsPeeking ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button> )}
        </motion.div>
    </motion.div>
  );
};