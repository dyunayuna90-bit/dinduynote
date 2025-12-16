import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, PanInfo, useDragControls, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
  FolderPlus, FilePlus, Trash2, X, Palette, Sun, Moon, Folder as FolderIcon,
  Check, Minimize2, Maximize2, Search, Heart, Menu, Download, Upload, 
  CheckSquare, AlertCircle, Plus, CornerDownLeft, 
  Undo, Redo, Pin, PinOff, Star, RefreshCcw, Layers, FileText
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder, ColorTheme } from './types';
import { DARK_COLORS, LIGHT_COLORS, SHAPES, ICONS } from './constants';

// --- Constants ---
const springTransition = { type: "spring", stiffness: 400, damping: 30, mass: 1 };
const softSpring = { type: "spring", stiffness: 300, damping: 30 };

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

// FIX 1: THE LEGENDARY VIEWPORT HOOK FROM V1.7
const useVisualViewport = () => {
  const [height, setHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.visualViewport) {
        setHeight(window.visualViewport.height);
        setOffsetTop(window.visualViewport.offsetTop);
      } else {
        setHeight(window.innerHeight);
        setOffsetTop(0);
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

  return { height, offsetTop };
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

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDark, title = "Hapus Item?", message = "Item ini akan dipindahkan ke Sampah." }: any) => {
  const [suppress, setSuppress] = useState(false);
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
          <p className="opacity-60 text-sm">{message}</p>
        </div>
        
        <div className="flex items-center gap-2 mb-6 justify-center opacity-70 cursor-pointer" onClick={() => setSuppress(!suppress)}>
           <div className={`w-5 h-5 rounded border-2 border-current flex items-center justify-center ${suppress ? 'bg-indigo-500 border-indigo-500 text-white' : ''}`}>
              {suppress && <Check size={14}/>}
           </div>
           <span className="text-xs font-medium">Jangan ingatkan saya lagi</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium opacity-60 hover:opacity-100 hover:bg-black/5">Batal</button>
          <button onClick={() => onConfirm(suppress)} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600">Hapus</button>
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
                   <h3 className="text-xl font-bold">Pindahkan ({selectedCount})</h3>
                   <button onClick={onClose}><X size={24} className="opacity-50"/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                  <button onClick={() => setSelectedTarget('root')} className={`w-full p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition-all ${selectedTarget === 'root' ? 'bg-indigo-500/10 text-indigo-500 ring-2 ring-indigo-500' : 'hover:bg-black/5'}`}><CornerDownLeft size={20}/> Dashboard (Home)</button>
                  {folders.map((f: Folder) => (
                     <button key={f.id} onClick={() => setSelectedTarget(f.id)} className={`w-full p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition-all ${selectedTarget === f.id ? 'bg-indigo-500/10 text-indigo-500 ring-2 ring-indigo-500' : 'hover:bg-black/5'}`}><FolderIcon size={20}/> {f.name}</button>
                  ))}
               </div>
               <div className="flex gap-3 flex-none mt-auto pt-2 border-t border-black/5">
                   <button onClick={onClose} className="flex-1 py-3 font-medium opacity-50 hover:opacity-100">Batal</button>
                   <button disabled={!selectedTarget} onClick={() => { if (selectedTarget) { onConfirm(selectedTarget === 'root' ? null : selectedTarget); }}} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${selectedTarget ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-50'}`}>Pindahkan</button>
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
            transition={{ type: 'tween', duration: 0.2 }} // KAKU MODE ON
            className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-xs z-[210] shadow-2xl overflow-y-auto flex flex-col ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-zinc-900'}`}
          >
            <div className="p-8 pb-4 flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Desnote.</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button>
            </div>
            
            <div className="flex-1 px-4 py-2 space-y-4">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                         <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">I</div>
                         <div>
                             <div className="font-bold text-lg">Ilham Danial</div>
                             <div className="text-xs opacity-60">Pendidikan Sejarah UNJ</div>
                         </div>
                    </div>
                </div>

                <a href="https://saweria.co/Densl" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-colors">
                     <Heart size={22} fill="black" />
                     <span>Dukung di Saweria</span>
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

// --- Note Editor (FIX: USE VISUAL VIEWPORT + AUTO SCROLL CENTER) ---
const NoteEditor = ({ note, onUpdate, onClose, onDelete, isDark, showSettings, onCloseSettings, onOpenSettings }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // USE VISUAL VIEWPORT HOOK (FROM V1.7)
  const { height: viewportHeight, offsetTop } = useVisualViewport();

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

  // AUTO SCROLL LOGIC (FROM V1.7) - SCROLLS TO CENTER
  const scrollToCursor = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      // This is the magic V1.7 line:
      range.commonAncestorContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const format = (cmd: string, val?: string) => { editorRef.current?.focus(); setTimeout(() => { document.execCommand(cmd, false, val); checkFormats(); }, 0); };
  
  useEffect(() => { 
      if (editorRef.current && editorRef.current.innerHTML !== note.content) { 
          editorRef.current.innerHTML = note.content; 
      } 
  }, []);

  return (
    // FIX: Style wrapper with fixed positioning based on Visual Viewport (V1.7 style)
    <div 
        className={`fixed left-0 w-full z-[100] flex flex-col ${themeClass}`}
        style={{ 
            height: viewportHeight,
            top: offsetTop,
        }}
    >
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

       {/* Editor Area */}
       <div className={`flex-1 overflow-y-auto px-6 py-6 bg-transparent`}>
          <div className="max-w-4xl mx-auto pb-4">
              <input value={note.title} onChange={(e) => onUpdate(note.id, {title: e.target.value})} placeholder="Title" className="w-full bg-transparent text-4xl font-bold outline-none mb-6 placeholder-current/30 text-left" dir="ltr" />
              <div 
                  ref={editorRef} 
                  contentEditable 
                  suppressContentEditableWarning 
                  onInput={(e) => { 
                      onUpdate(note.id, {content: e.currentTarget.innerHTML}); 
                      checkFormats(); 
                      scrollToCursor(); // TRIGGER SCROLL CENTER
                  }} 
                  onKeyUp={checkFormats} 
                  onMouseUp={checkFormats} 
                  onTouchEnd={checkFormats} 
                  className="outline-none text-xl leading-relaxed min-h-[50vh] empty:before:content-['Type_something...'] empty:before:opacity-50 text-left [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" 
                  dir="ltr" 
              />
          </div>
       </div>

       {/* Toolbar - FIXED at bottom inside visual viewport container */}
       <div className={`flex-none w-full p-2 border-t border-black/5 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
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
  const [suppressDelete, setSuppressDelete] = useLocalStorage<boolean>('desnote-suppress-delete', false); // Added specific key

  useEffect(() => {
    if (isDark) { document.body.classList.add('dark'); } else { document.body.classList.remove('dark'); }
  }, [isDark]);

  const [notes, setNotes] = useLocalStorage<Note[]>('desnote-notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('desnote-folders', [
    { id: '1', name: 'Personal', color: 'rose', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' },
    { id: '2', name: 'Work', color: 'blue', shape: 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' }
  ]);
  
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

  // --- Satpam Back Button Logic (ADAPTED FROM V1.7 - ROBUST!) ---
  const historyPopped = useRef(false); // Ref from V1.7 to prevent loop

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      historyPopped.current = true; // Mark that pop happened

      // Hierarchy of Closing
      if (deleteModal.isOpen) { setDeleteModal(prev => ({...prev, isOpen: false})); return; }
      if (showMoveDialog) { setShowMoveDialog(false); return; }
      if (folderSettingsId) { setFolderSettingsId(null); return; }
      if (showNoteSettings) { setShowNoteSettings(false); return; }
      
      if (activeNoteId) { setActiveNoteId(null); return; }

      if (peekingNoteId) { 
          setPeekingNoteId(null); 
          // Stop here! Don't close folder yet.
          return; 
      }

      if (expandedFolderId) { setExpandedFolderId(null); return; }
      
      if (showSearch) { setShowSearch(false); return; }
      if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); return; }
      if (showSidebar) { setShowSidebar(false); return; }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeNoteId, expandedFolderId, showSidebar, isSelectionMode, showSearch, peekingNoteId, folderSettingsId, showMoveDialog, deleteModal.isOpen, showNoteSettings]);

  // V1.7 Style Push State
  useEffect(() => {
    if (historyPopped.current) { historyPopped.current = false; return; } // Don't push if we just popped
    if (activeNoteId || expandedFolderId || isSelectionMode || showSearch || peekingNoteId || showSidebar || folderSettingsId || showMoveDialog || deleteModal.isOpen || showNoteSettings) {
        window.history.pushState(null, '', window.location.href);
    }
  }, [activeNoteId, expandedFolderId, isSelectionMode, showSearch, peekingNoteId, showSidebar, folderSettingsId, showMoveDialog, deleteModal.isOpen, showNoteSettings]);


  // --- Logic Filtering ---
  const getFilteredData = () => {
      let filteredNotes = notes.filter(n => activeTab === 'trash' ? n.isDeleted : !n.isDeleted);
      let filteredFolders = folders.filter(f => activeTab === 'trash' ? f.isDeleted : !f.isDeleted);

      if (activeTab === 'favorites') {
          filteredNotes = filteredNotes.filter(n => n.isPinned);
          filteredFolders = filteredFolders.filter(f => f.isPinned); 
      } else if (activeTab === 'folders') {
          filteredNotes = [];
      } else if (activeTab === 'notes') {
          filteredFolders = []; // Just show notes (flat list)
      } 

      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (activeTab === 'folders') {
              filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q));
          } else if (activeTab === 'notes') {
               filteredNotes = filteredNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
          } else {
              filteredNotes = filteredNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
              filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q));
          }
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

  // DELETE & RESTORE (With Vomit Logic)
  const executeDelete = (type: string, id: string | null) => {
      if (!id) return;
      if (activeTab === 'trash') {
        if (type === 'note') setNotes(prev => prev.filter(n => n.id !== id));
        else setFolders(prev => prev.filter(f => f.id !== id));
      } else {
        if (type === 'note') {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true, updatedAt: Date.now() } : n));
        } else {
             // Logic Muntah: Isi folder ke dashboard
             setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null, updatedAt: Date.now() } : n));
             setFolders(prev => prev.map(f => f.id === id ? { ...f, isDeleted: true } : f));
        }
      }
      if (activeNoteId === id) setActiveNoteId(null);
  };

  const requestDelete = (type: string, id: string) => {
      if (suppressDelete) { executeDelete(type, id); }
      else { setDeleteModal({ isOpen: true, type, id }); }
  };

  const handleConfirmDelete = (suppress: boolean) => {
      if (suppress) setSuppressDelete(true);
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

  const toggleFavoriteSelected = () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      
      let pinnedCount = 0;
      let totalCount = 0;

      notes.forEach(n => { if (ids.includes(n.id)) { totalCount++; if (n.isPinned) pinnedCount++; }});
      folders.forEach(f => { if (ids.includes(f.id)) { totalCount++; if (f.isPinned) pinnedCount++; }});

      const shouldPin = pinnedCount < totalCount;

      setNotes(prev => prev.map(n => ids.includes(n.id) ? { ...n, isPinned: shouldPin } : n));
      setFolders(prev => prev.map(f => ids.includes(f.id) ? { ...f, isPinned: shouldPin } : f));
      
      setIsSelectionMode(false);
      setSelectedIds(new Set());
  };

  const activeNote = activeNoteId ? notes.find(n => n.id === activeNoteId) : null;

  const toggleSelection = (id: string) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
     setSelectedIds(newSet);
  };

  const openNoteFromPeek = (noteId: string) => {
      setPeekingNoteId(null); 
      setActiveNoteId(noteId); 
  };

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
          />
        ) : (
          <Dashboard 
            key="dashboard" 
            notes={filteredNotes} folders={filteredFolders} 
            allNotes={notes} 
            isDark={isDark} toggleSidebar={() => setShowSidebar(true)}
            activeTab={activeTab} setActiveTab={setActiveTab}
            expandedFolderId={expandedFolderId} setExpandedFolderId={setExpandedFolderId} peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId}
            onOpenNote={openNoteFromPeek} // Correct handler
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
            toggleSelection={toggleSelection}
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

// --- Header Component ---
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
    const verticalPadding = useTransform(scrollY, [0, 50], [16, 8]);
    
    const tabs = [
        { id: 'all', label: 'All', icon: Layers },
        { id: 'favorites', label: 'Favorit', icon: Star },
        { id: 'folders', label: 'Folder', icon: FolderIcon },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'trash', label: 'Sampah', icon: Trash2 },
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

            {/* Tabs */}
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
                                transition={softSpring}
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
  onMoveClick, toggleFavoriteSelected, toggleSelection
}: any) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  let displayNotes;
  if (activeTab === 'trash') {
      displayNotes = notes; 
  } else if (activeTab === 'notes') {
      displayNotes = notes; 
  } else {
      displayNotes = notes.filter((n: Note) => n.folderId === null); 
  }

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
                    toggleSelection={toggleSelection}
                    selectedIds={selectedIds}
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
  peekingNoteId, setPeekingNoteId, isTrash, onLongPress, toggleSelection, selectedIds
}: any) => {
  const themeClass = colors[folder.color] || colors.slate;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
      if (isSelectionMode) return;
      longPressTimer.current = setTimeout(() => {
          onLongPress();
      }, 500);
  };

  const handlePointerUp = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  
  const onDragEnd = (event: any, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 100 && !isSelectionMode && !isExpanded) {
          onDelete(); 
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
                drag={!isExpanded && !isSelectionMode ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={onDragEnd}
                whileTap={!isExpanded && !isSelectionMode ? { scale: 0.95 } : {}}
                className={`${themeClass} ${folder.shape} relative z-10 w-full ${isExpanded ? 'h-auto min-h-full pb-12' : 'h-full'} ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}`}
            >
                <div className={`p-5 flex flex-col ${isExpanded ? '' : 'h-full'}`}>
                    <div className="flex justify-between items-start mb-2">
                         <div className="pr-2 relative">
                             {folder.isPinned && !isExpanded && <div className="absolute -top-1 -left-2 text-yellow-400 bg-black/10 rounded-full p-0.5 scale-75"><Star fill="currentColor" size={12}/></div>}
                             <h2 className="text-2xl font-bold leading-tight line-clamp-2">{folder.name}</h2>
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
                                    onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)} 
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(note.id)} 
                                    onDelete={() => onDeleteNote(note.id)} 
                                    isPeeking={peekingNoteId === note.id}
                                    onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
                                    // ENABLE SELECT IN FOLDER (FIXED)
                                    onLongPress={() => toggleSelection(note.id)}
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
      // Allow long press anywhere (unless already dragging/peeking)
      if (safeIsPeeking) return;
      longPressTimer.current = setTimeout(() => {
          if (onLongPress) onLongPress();
      }, 500);
  };

  const handlePointerUp = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  
  const onDragEnd = (event: any, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 100 && !isSelectionMode) {
           onDelete(); 
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
           drag={!isSelectionMode && !safeIsPeeking ? "x" : false}
           dragConstraints={{ left: 0, right: 0 }}
           dragElastic={0.5}
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
                      {note.isPinned && <div className="absolute top-4 left-4 text-yellow-500 bg-black/10 rounded-full p-1"><Star fill="currentColor" size={12}/></div>}
                      <div className="absolute bottom-4 right-4 opacity-10">
                          {Icon && <Icon size={80} />}
                      </div>
                   </>
               )}
               {isSelected && <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full"><Check size={16}/></div>}
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
