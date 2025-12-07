import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, PanInfo } from 'framer-motion';
import { 
  ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
  FolderPlus, FilePlus, Trash2, X, Palette, Sun, Moon, Folder as FolderIcon,
  Check, Minimize2, Maximize2, Search, Heart, Menu, Download, Upload, 
  CheckSquare, AlertCircle, Plus, CornerDownLeft, 
  Undo, Redo 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder, Shape, ColorTheme } from './types';
import { DARK_COLORS, LIGHT_COLORS, SHAPES, ICONS } from './constants';

// --- Constants ---

const springTransition = { type: "spring", stiffness: 400, damping: 30 };

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

const IconButton = ({ onClick, icon: Icon, className = "", active = false, activeClass = "bg-zinc-800 text-white" }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-full transition-transform active:scale-90 flex-shrink-0 flex items-center justify-center ${active ? activeClass : 'hover:bg-black/10 text-inherit'} ${className}`}
  >
    <Icon size={24} />
  </button>
);

const ToolbarButton = ({ onClick, icon: Icon, active = false, isDark }: any) => (
  <button 
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`p-3 rounded-xl transition-colors flex-shrink-0 ${active ? 'bg-indigo-600 text-white' : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'}`}
  >
    <Icon size={20} />
  </button>
);

// --- Modals (No Border) ---

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDark }: any) => {
  const [suppress, setSuppress] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={springTransition}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
             <AlertCircle size={32}/>
          </div>
          <h3 className="text-xl font-bold mb-2">Hapus Item?</h3>
          <p className="opacity-60 text-sm">Item ini akan dihapus permanen.</p>
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

const NoteSettingsModal = ({ isOpen, onClose, note, onUpdate, onMoveNote, folders, isDark, colors }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={springTransition}
               onClick={e => e.stopPropagation()}
               className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Note Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button>
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4>
                    <div className="flex flex-wrap gap-3">
                        {Object.keys(colors).map(c => {
                             const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0];
                             const isActive = note.color === c;
                             return (
                                <button 
                                  key={c} 
                                  onClick={() => onUpdate(note.id, {color: c})}
                                  className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : ''}`}
                                />
                             )
                        })}
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4>
                    <div className="grid grid-cols-4 gap-3">
                        {SHAPES.slice(0, 12).map((s,i) => (
                            <button 
                                key={i} 
                                onClick={() => onUpdate(note.id, {shape: s})}
                                className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${note.shape === s ? '!opacity-100 ring-2 ring-indigo-500' : ''}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Icon</h4>
                    <div className="grid grid-cols-6 gap-2">
                        {Object.keys(ICONS).map(k => { 
                            const I = ICONS[k]; 
                            return (
                                <button 
                                    key={k} 
                                    onClick={() => onUpdate(note.id, {icon: k})} 
                                    className={`p-2 hover:bg-black/5 rounded flex items-center justify-center ${note.icon === k ? 'text-indigo-600 bg-indigo-50' : ''}`}
                                >
                                    <I size={20}/>
                                </button>
                            ) 
                        })}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Location</h4>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => onMoveNote(note.id, null)} className={`w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${note.folderId === null ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'hover:bg-black/5'}`}>
                            <CornerDownLeft size={18}/> Dashboard
                        </button>
                        {folders.map((f: Folder) => (
                            <button key={f.id} onClick={() => onMoveNote(note.id, f.id)} className={`w-full text-left p-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${note.folderId === f.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'hover:bg-black/5'}`}>
                                <FolderIcon size={18}/> {f.name}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const FolderSettingsModal = ({ isOpen, onClose, folder, onUpdate, isDark, colors }: any) => {
    if (!isOpen || !folder) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={springTransition}
               onClick={e => e.stopPropagation()}
               className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Folder Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button>
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold opacity-50 mb-2 uppercase tracking-wider">Rename</h4>
                    <input 
                        value={folder.name}
                        onChange={(e) => onUpdate(folder.id, { name: e.target.value })}
                        className={`w-full p-3 rounded-xl text-lg font-medium outline-none ${isDark ? 'bg-zinc-800 focus:bg-zinc-700' : 'bg-zinc-100 focus:bg-zinc-200'}`}
                    />
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4>
                    <div className="flex flex-wrap gap-3">
                        {Object.keys(colors).map(c => {
                             const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0];
                             const isActive = folder.color === c;
                             return (
                                <button 
                                  key={c} 
                                  onClick={() => onUpdate(folder.id, {color: c})}
                                  className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : ''}`}
                                />
                             )
                        })}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4>
                    <div className="grid grid-cols-4 gap-3">
                        {SHAPES.slice(0, 12).map((s,i) => (
                            <button 
                                key={i} 
                                onClick={() => onUpdate(folder.id, {shape: s})}
                                className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${folder.shape === s ? '!opacity-100 ring-2 ring-indigo-500' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// --- Sidebar (No Blur, Darker) ---
const Sidebar = ({ isOpen, onClose, isDark, toggleTheme, onExport, onImport }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Cuma Gelap Hitam 40%, NO BLUR */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-[60]" />
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} 
            transition={{ type: 'tween', duration: 0.3 }}
            className={`fixed top-0 left-0 bottom-0 w-80 z-[70] p-6 shadow-2xl overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Dinduy</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10"><X size={24} /></button>
            </div>
            <div className={`p-5 rounded-2xl mb-6 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
               <h3 className="text-xs uppercase font-bold opacity-50 mb-3">Developer</h3>
               <div className="font-bold text-lg">Ilham Danial Saputra</div>
               <div className="opacity-70 text-sm mb-4">Mahasiswa Pendidikan Sejarah</div>
               <a href="https://saweria.co/Densl" target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl font-medium bg-[#fab005] text-black hover:bg-[#e09e04] transition-colors flex items-center justify-center gap-2">
                 <Heart size={18} fill="black" /> Donate (Saweria)
               </a>
            </div>
            <div className="space-y-4">
              <button onClick={toggleTheme} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                {isDark ? <Sun className="text-yellow-400" /> : <Moon className="text-indigo-600" />}
                <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button onClick={onExport} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                <Download size={20} />
                <span className="font-medium">Backup Data</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                <Upload size={20} />
                <span className="font-medium">Import Data</span>
                <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={onImport}/>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Note Editor ---

const NoteEditor = ({ note, onUpdate, onClose, onDelete, onMoveNote, folders, isDark, showSettings, onCloseSettings, onOpenSettings }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const themeClass = colors[note.color] || colors.slate;
  
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

  const format = (cmd: string, val?: string) => { 
      editorRef.current?.focus();
      setTimeout(() => {
          document.execCommand(cmd, false, val);
          checkFormats();
      }, 0);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== note.content) {
        editorRef.current.innerHTML = note.content;
    }
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${themeClass}`}>
       
       <NoteSettingsModal 
          isOpen={showSettings} 
          onClose={onCloseSettings} 
          note={note} 
          onUpdate={onUpdate}
          onMoveNote={onMoveNote}
          folders={folders}
          isDark={isDark}
          colors={colors}
       />

       <div className={`flex-none flex justify-between items-center p-4 bg-transparent`}>
          <button onClick={onClose} className={`p-3 rounded-full hover:bg-black/10`}><ArrowLeft/></button>
          <div className="flex gap-2 relative">
             <IconButton icon={Undo} onClick={() => document.execCommand('undo')} />
             <IconButton icon={Redo} onClick={() => document.execCommand('redo')} />
             <IconButton icon={Palette} onClick={onOpenSettings} />
             <IconButton icon={Trash2} onClick={onDelete} className="text-current hover:bg-red-500/20" />
          </div>
       </div>

       <div className={`flex-1 overflow-y-auto px-6 py-6 bg-transparent`}>
          <div className="max-w-4xl mx-auto pb-24">
              <input 
                value={note.title} 
                onChange={(e) => onUpdate(note.id, {title: e.target.value})} 
                placeholder="Title" 
                className="w-full bg-transparent text-4xl font-bold outline-none mb-6 placeholder-current/30 text-left" 
                dir="ltr"
              />
              <div 
                ref={editorRef} 
                contentEditable 
                suppressContentEditableWarning
                onInput={(e) => {
                    onUpdate(note.id, {content: e.currentTarget.innerHTML});
                    checkFormats();
                }}
                onKeyUp={checkFormats}
                onMouseUp={checkFormats}
                onTouchEnd={checkFormats}
                className="outline-none text-xl leading-relaxed min-h-[50vh] empty:before:content-['Type_something...'] empty:before:opacity-50 text-left [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dir="ltr"
              />
          </div>
       </div>

       <div className={`flex-none w-full p-2 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start px-4 md:justify-center">
             <ToolbarButton icon={Bold} onClick={() => format('bold')} active={activeFormats.includes('bold')} isDark={isDark} />
             <ToolbarButton icon={Italic} onClick={() => format('italic')} active={activeFormats.includes('italic')} isDark={isDark} />
             <ToolbarButton icon={Underline} onClick={() => format('underline')} active={activeFormats.includes('underline')} isDark={isDark} />
             <div className="w-px h-6 bg-current opacity-20 mx-2 self-center flex-shrink-0"/>
             <ToolbarButton icon={AlignLeft} onClick={() => format('justifyLeft')} active={activeFormats.includes('justifyLeft')} isDark={isDark} />
             <ToolbarButton icon={AlignCenter} onClick={() => format('justifyCenter')} active={activeFormats.includes('justifyCenter')} isDark={isDark} />
             <ToolbarButton icon={AlignRight} onClick={() => format('justifyRight')} active={activeFormats.includes('justifyRight')} isDark={isDark} />
             <div className="w-px h-6 bg-current opacity-20 mx-2 self-center flex-shrink-0"/>
             <ToolbarButton icon={List} onClick={() => format('insertUnorderedList')} active={activeFormats.includes('insertUnorderedList')} isDark={isDark} />
          </div>
       </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isDark, setIsDark] = useLocalStorage<boolean>('desnote-theme', false);
  const [suppressDelete, setSuppressDelete] = useLocalStorage<boolean>('dinduy_suppress_delete_confirm', false);

  useEffect(() => {
    if (isDark) { document.body.classList.add('dark'); } else { document.body.classList.remove('dark'); }
    
    // Meta Tag Logic for Keyboard
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
        const originalContent = meta.getAttribute('content');
        if (originalContent && !originalContent.includes('interactive-widget')) {
            meta.setAttribute('content', `${originalContent}, interactive-widget=resizes-content`);
        }
    }
  }, [isDark]);

  const [notes, setNotes] = useLocalStorage<Note[]>('desnote-notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('desnote-folders', [
    { id: '1', name: 'Personal', color: 'rose', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' },
    { id: '2', name: 'Work', color: 'blue', shape: 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' }
  ]);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [peekingNoteId, setPeekingNoteId] = useState<string | null>(null); 
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: string, id: string | null}>({isOpen: false, type: '', id: null});
  
  const [folderSettingsId, setFolderSettingsId] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showNoteSettings, setShowNoteSettings] = useState(false);

  // --- FIX: SATPAM HISTORY ---
  const historyPopped = useRef(false);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      historyPopped.current = true;

      if (showNoteSettings) { setShowNoteSettings(false); event.preventDefault(); }
      else if (folderSettingsId) { setFolderSettingsId(null); event.preventDefault(); }
      else if (showMoveDialog) { setShowMoveDialog(false); event.preventDefault(); }
      else if (deleteModal.isOpen) { setDeleteModal({ ...deleteModal, isOpen: false }); event.preventDefault(); }
      else if (activeNoteId) { setActiveNoteId(null); event.preventDefault(); } 
      else if (showSidebar) { setShowSidebar(false); event.preventDefault(); }
      else if (peekingNoteId) { setPeekingNoteId(null); event.preventDefault(); }
      else if (expandedFolderId) { setExpandedFolderId(null); event.preventDefault(); }
      else if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); event.preventDefault(); }
      else if (showNewMenu) { setShowNewMenu(false); event.preventDefault(); }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    activeNoteId, showSidebar, peekingNoteId, expandedFolderId, isSelectionMode, showNewMenu,
    showNoteSettings, folderSettingsId, showMoveDialog, deleteModal
  ]);

  // --- LOGIKA PUSH STATE ---
  useEffect(() => {
    if (historyPopped.current) {
      historyPopped.current = false; 
      return;
    }
    if (
        activeNoteId || showSidebar || peekingNoteId || expandedFolderId || isSelectionMode ||
        showNoteSettings || folderSettingsId || showMoveDialog || deleteModal.isOpen
    ) {
      window.history.pushState(null, '', window.location.href);
    }
  }, [
    activeNoteId, showSidebar, peekingNoteId, expandedFolderId, isSelectionMode,
    showNoteSettings, folderSettingsId, showMoveDialog, deleteModal
  ]);

  const filteredNotes = searchQuery 
    ? notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleExport = () => {
    const data = JSON.stringify({ notes, folders }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinduy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.notes && data.folders) {
          setNotes(data.notes);
          setFolders(data.folders);
          alert('Data imported successfully!');
          setShowSidebar(false);
        }
      } catch (err) { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  const createNote = (folderId: string | null = null) => {
    const newNote: Note = {
      id: uuidv4(),
      title: '',
      content: '',
      folderId,
      color: 'slate',
      shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl',
      icon: 'file-text',
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setShowNewMenu(false);
  };

  const createFolder = () => {
    const newFolder: Folder = {
      id: uuidv4(),
      name: 'New Folder',
      color: 'violet',
      shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl',
    };
    setFolders([...folders, newFolder]);
    setShowNewMenu(false);
  };

  const executeDelete = (type: string, id: string | null) => {
      if (!id) return;
      if (type === 'note') {
          setNotes(prev => prev.filter(n => n.id !== id));
          if (activeNoteId === id) setActiveNoteId(null);
      } else if (type === 'folder') {
          setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
          setFolders(prev => prev.filter(f => f.id !== id));
          if (expandedFolderId === id) setExpandedFolderId(null);
      }
  };

  const requestDelete = (type: string, id: string) => {
      if (suppressDelete) {
          executeDelete(type, id);
      } else {
          setDeleteModal({ isOpen: true, type, id });
      }
  };

  // --- LOGIC MOVE SELECTED (FIXED TOTAL) ---
  const handleMoveSelected = (targetId: string | null) => {
      // COPY ID KE ARRAY UNTUK MEMASTIKAN AKSES DATA AMAN
      const idsToMove = Array.from(selectedIds);
      
      setNotes(prevNotes => {
          return prevNotes.map(n => {
              // CEK APAKAH ID CATATAN ADA DI DAFTAR YG DIPILIH
              if (idsToMove.includes(n.id)) {
                  // GANTI FOLDER ID NYA
                  return { ...n, folderId: targetId };
              }
              return n;
          });
      });

      // MATIKAN MODE SELECT & TUTUP DIALOG
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      setShowMoveDialog(false);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#121212] text-[#f0f0f0]' : 'bg-[#fdfdfd] text-[#1a1c1e]'}`}>
      <Sidebar 
        isOpen={showSidebar} onClose={() => setShowSidebar(false)} 
        isDark={isDark} toggleTheme={() => setIsDark(!isDark)}
        onExport={handleExport} onImport={handleImport}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({...deleteModal, isOpen: false})}
        isDark={isDark}
        onConfirm={(suppress: boolean) => {
            if (suppress) setSuppressDelete(true);
            executeDelete(deleteModal.type, deleteModal.id);
            setDeleteModal({...deleteModal, isOpen: false});
        }}
      />

      <FolderSettingsModal 
         isOpen={!!folderSettingsId}
         onClose={() => setFolderSettingsId(null)}
         folder={folders.find(f => f.id === folderSettingsId)}
         isDark={isDark}
         colors={isDark ? DARK_COLORS : LIGHT_COLORS}
         onUpdate={(id: string, u: any) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...u} : f))}
      />

      <AnimatePresence mode="wait">
        {activeNoteId ? (
          <NoteEditor 
            key="editor"
            note={activeNote!}
            folders={folders}
            isDark={isDark}
            showSettings={showNoteSettings}
            onOpenSettings={() => setShowNoteSettings(true)}
            onCloseSettings={() => setShowNoteSettings(false)}
            onUpdate={(id: string, u: Partial<Note>) => setNotes(prev => prev.map(n => n.id === id ? {...n, ...u, updatedAt: Date.now()} : n))}
            onClose={() => setActiveNoteId(null)}
            onDelete={() => requestDelete('note', activeNoteId!)}
            onMoveNote={(nId: string, fId: string | null) => setNotes(prev => prev.map(n => n.id === nId ? {...n, folderId: fId} : n))}
          />
        ) : (
          <Dashboard 
            key="dashboard"
            notes={notes}
            folders={folders}
            isDark={isDark}
            toggleSidebar={() => setShowSidebar(true)}
            expandedFolderId={expandedFolderId}
            setExpandedFolderId={setExpandedFolderId}
            peekingNoteId={peekingNoteId} 
            setPeekingNoteId={setPeekingNoteId}
            onOpenNote={setActiveNoteId}
            onUpdateFolder={(id, u) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...u} : f))}
            onDeleteFolder={(id) => requestDelete('folder', id)}
            onDeleteNote={(id) => requestDelete('note', id)}
            onCreateNoteInFolder={createNote}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            setIsSelectionMode={setIsSelectionMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredNotes={filteredNotes}
            openFolderSettings={(id) => setFolderSettingsId(id)}
            
            // Pass Move Logic (DIJAMIN SAMPAI KE DASHBOARD)
            showMoveDialog={showMoveDialog}
            setShowMoveDialog={setShowMoveDialog}
            moveSelected={handleMoveSelected}
            
            deleteSelected={() => {
                setNotes(prev => prev.filter(n => !selectedIds.has(n.id)));
                setFolders(prev => prev.filter(f => !selectedIds.has(f.id)));
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            }}
          />
        )}
      </AnimatePresence>

      {!activeNoteId && !isSelectionMode && !searchQuery && (
        <div className="fixed bottom-6 right-6 z-40">
           <AnimatePresence>
            {showNewMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} transition={springTransition} className="absolute bottom-20 right-0 flex flex-col gap-3 items-end mb-2">
                <button onClick={() => createFolder()} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-800'}`}>
                  <span className="font-medium">New Folder</span><FolderPlus size={20} />
                </button>
                <button onClick={() => createNote()} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-800'}`}>
                  <span className="font-medium">New Note</span><FilePlus size={20} />
                </button>
              </motion.div>
            )}
           </AnimatePresence>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewMenu(!showNewMenu)} className={`w-16 h-16 rounded-[1.2rem] shadow-xl flex items-center justify-center ${isDark ? 'bg-emerald-800 text-white' : 'bg-zinc-900 text-white'}`}>
            <motion.div animate={{ rotate: showNewMenu ? 45 : 0 }} transition={springTransition}><Plus size={32} /></motion.div>
          </motion.button>
        </div>
      )}
    </div>
  );
}

