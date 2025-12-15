import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, PanInfo, useDragControls, useScroll, useTransform } from 'framer-motion';
import { 
 ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
 FolderPlus, FilePlus, Trash2, X, Palette, Sun, Moon, Folder as FolderIcon,
 Check, Minimize2, Maximize2, Search, Heart, Menu, Download, Upload, 
 CheckSquare, AlertCircle, Plus, CornerDownLeft, 
 Undo, Redo, Star, Archive, Clock, RefreshCcw, Layers, Layout, Grid, FileText,
 MoreVertical, Share2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder, ColorTheme, Shape } from './types';
import { DARK_COLORS, LIGHT_COLORS, SHAPES, ICONS } from './constants';

// --- Constants ---
const fluidSpring = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 };
const softSpring = { type: "spring", stiffness: 200, damping: 20 };

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

// --- Helper Components ---

const IconButton = ({ onClick, icon: Icon, className = "", active = false, activeClass = "bg-zinc-800 text-white" }: any) => {
   if (!Icon) return null;
   return (
     <button 
       onClick={(e) => { e.stopPropagation(); onClick(e); }}
       className={`p-3 rounded-full transition-transform active:scale-90 flex-shrink-0 flex items-center justify-center ${active ? activeClass : 'hover:bg-black/5 text-inherit'} ${className}`}
     >
       <Icon size={24} />
     </button>
   );
};

const ToolbarButton = ({ onClick, icon: Icon, active = false, isDark }: any) => (
 <button 
   onMouseDown={(e) => { e.preventDefault(); onClick(); }}
   className={`p-3 rounded-xl transition-colors flex-shrink-0 ${active ? 'bg-indigo-600 text-white' : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'}`}
 >
   <Icon size={20} />
 </button>
);

// --- Modals ---

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDark, title = "Delete Item?", message = "This item will be moved to Trash." }: any) => {
 const [suppress, setSuppress] = useState(false);
 
 if (!isOpen) return null;
 return (
   <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
     <motion.div 
       initial={{ scale: 0.9, opacity: 0 }} 
       animate={{ scale: 1, opacity: 1 }} 
       transition={fluidSpring}
       onClick={(e) => e.stopPropagation()}
       className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
     >
       <div className="flex flex-col items-center text-center mb-6">
         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
            <Trash2 size={32}/>
         </div>
         <h3 className="text-xl font-bold mb-2">{title}</h3>
         <p className="opacity-60 text-sm">{message}</p>
       </div>

       <div className="flex items-center gap-3 mb-6 px-2 opacity-70 cursor-pointer" onClick={() => setSuppress(!suppress)}>
           <div className={`w-5 h-5 rounded border-2 border-current flex items-center justify-center ${suppress ? 'bg-indigo-500 border-indigo-500 text-white' : ''}`}>
               {suppress && <Check size={14} />}
           </div>
           <span className="text-sm font-medium">Don't ask again</span>
       </div>

       <div className="flex gap-3">
         <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium opacity-60 hover:opacity-100 hover:bg-black/5">Cancel</button>
         <button onClick={() => onConfirm(suppress)} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600">Delete</button>
       </div>
     </motion.div>
   </div>
 );
}

const MoveDialog = ({ isOpen, onClose, onConfirm, folders, isDark, selectedCount }: any) => {
   const [selectedTarget, setSelectedTarget] = useState<string | 'root' | null>(null);
   useEffect(() => { if (isOpen) setSelectedTarget(null); }, [isOpen]);
   if (!isOpen) return null;
   return (
       <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
           <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={fluidSpring}
              className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[80vh] ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`} 
              onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-center mb-4 flex-none">
                  <h3 className="text-xl font-bold">Move ({selectedCount})</h3>
                  <button onClick={onClose}><X size={24} className="opacity-50"/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                 <button onClick={() => setSelectedTarget('root')} className={`w-full p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition-all ${selectedTarget === 'root' ? 'bg-indigo-500/10 text-indigo-500 ring-2 ring-indigo-500' : 'hover:bg-black/5'}`}><CornerDownLeft size={20}/> Dashboard (Home)</button>
                 {folders.map((f: Folder) => (
                    <button key={f.id} onClick={() => setSelectedTarget(f.id)} className={`w-full p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition-all ${selectedTarget === f.id ? 'bg-indigo-500/10 text-indigo-500 ring-2 ring-indigo-500' : 'hover:bg-black/5'}`}><FolderIcon size={20}/> {f.name}</button>
                 ))}
              </div>
              <div className="flex gap-3 flex-none mt-auto pt-2 border-t border-black/5">
                  <button onClick={onClose} className="flex-1 py-3 font-medium opacity-50 hover:opacity-100">Cancel</button>
                  <button disabled={!selectedTarget} onClick={() => { if (selectedTarget) { onConfirm(selectedTarget === 'root' ? null : selectedTarget); }}} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${selectedTarget ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-50'}`}>Move</button>
              </div>
           </motion.div>
        </div>
   );
};

const NoteSettingsModal = ({ isOpen, onClose, note, onUpdate, isDark, colors }: any) => {
   if (!isOpen || !note) return null;
   return (
       <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={fluidSpring} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
               <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Note Settings</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button></div>
               
               <div className="grid grid-cols-2 gap-3 mb-6">
                   <button onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${note.isPinned ? 'bg-yellow-500/10 text-yellow-600' : 'bg-black/5 hover:bg-black/10'}`}>
                       <Star size={24} fill={note.isPinned ? "currentColor" : "none"} />
                       <span className="text-sm font-medium">{note.isPinned ? 'Unpin' : 'Pin Note'}</span>
                   </button>
                    <button className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors bg-black/5 hover:bg-black/10 opacity-50 cursor-not-allowed`}>
                       <Share2 size={24} />
                       <span className="text-sm font-medium">Share (Soon)</span>
                   </button>
               </div>

               <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4><div className="flex flex-wrap gap-3">{Object.keys(colors).map(c => { const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0]; const isActive = note.color === c; return (<button key={c} onClick={() => onUpdate(note.id, {color: c})} className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : ''}`} />) })}</div></div>
               <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4><div className="grid grid-cols-4 gap-3">{SHAPES.slice(0, 12).map((s,i) => <button key={i} onClick={() => onUpdate(note.id, {shape: s})} className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${note.shape