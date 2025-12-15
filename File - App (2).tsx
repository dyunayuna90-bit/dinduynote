import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, PanInfo, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
  FilePlus, Trash2, X, Palette, Sun, Moon, Folder as FolderIcon,
  Check, Minimize2, Maximize2, Search, Heart, Menu, Download, Upload, 
  CheckSquare, Plus, CornerDownLeft, Star, RefreshCcw, Layers, FileText,
  Share2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder, ColorTheme } from './types';
import { DARK_COLORS, LIGHT_COLORS, SHAPES, ICONS } from './constants';

// --- Constants & Config ---
const springTransition = { type: "spring", stiffness: 400, damping: 30, mass: 1 };
const smoothSpring = { type: "spring", stiffness: 500, damping: 40, mass: 0.8 }; // Lebih fluid, less 'hentak'

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
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={springTransition}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
             <Trash2 size={32}/>
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="opacity-60 text-sm mb-4">{message}</p>
          
          <label className="flex items-center gap-2 text-sm opacity-80 cursor-pointer">
              <input 
                type="checkbox" 
                checked={dontAskAgain} 
                onChange={(e) => setDontAskAgain(e.target.checked)} 
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Don't ask again</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium opacity-60 hover:opacity-100 hover:bg-black/5">Cancel</button>
          <button onClick={() => onConfirm(dontAskAgain)} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600">Delete</button>
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
               transition={springTransition}
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
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
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4><div className="grid grid-cols-4 gap-3">{SHAPES.slice(0, 12).map((s,i) => <button key={i} onClick={() => onUpdate(note.id, {shape: s})} className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${note.shape === s ? '!opacity-100 ring-2 ring-indigo-500' : ''}`} />)}</div></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Icon</h4><div className="grid grid-cols-6 gap-2">{Object.keys(ICONS).map(k => { const I = ICONS[k]; return <button key={k} onClick={() => onUpdate(note.id, {icon: k})} className={`p-2 hover:bg-black/5 rounded flex items-center justify-center ${note.icon === k ? 'text-indigo-600 bg-indigo-50' : ''}`}><I size={20}/></button> })}</div></div>
            </motion.div>
        </div>
    );
};

const FolderSettingsModal = ({ isOpen, onClose, folder, onUpdate, isDark, colors }: any) => {
    if (!isOpen || !folder) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Folder Settings</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button></div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => onUpdate(folder.id, { isPinned: !folder.isPinned })} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${folder.isPinned ? 'bg-yellow-500/10 text-yellow-600' : 'bg-black/5 hover:bg-black/10'}`}>
                        <Star size={24} fill={folder.isPinned ? "currentColor" : "none"} />
                        <span className="text-sm font-medium">{folder.isPinned ? 'Unpin' : 'Pin Folder'}</span>
                    </button>
                </div>

                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-2 uppercase tracking-wider">Rename</h4><input value={folder.name} onChange={(e) => onUpdate(folder.id, { name: e.target.value })} className={`w-full p-3 rounded-xl text-lg font-medium outline-none ${isDark ? 'bg-zinc-800 focus:bg-zinc-700' : 'bg-zinc-100 focus:bg-zinc-200'}`} /></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4><div className="flex flex-wrap gap-3">{Object.keys(colors).map(c => { const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0]; const isActive = folder.color === c; return (<button key={c} onClick={() => onUpdate(folder.id, {color: c})} className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : ''}`} />) })}</div></div>
                <div><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4><div className="grid grid-cols-4 gap-3">{SHAPES.slice(0, 12).map((s,i) => <button key={i} onClick={() => onUpdate(folder.id, {shape: s})} className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${folder.shape === s ? '!opacity-100 ring-2 ring-indigo-500' : ''}`} />)}</div></div>
            </motion.div>
        </div>
    )
}

const Sidebar = ({ isOpen, onClose, isDark, toggleTheme, onExport, onImport }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[200]" />
          <motion.div 
            initial={{ x: '-100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '-100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 300 }} 
            className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-xs z-[210] shadow-2xl overflow-y-auto flex flex-col ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-zinc-900'}`}
          >
            <div className="p-8 pb-4 flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Desnote.</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button>
            </div>
            
            <div className="flex-1 px-4 py-2 space-y-4">
                <a href="https://saweria.co/Densl" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-colors">
                     <Heart size={22} fill="black" />
                     <span>Support on Saweria</span>
                </a>

                <div className="h-px bg-current opacity-10 my-2" />

                <div className="space-y-1">
                    <button onClick={toggleTheme} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                        {isDark ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-indigo-600" />}
                        <span className="font-medium text-lg">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button onClick={onExport} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                        <Download size={22} className="text-blue-500"/>
                        <span className="font-medium text-lg">Backup Data</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                        <Upload size={22} className="text-green-500"/>
                        <span className="font-medium text-lg">Import Data</span>
                        <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={onImport}/>
                    </button>
                </div>
            </div>
            
            <div className="p-6 text-center opacity-50 text-sm font-medium">
               Made with 🖤 in Jakarta
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Note Editor (FIX: Toolbar Fixed Above Keyboard) ---
const NoteEditor = ({ note, onUpdate, onClose, onDelete, isDark, showSettings, onCloseSettings, onOpenSettings }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  if (!note) return null;

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const bgClass = isDark ? 'bg-[#121212]' : (colors[note.color] || colors.slate).split(' ')[0];
  const textClass = isDark ? 'text-white' : (colors[note.color] || colors.slate).split(' ')[1];
  const themeClass = `${bgClass} ${textClass}`;
  
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

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col h-[100dvh] ${themeClass}`}>
       <NoteSettingsModal isOpen={showSettings} onClose={onCloseSettings} note={note} onUpdate={onUpdate} isDark={isDark} colors={colors} />
       
       {/* Top Bar */}
       <div className={`flex-none flex justify-between items-center p-4 bg-transparent`}>
          <button onClick={onClose} className={`p-3 rounded-full hover:bg-white/10`}><ArrowLeft/></button>
          
          <div className="flex gap-2 relative items-center">
             <IconButton 
                icon={Star} 
                onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })} 
                className={note.isPinned ? "text-yellow-500" : "opacity-50"}
                active={note.isPinned}
                activeClass="text-yellow-500 bg-yellow-500/10"
             />
             <IconButton icon={Palette} onClick={onOpenSettings} />
             <IconButton icon={Trash2} onClick={onDelete} className="text-current hover:bg-red-500/20" />
          </div>
       </div>

       {/* Editor Area - Added padding bottom to account for fixed toolbar */}
       <div className={`flex-1 overflow-y-auto px-6 py-6 bg-transparent pb-24`}>
          <div className="max-w-4xl mx-auto">
              <input value={note.title} onChange={(e) => onUpdate(note.id, {title: e.target.value})} placeholder="Title" className="w-full bg-transparent text-4xl font-bold outline-none mb-6 placeholder-current/30 text-left" dir="ltr" />
              <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(e) => { onUpdate(note.id, {content: e.currentTarget.innerHTML}); checkFormats(); }} onKeyUp={checkFormats} onMouseUp={checkFormats} onTouchEnd={checkFormats} className="outline-none text-xl leading-relaxed min-h-[50vh] empty:before:content-['Type_something...'] empty:before:opacity-50 text-left [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dir="ltr" />
          </div>
       </div>

       {/* Toolbar - FIXED at bottom to sit on top of keyboard */}
       <div className={`fixed bottom-0 left-0 right-0 w-full p-2 ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50`}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start px-4 md:justify-center">
             <ToolbarButton icon={Bold} onClick={() => format('bold')} active={activeFormats.includes('bold')} isDark={isDark} />
             <ToolbarButton icon={Italic} onClick={() => format('italic')} active={activeFormats.includes('italic')} isDark={isDark} />
             <ToolbarButton icon={Underline} onClick={() => format('underline')} active={activeFormats.includes('underline')} isDark={isDark} />
             <div className="w-px h-6 bg-current opacity-20 mx-2 self-center flex-shrink-0"/>
             <ToolbarButton icon={List} onClick={() => format('insertUnorderedList')} active={activeFormats.includes('insertUnorderedList')} isDark={isDark} />
             <ToolbarButton icon={AlignLeft} onClick={() => format('justifyLeft')} active={activeFormats.includes('justifyLeft')} isDark={isDark} />
             <ToolbarButton icon={AlignCenter} onClick={() => format('justifyCenter')} active={activeFormats.includes('justifyCenter')} isDark={isDark} />
             <ToolbarButton icon={AlignRight} onClick={() => format('justifyRight')} active={activeFormats.includes('justifyRight')} isDark={isDark} />
          </div>
       </div>
    </div>
  );
};

// --- Main App Logic ---

type TabType = 'all' | 'favorites' | 'folders' | 'notes' | 'trash';

export default function App() {
  const [isDark, setIsDark] = useLocalStorage<boolean>('desnote-theme', false);
  useEffect(() => {
    if (isDark) { document.body.classList.add('dark'); } else { document.body.classList.remove('dark'); }
  }, [isDark]);

  const [notes, setNotes] = useLocalStorage<Note[]>('desnote-notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('desnote-folders', [
    { id: '1', name: 'Personal', color: 'rose', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' },
    { id: '2', name: 'Work', color: 'blue', shape: 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' }
  ]);
  const [dontAskDelete, setDontAskDelete] = useLocalStorage<boolean>('desnote-dont-remind-delete', false);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [peekingNoteId, setPeekingNoteId] = useState<string | null>(null); 
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: string, id: string | null}>({isOpen: false, type: '', id: null});
  const [folderSettingsId, setFolderSettingsId] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showNoteSettings, setShowNoteSettings] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // --- Satpam Back Button Logic (Improved) ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Priority 1: Close Peeking Note
      if (peekingNoteId) { setPeekingNoteId(null); return; }
      
      // Priority 2: Close Expanded Folder
      if (expandedFolderId) { setExpandedFolderId(null); return; }

      // Priority 3: Close Selection Mode / Search
      if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); return; }
      if (showSearch) { setShowSearch(false); return; }

      // Priority 4: Close Note / Sidebar
      if (activeNoteId) { setActiveNoteId(null); }
      else if (showSidebar) { setShowSidebar(false); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeNoteId, expandedFolderId, showSidebar, isSelectionMode, showSearch, peekingNoteId]);

  useEffect(() => {
    // Push state when entering a "view" so back button works
    if (activeNoteId || expandedFolderId || isSelectionMode || showSearch || peekingNoteId) {
       // Check if we haven't already pushed state to avoid duplicates if possible, 
       // but for simple logic we push.
       window.history.pushState(null, '', window.location.href);
    }
  }, [activeNoteId, expandedFolderId, isSelectionMode, showSearch, peekingNoteId]);

  // --- Logic Filtering (Revised) ---
  const getFilteredData = () => {
      let filteredNotes = notes.filter(n => activeTab === 'trash' ? n.isDeleted : !n.isDeleted);
      let filteredFolders = folders.filter(f => activeTab === 'trash' ? f.isDeleted : !f.isDeleted);

      if (activeTab === 'favorites') {
          filteredNotes = filteredNotes.filter(n => n.isPinned);
          filteredFolders = filteredFolders.filter(f => f.isPinned); // Favorites now affects folders
      } else if (activeTab === 'folders') {
          filteredNotes = [];
      } else if (activeTab === 'notes') {
          filteredFolders = [];
      } 

      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          // Smart Search based on Tab
          if (activeTab === 'folders') {
              filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q));
          } else if (activeTab === 'notes') {
               filteredNotes = filteredNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
          } else {
              // All or Favorites or Trash
              filteredNotes = filteredNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
              filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q));
          }
      }

      // Sort: Latest Updated First
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

  // DELETE & RESTORE
  const executeDelete = (type: string, id: string | null) => {
      if (!id) return;
      if (activeTab === 'trash') {
        // Permanent Delete
        if (type === 'note') setNotes(prev => prev.filter(n => n.id !== id));
        else setFolders(prev => prev.filter(f => f.id !== id));
      } else {
        // Soft Delete
        if (type === 'note') setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true, updatedAt: Date.now() } : n));
        else {
             // Logic: Delete Folder -> Notes Spill Out -> Folder Soft Deleted
             setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null, updatedAt: Date.now() } : n));
             setFolders(prev => prev.map(f => f.id === id ? { ...f, isDeleted: true } : f));
        }
      }
      if (activeNoteId === id) setActiveNoteId(null);
  };

  const requestDelete = (type: string, id: string) => {
      if (dontAskDelete) {
          executeDelete(type, id);
      } else {
          setDeleteModal({ isOpen: true, type, id });
      }
  };

  const handleConfirmDelete = (savePreference: boolean) => {
      if (savePreference) setDontAskDelete(true);
      executeDelete(deleteModal.type, deleteModal.id);
      setDeleteModal({...deleteModal, isOpen: false});
  }

  const restoreItem = (type: string, id: string) => {
      if (type === 'note') setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: false, updatedAt: Date.now() } : n));
      else setFolders(prev => prev.map(f => f.id === id ? { ...f, isDeleted: false } : f));
  };

  const prepareMove = () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      setItemsToMove(ids);
      setShowMoveDialog(true);
  };

  const handleMoveSelected = (targetId: string | null) => {
      if (itemsToMove.length === 0) return;
      setNotes(prevNotes => prevNotes.map(n => itemsToMove.includes(n.id) ? { ...n, folderId: targetId, updatedAt: Date.now() } : n));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      setItemsToMove([]);
      setShowMoveDialog(false);
  };

  // Toggle Favorite for Selection
  const toggleFavoriteSelected = () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      
      // Determine if majority is pinned
      let pinnedCount = 0;
      let totalCount = 0;

      // Check notes
      notes.forEach(n => {
          if (ids.includes(n.id)) { totalCount++; if (n.isPinned) pinnedCount++; }
      });
      // Check folders
      folders.forEach(f => {
          if (ids.includes(f.id)) { totalCount++; if (f.isPinned) pinnedCount++; }
      });

      const shouldPin = pinnedCount < totalCount; // If less than 100% are pinned, pin all. Else unpin all.

      setNotes(prev => prev.map(n => ids.includes(n.id) ? { ...n, isPinned: shouldPin } : n));
      setFolders(prev => prev.map(f => ids.includes(f.id) ? { ...f, isPinned: shouldPin } : f));
      
      setIsSelectionMode(false);
      setSelectedIds(new Set());
  };

  const activeNote = activeNoteId ? notes.find(n => n.id === activeNoteId) : null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#121212] text-[#f0f0f0]' : 'bg-[#fdfdfd] text-[#1a1c1e]'}`}>
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onExport={() => {}} onImport={() => {}} />
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({...deleteModal, isOpen: false})} isDark={isDark} onConfirm={handleConfirmDelete} />
      <FolderSettingsModal isOpen={!!folderSettingsId} onClose={() => setFolderSettingsId(null)} folder={folders.find(f => f.id === folderSettingsId)} isDark={isDark} colors={isDark ? DARK_COLORS : LIGHT_COLORS} onUpdate={(id: string, u: any) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...u} : f))} />
      <MoveDialog isOpen={showMoveDialog} onClose={() => setShowMoveDialog(false)} onConfirm={handleMoveSelected} folders={folders.filter(f => !f.isDeleted)} isDark={isDark} selectedCount={itemsToMove.length} />

      <AnimatePresence mode="wait">
        {activeNoteId && activeNote ? (
          <NoteEditor 
            key="editor" note={activeNote} isDark={isDark} showSettings={showNoteSettings}
            onOpenSettings={() => setShowNoteSettings(true)} onCloseSettings={() => setShowNoteSettings(false)}
            onUpdate={(id: string, u: Partial<Note>) => setNotes(prev => prev.map(n => n.id === id ? {...n, ...u, updatedAt: Date.now()} : n))}
            onClose={() => setActiveNoteId(null)} onDelete={() => requestDelete('note', activeNoteId!)}
            onMoveNote={(nId: string, fId: string | null) => setNotes(prev => prev.map(n => n.id === nId ? {...n, folderId: fId} : n))}
          />
        ) : (
          <Dashboard 
            key="dashboard" 
            notes={filteredNotes} folders={filteredFolders} 
            allNotes={notes} // for internal usage
            isDark={isDark} toggleSidebar={() => setShowSidebar(true)}
            activeTab={activeTab} setActiveTab={setActiveTab}
            expandedFolderId={expandedFolderId} setExpandedFolderId={setExpandedFolderId} peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId}
            onOpenNote={setActiveNoteId} onUpdateFolder={(id, u) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...u} : f))}
            onDeleteFolder={(id) => requestDelete('folder', id)} 
            onDeleteNote={(id) => requestDelete('note', id)}
            onRestoreItem={restoreItem}
            onCreateNoteInFolder={createNote} isSelectionMode={isSelectionMode} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
            setIsSelectionMode={setIsSelectionMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            showSearch={showSearch} setShowSearch={setShowSearch}
            openFolderSettings={(id) => setFolderSettingsId(id)}
            onMoveClick={prepareMove}
            deleteSelected={() => { 
                selectedIds.forEach(id => {
                    const isNote = notes.some(n => n.id === id);
                    executeDelete(isNote ? 'note' : 'folder', id);
                });
                setIsSelectionMode(false); setSelectedIds(new Set()); 
            }}
            toggleFavoriteSelected={toggleFavoriteSelected}
          />
        )}
      </AnimatePresence>

      {/* NEW FLOATING ACTION PILL (BOTTOM) */}
      {!activeNoteId && !isSelectionMode && activeTab !== 'trash' && (
         <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[90] px-4 pointer-events-none">
             <div className="bg-zinc-900/90 dark:bg-white/90 backdrop-blur-md shadow-2xl rounded-full p-2 flex items-center gap-2 pointer-events-auto">
                 <button onClick={() => createFolder()} className="pl-4 pr-3 py-3 rounded-full hover:bg-white/10 dark:hover:bg-black/10 flex items-center gap-2 transition-colors">
                     <FolderIcon size={20} className={isDark ? "text-black" : "text-white"} />
                     <span className={`font-bold text-sm ${isDark ? "text-black" : "text-white"}`}>Folder</span>
                 </button>
                 <div className="w-px h-6 bg-current opacity-20" />
                 <button onClick={() => createNote()} className="pl-3 pr-4 py-3 rounded-full hover:bg-white/10 dark:hover:bg-black/10 flex items-center gap-2 transition-colors">
                     <FilePlus size={20} className={isDark ? "text-black" : "text-white"} />
                     <span className={`font-bold text-sm ${isDark ? "text-black" : "text-white"}`}>Note</span>
                 </button>
             </div>
         </div>
      )}
    </div>
  );
}