// --- Dashboard ---

const Dashboard = ({ 
  notes, folders, isDark, toggleSidebar, expandedFolderId, setExpandedFolderId, peekingNoteId, setPeekingNoteId,
  onOpenNote, onUpdateFolder, onDeleteFolder, onDeleteNote, onCreateNoteInFolder,
  isSelectionMode, selectedIds, setSelectedIds, setIsSelectionMode,
  searchQuery, setSearchQuery, filteredNotes, moveSelected, deleteSelected, openFolderSettings,
  showMoveDialog, setShowMoveDialog
}: any) => {
  const rootNotes = notes.filter((n: Note) => n.folderId === null);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const toggleSelection = (id: string) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
     setSelectedIds(newSet);
  };

  const handleExitSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set()); 
  };

  const hasFolderSelected = Array.from(selectedIds).some(id => folders.some((f: Folder) => f.id === id));

  return (
    <div className="pb-32 px-4 pt-6 md:px-8 max-w-7xl mx-auto min-h-screen" onClick={() => { setExpandedFolderId(null); if (isSelectionMode) handleExitSelection(); }}>
      <header className="mb-8 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
         <button onClick={toggleSidebar} className={`p-3 rounded-full transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <Menu size={24} />
         </button>
         {/* FIX: Search Bar Darker BG (Gray-200) */}
         <div className={`flex-1 relative rounded-full flex items-center px-4 py-3 transition-colors ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
            <Search size={20} className="opacity-50 mr-3" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="bg-transparent outline-none w-full placeholder-current/50 font-medium text-left" dir="ltr" />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} /></button>}
         </div>
         <button onClick={() => isSelectionMode ? handleExitSelection() : setIsSelectionMode(true)} className={`p-3 rounded-full transition-colors ${isSelectionMode ? 'bg-indigo-600 text-white' : isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <CheckSquare size={24} />
         </button>
      </header>

      <LayoutGroup>
        <motion.div layout transition={springTransition} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {searchQuery ? filteredNotes.map((note: Note) => (
               <NoteCard 
                  key={note.id} note={note} isDark={isDark} colors={colors} 
                  onClick={() => onOpenNote(note.id)} 
                  onDelete={() => onDeleteNote(note.id)} 
                  // FIX: Peeking in Search RESTORED
                  isPeeking={peekingNoteId === note.id}
                  onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
               />
           )) : (
             <>
               {folders.map((folder: Folder) => (
                  <FolderItem 
                    key={folder.id} 
                    folder={folder} 
                    notes={notes.filter((n: Note) => n.folderId === folder.id)}
                    isExpanded={expandedFolderId === folder.id}
                    isDark={isDark}
                    colors={colors}
                    onToggle={() => setExpandedFolderId(folder.id)}
                    onClose={() => setExpandedFolderId(null)}
                    onOpenNote={onOpenNote}
                    onDelete={() => onDeleteFolder(folder.id)}
                    onUpdate={onUpdateFolder}
                    onCreateNote={() => onCreateNoteInFolder(folder.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(folder.id)}
                    onSelect={() => toggleSelection(folder.id)}
                    onDeleteNote={onDeleteNote}
                    onSettings={() => openFolderSettings(folder.id)}
                    peekingNoteId={peekingNoteId}
                    setPeekingNoteId={setPeekingNoteId}
                  />
               ))}
               {rootNotes.map((note: Note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    isDark={isDark} 
                    colors={colors} 
                    onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)} 
                    onDelete={() => onDeleteNote(note.id)}
                    isSelected={selectedIds.has(note.id)}
                    isSelectionMode={isSelectionMode}
                    isPeeking={peekingNoteId === note.id}
                    onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
                  />
               ))}
             </>
           )}
        </motion.div>
      </LayoutGroup>

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={springTransition} className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pb-8">
             <div className={`flex gap-4 px-6 py-3 rounded-full shadow-2xl ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mr-4 border-r pr-4 border-gray-500/20"><span className="font-bold text-lg">{selectedIds.size}</span></div>
                {!hasFolderSelected && (
                    <button onClick={() => setShowMoveDialog(true)} className="p-2 rounded-full hover:bg-black/5"><FolderIcon size={24} /></button>
                )}
                <button onClick={deleteSelected} className="p-2 rounded-full hover:bg-red-500/10 text-red-500"><Trash2 size={24} /></button>
                <button onClick={handleExitSelection} className="p-2 rounded-full hover:bg-black/5 ml-2"><X size={24} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showMoveDialog && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowMoveDialog(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-full max-w-sm rounded-3xl p-6 ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`} onClick={e => e.stopPropagation()}>
               <h3 className="text-xl font-bold mb-4">Move to...</h3>
               <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                  <button onClick={() => moveSelected(null)} className="p-4 rounded-xl hover:bg-black/5 text-left font-medium">Dashboard</button>
                  {folders.map((f: Folder) => (
                     <button key={f.id} onClick={() => moveSelected(f.id)} className="p-4 rounded-xl hover:bg-black/5 text-left font-medium">{f.name}</button>
                  ))}
               </div>
               <button onClick={() => setShowMoveDialog(false)} className="mt-4 w-full py-3 opacity-60">Cancel</button>
            </motion.div>
         </div>
      )}
    </div>
  );
};

// --- Folder Item (Clean) ---

const FolderItem = ({ 
  folder, notes, isExpanded, isDark, colors, onToggle, onClose,
  onOpenNote, onDelete, onUpdate, onCreateNote,
  isSelectionMode, isSelected, onSelect, onDeleteNote, onSettings,
  peekingNoteId, setPeekingNoteId
}: any) => {
  const themeClass = colors[folder.color] || colors.slate;

  const handleDragEnd = (event: any, info: PanInfo) => {
     if (Math.abs(info.offset.x) > 100 && !isSelectionMode) onDelete();
  };

  return (
    <motion.div 
       layout 
       transition={springTransition}
       className={`${isExpanded ? 'col-span-full' : 'col-span-1 aspect-square'}`}
       onClick={(e) => { e.stopPropagation(); if (isSelectionMode) onSelect(); else isExpanded ? onClose() : onToggle(); }}
    >
        <div className="relative w-full h-full rounded-3xl">
            <motion.div
                drag={!isExpanded && !isSelectionMode ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.5, right: 0.5 }} 
                onDragEnd={handleDragEnd}
                className={`${themeClass} ${folder.shape} relative z-10 w-full h-full ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}`}
            >
                {/* HEADER */}
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold truncate pr-2">{folder.name}</h2>
                        {/* Settings Button */}
                        {isExpanded && !isSelectionMode && (
                             <IconButton icon={Palette} onClick={(e: any) => { e.stopPropagation(); onSettings(); }} />
                        )}
                    </div>
                    {!isExpanded && <div className="text-sm opacity-60 font-medium mt-auto pt-4">{notes.length} Notes</div>}
                </div>

                {/* EXPANDED CONTENT */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springTransition} className="p-6 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note: Note) => (
                                <NoteCard 
                                    key={note.id} note={note} isDark={isDark} colors={colors} inFolder 
                                    onClick={() => onOpenNote(note.id)} onDelete={() => onDeleteNote(note.id)}
                                    isPeeking={peekingNoteId === note.id}
                                    onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
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

// --- Note Card (Clean) ---

const NoteCard = ({ note, onClick, onDelete, inFolder, isDark, colors, isSelected, isSelectionMode, isPeeking, onPeek }: any) => {
  const Icon = ICONS[note.icon] || ICONS['file-text'];
  const themeClass = colors[note.color] || colors.slate;
  
  // Kalau mode search/selection, peek disable (pake false), kalau normal pake props
  const safeIsPeeking = isPeeking || false;

  const handleDragEnd = (event: any, info: PanInfo) => {
     if (Math.abs(info.offset.x) > 100 && !isSelectionMode) onDelete();
  };

  const previewText = note.content.replace(/<[^>]+>/g, ' ').trim() || "No content";

  return (
    <motion.div 
       layout 
       transition={springTransition}
       className={`${safeIsPeeking ? 'col-span-2 row-span-2 z-30' : 'col-span-1 aspect-square'} relative`}
       onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
        <div className="relative w-full h-full">
            <motion.div
               drag={!safeIsPeeking && !isSelectionMode ? "x" : false}
               dragConstraints={{ left: 0, right: 0 }}
               dragElastic={{ left: 0.5, right: 0.5 }} 
               onDragEnd={handleDragEnd}
               layoutId={`note-${note.id}`}
               transition={springTransition}
               className={`
                  w-full h-full relative z-10 cursor-pointer group overflow-hidden
                  ${themeClass} ${note.shape}
                  ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}
                  ${safeIsPeeking ? 'shadow-2xl' : ''}
               `}
            >
               <div className="p-6 h-full flex flex-col relative">
                   {safeIsPeeking ? (
                       <div className="flex flex-col h-full overflow-hidden">
                           <h3 className="text-3xl font-bold mb-4 leading-tight">{note.title || "Untitled"}</h3>
                           <div className="text-lg opacity-80 leading-relaxed overflow-hidden max-h-[300px]">
                               {previewText}
                           </div>
                       </div>
                   ) : (
                       <>
                          <h3 className="text-xl font-bold leading-tight line-clamp-3 relative z-10">{note.title || "Untitled"}</h3>
                          <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none">
                              <Icon size={80} />
                          </div>
                       </>
                   )}
                   {!isSelectionMode && onPeek && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onPeek(!safeIsPeeking); }}
                         className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm z-20 transition-transform active:scale-90 ${isDark ? 'bg-zinc-800' : 'bg-white'}`}
                       >
                          {safeIsPeeking ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                       </button>
                   )}
                   {isSelected && <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full"><Check size={16}/></div>}
               </div>
            </motion.div>
        </div>
    </motion.div>
  );
};