// --- Header Component (COMPACT & SMOOTH) ---
const Header = ({ 
    activeTab, setActiveTab, toggleSidebar, 
    isSelectionMode, toggleSelectionMode, isDark, 
    searchQuery, setSearchQuery, showSearch, setShowSearch,
    selectedCount, deleteSelected, onMoveClick, hasFolderSelected, toggleFavoriteSelected
}: any) => {
    const { scrollY } = useScroll();
    
    // Animate Header Fluidly
    const headerHeight = useTransform(scrollY, [0, 100], ['auto', 'auto']);
    const titleScale = useTransform(scrollY, [0, 50], [1, 0.9]);
    const titleOpacity = useTransform(scrollY, [0, 50], [1, 0.8]);
    const verticalPadding = useTransform(scrollY, [0, 50], [16, 8]); // Reduces padding
    
    const tabs = [
        { id: 'all', label: 'All', icon: Layers },
        { id: 'favorites', label: 'Favorites', icon: Star },
        { id: 'folders', label: 'Folders', icon: FolderIcon },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ];

    const getHeaderTitle = () => {
        if (activeTab === 'all') return "Your Space";
        if (activeTab === 'favorites') return "Favorites";
        if (activeTab === 'folders') return "Folders";
        if (activeTab === 'notes') return "All Notes";
        if (activeTab === 'trash') return "Trash";
        return "Desnote";
    };

    return (
        <motion.div style={{ height: headerHeight, paddingTop: verticalPadding, paddingBottom: verticalPadding }} className={`sticky top-0 z-50 px-4 transition-colors duration-300 ${isDark ? 'bg-[#121212]/95' : 'bg-[#fdfdfd]/95'} backdrop-blur-md`}>
            {/* Top Bar Actions */}
            <div className="flex justify-between items-center mb-1 h-12">
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
                        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-black/5"><Menu size={24} /></button>
                        <div className="flex items-center gap-1">
                             <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-full hover:bg-black/5 ${showSearch ? 'bg-indigo-500/10 text-indigo-500' : ''}`}><Search size={24} /></button>
                             <button onClick={toggleSelectionMode} className="p-2 -mr-2 rounded-full hover:bg-black/5"><CheckSquare size={24} /></button>
                        </div>
                    </>
                )}
            </div>

            {/* Search Input (Collapsible) */}
            <AnimatePresence>
                {showSearch && !isSelectionMode && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                         <div className={`flex items-center px-4 py-3 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                             <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type to search..." className="bg-transparent w-full outline-none font-medium" />
                             {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16}/></button>}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Title */}
            {!isSelectionMode && !showSearch && (
                 <motion.div style={{ scale: titleScale, opacity: titleOpacity, originX: 0 }} className="mb-2">
                      <h1 className="text-4xl font-bold tracking-tight">{getHeaderTitle()}</h1>
                 </motion.div>
            )}

            {/* Tabs (Fluid Animation) */}
            {!isSelectionMode && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <LayoutGroup>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <motion.button
                                layout
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                initial={false}
                                animate={{ 
                                    backgroundColor: isActive ? (isDark ? '#3f3f46' : '#18181b') : (isDark ? '#27272a' : '#f4f4f5'),
                                    color: isActive ? '#ffffff' : (isDark ? '#a1a1aa' : '#71717a')
                                }}
                                transition={smoothSpring} // Much smoother transition
                                className={`h-10 px-4 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden`}
                            >
                                <div className={`flex items-center justify-center gap-2`}>
                                    <Icon size={18} />
                                    {isActive && (
                                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} className="font-semibold whitespace-nowrap text-sm">
                                            {tab.label}
                                        </motion.span>
                                    )}
                                </div>
                            </motion.button>
                        )
                    })}
                    </LayoutGroup>
                </div>
            )}
        </motion.div>
    );
}

// --- Dashboard ---

const Dashboard = ({ 
  notes, folders, allNotes, isDark, toggleSidebar, activeTab, setActiveTab,
  expandedFolderId, setExpandedFolderId, peekingNoteId, setPeekingNoteId,
  onOpenNote, onUpdateFolder, onDeleteFolder, onDeleteNote, onRestoreItem, onCreateNoteInFolder,
  isSelectionMode, selectedIds, setSelectedIds, setIsSelectionMode,
  searchQuery, setSearchQuery, showSearch, setShowSearch, deleteSelected, openFolderSettings,
  onMoveClick, toggleFavoriteSelected
}: any) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // FIX: Trash Logic for Dashboard Display
  // If activeTab is trash, we show ALL deleted notes, regardless of folder.
  // If not trash, we show only root notes.
  const displayNotes = activeTab === 'trash'
      ? notes // already filtered by isDeleted in App.tsx, but we need to ensure we don't double filter if passing 'filteredNotes'
      : notes.filter((n: Note) => n.folderId === null); 

  const toggleSelection = (id: string) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
     setSelectedIds(newSet);
  };

  // Long press handler
  const handleLongPress = (id: string) => {
      if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedIds(new Set([id]));
      }
  };

  return (
    <div className="pb-32 max-w-7xl mx-auto" onClick={() => { setExpandedFolderId(null); }}>
      <Header 
         activeTab={activeTab} setActiveTab={setActiveTab} toggleSidebar={toggleSidebar}
         isSelectionMode={isSelectionMode} toggleSelectionMode={() => { if(isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); } else setIsSelectionMode(true); }}
         isDark={isDark} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showSearch={showSearch} setShowSearch={setShowSearch}
         selectedCount={selectedIds.size} deleteSelected={deleteSelected} onMoveClick={onMoveClick} 
         hasFolderSelected={Array.from(selectedIds).some(id => folders.some((f: Folder) => f.id === id))}
         toggleFavoriteSelected={toggleFavoriteSelected}
      />

      <div className="px-4 mt-2">
        <LayoutGroup>
            <motion.div layout transition={springTransition} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Folders */}
            {folders.map((folder: Folder) => (
                <FolderItem 
                    key={folder.id} folder={folder} 
                    notes={allNotes.filter((n: Note) => n.folderId === folder.id && !n.isDeleted)}
                    isExpanded={expandedFolderId === folder.id} isDark={isDark} colors={colors}
                    onToggle={() => setExpandedFolderId(folder.id)} onClose={() => setExpandedFolderId(null)}
                    onOpenNote={onOpenNote} onDelete={() => onDeleteFolder(folder.id)} onUpdate={onUpdateFolder} onRestore={() => onRestoreItem('folder', folder.id)}
                    onCreateNote={() => onCreateNoteInFolder(folder.id)} isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(folder.id)} onSelect={() => toggleSelection(folder.id)}
                    onDeleteNote={onDeleteNote}
                    onSettings={() => openFolderSettings(folder.id)}
                    peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId}
                    isTrash={activeTab === 'trash'}
                    onLongPress={() => handleLongPress(folder.id)}
                />
            ))}

            {/* Notes */}
            {displayNotes.map((note: Note) => (
                <NoteCard 
                    key={note.id} note={note} isDark={isDark} colors={colors} 
                    onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)} 
                    onDelete={() => onDeleteNote(note.id)} 
                    onRestore={() => onRestoreItem('note', note.id)}
                    isSelected={selectedIds.has(note.id)}
                    isSelectionMode={isSelectionMode} isPeeking={peekingNoteId === note.id}
                    onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
                    inFolder={false}
                    searchQuery={searchQuery}
                    isTrash={activeTab === 'trash'}
                    onLongPress={() => handleLongPress(note.id)}
                />
            ))}
            </motion.div>
        </LayoutGroup>

        {/* Empty State */}
        {folders.length === 0 && displayNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <div className="w-24 h-24 bg-current rounded-full mb-4 flex items-center justify-center">
                    {activeTab === 'trash' ? <Trash2 size={40}/> : <Layers size={40}/>}
                </div>
                <p className="font-bold text-lg">Nothing here yet</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- Folder Item ---

const FolderItem = ({ 
  folder, notes, isExpanded, isDark, colors, onToggle, onClose,
  onOpenNote, onDelete, onUpdate, onCreateNote, onRestore,
  isSelectionMode, isSelected, onSelect, onDeleteNote, onSettings,
  peekingNoteId, setPeekingNoteId, isTrash, onLongPress
}: any) => {
  const themeClass = colors[folder.color] || colors.slate;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
      if (isExpanded || isSelectionMode) return;
      longPressTimer.current = setTimeout(() => {
          onLongPress();
      }, 500);
  };

  const handlePointerUp = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  
  // Cancel long press on drag start (swipe conflict fix)
  const onPanStart = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  const onDragEnd = (event: any, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 100 && !isSelectionMode && !isExpanded && !isTrash) {
          onDelete(); // Swipe to Delete
      }
  };

  return (
    <motion.div 
       layout 
       transition={springTransition}
       className={`${isExpanded ? 'col-span-full' : 'col-span-1 aspect-square'}`}
       onClick={(e) => { 
           e.stopPropagation(); 
           if (isSelectionMode) onSelect(); 
           else if (!isTrash) isExpanded ? onClose() : onToggle(); 
       }}
       onPointerDown={handlePointerDown}
       onPointerUp={handlePointerUp}
       onPointerLeave={handlePointerUp}
       style={{ zIndex: isExpanded ? 10 : 1 }}
    >
        <div className={`relative w-full rounded-3xl ${isExpanded ? '' : 'h-full'}`}>
            <motion.div
                drag={!isExpanded && !isSelectionMode && !isTrash ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragStart={onPanStart}
                onDragEnd={onDragEnd}
                whileTap={!isExpanded && !isSelectionMode ? { scale: 0.95 } : {}}
                className={`${themeClass} ${folder.shape} relative z-10 w-full ${isExpanded ? 'h-auto min-h-full pb-12' : 'h-full'} ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}`}
            >
                <div className={`p-5 flex flex-col ${isExpanded ? '' : 'h-full'}`}>
                    <div className="flex justify-between items-start mb-2">
                         <div className="pr-2 relative">
                             <h2 className="text-2xl font-bold leading-tight line-clamp-2">{folder.name}</h2>
                             {folder.isPinned && !isExpanded && <div className="absolute -top-1 -left-2 text-yellow-400 bg-black/10 rounded-full p-0.5 scale-75"><Star fill="currentColor" size={12}/></div>}
                         </div>
                        {isExpanded && !isSelectionMode && (
                             <IconButton icon={Palette} onClick={(e: any) => { e.stopPropagation(); onSettings(); }} />
                        )}
                        {isTrash && <IconButton icon={RefreshCcw} onClick={(e: any) => { e.stopPropagation(); onRestore(); }} />}
                    </div>
                    {!isExpanded && <div className="text-sm opacity-60 font-medium mt-auto">{notes.length} Notes</div>}
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springTransition} className="p-4 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {notes.map((note: Note) => (
                                <NoteCard 
                                    key={note.id} note={note} isDark={isDark} colors={colors} inFolder={true}
                                    onClick={() => isSelectionMode ? onDeleteNote(note.id) : onOpenNote(note.id)} 
                                    isSelectionMode={isSelectionMode}
                                    isSelected={false} 
                                    onDelete={() => onDeleteNote(note.id)} 
                                    isPeeking={peekingNoteId === note.id}
                                    onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
                                    onLongPress={() => {}} 
                                />
                            ))}
                            <button onClick={(e) => { e.stopPropagation(); onCreateNote(); }} className={`border-2 border-dashed rounded-3xl aspect-square flex flex-col items-center justify-center opacity-50 hover:opacity-100 ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
                                <Plus size={32} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    </motion.div>
  );
};

// --- Note Card ---

const NoteCard = ({ note, onClick, onDelete, onRestore, inFolder, isDark, colors, isSelected, isSelectionMode, isPeeking, onPeek, searchQuery, isTrash, onLongPress }: any) => {
  const Icon = (ICONS && ICONS[note.icon]) ? ICONS[note.icon] : FileText; 
  const themeClass = colors[note.color] || colors.slate;
  const safeIsPeeking = isPeeking || false;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
      if (isSelectionMode || isTrash || safeIsPeeking) return;
      longPressTimer.current = setTimeout(() => {
          if (onLongPress) onLongPress();
      }, 500);
  };

  const handlePointerUp = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  
  // Cancel long press if user swipes
  const onPanStart = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  const onDragEnd = (event: any, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 100 && !isSelectionMode && !isTrash) {
          onDelete(); // Swipe to Delete Note
      }
  };

  const previewText = note.content.replace(/<[^>]+>/g, ' ').trim() || "No content";

  return (
    <motion.div 
       layout 
       layoutId={`note-${note.id}`}
       transition={springTransition}
       className={`${safeIsPeeking ? 'col-span-2 row-span-2' : 'col-span-1 aspect-square'}`}
       onPointerDown={handlePointerDown}
       onPointerUp={handlePointerUp}
       onPointerLeave={handlePointerUp}
       style={{ zIndex: safeIsPeeking ? 50 : 1, position: 'relative' }}
    >
        <motion.div
           drag={!isSelectionMode && !isTrash && !safeIsPeeking ? "x" : false}
           dragConstraints={{ left: 0, right: 0 }}
           dragElastic={0.5}
           onDragStart={onPanStart}
           onDragEnd={onDragEnd}
           onClick={(e) => { e.stopPropagation(); onClick(); }}
           whileTap={!isSelectionMode && !safeIsPeeking ? { scale: 0.95 } : {}}
           className={`
              w-full h-full relative cursor-pointer group overflow-hidden
              ${themeClass} ${note.shape}
              ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}
              ${safeIsPeeking ? 'shadow-2xl' : ''}
           `}
        >
           <div className="p-5 h-full flex flex-col relative pointer-events-none"> 
               {safeIsPeeking ? (
                   <div className="flex flex-col h-full overflow-hidden">
                       <h3 className="text-3xl font-bold mb-4 leading-tight">{note.title || "Untitled"}</h3>
                       <div className="text-lg opacity-80 leading-relaxed overflow-hidden max-h-[300px]">
                           {previewText}
                       </div>
                   </div>
               ) : (
                   <>
                      <h3 className="text-xl font-bold leading-tight line-clamp-2 relative z-10">{note.title || "Untitled"}</h3> 
                      {/* MOVED STAR TO LEFT as requested */}
                      {note.isPinned && <div className="absolute top-4 right-4 text-yellow-500 bg-black/10 rounded-full p-1"><Star fill="currentColor" size={12}/></div>}
                      <div className="absolute bottom-4 right-4 opacity-10">
                          {Icon && <Icon size={80} />}
                      </div>
                   </>
               )}
               {isSelected && <div className="absolute top-4 left-4 bg-indigo-600 text-white p-1 rounded-full"><Check size={16}/></div>}
           </div>
           
           {isTrash && (
               <button onClick={(e) => {e.stopPropagation(); onRestore()}} className="absolute bottom-3 right-3 p-2 bg-white/20 rounded-full backdrop-blur pointer-events-auto"><RefreshCcw size={18}/></button>
           )}

           {!isSelectionMode && !isTrash && onPeek && (
               <button 
                 onPointerDown={(e) => e.stopPropagation()} 
                 onClick={(e) => { e.stopPropagation(); onPeek(!safeIsPeeking); }}
                 className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm z-20 pointer-events-auto transition-transform active:scale-90 ${isDark ? 'bg-zinc-800' : 'bg-white'}`}
               >
                  {safeIsPeeking ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
               </button>
           )}
        </motion.div>
    </motion.div>
  );
};