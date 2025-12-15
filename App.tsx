import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, PanInfo, useDragControls } from 'framer-motion';
import { 
  ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
  FolderPlus, FilePlus, Trash2, X, Palette, Sun, Moon, Folder as FolderIcon,
  Check, Minimize2, Maximize2, Search, Heart, Menu, Download, Upload, 
  CheckSquare, AlertCircle, Plus, CornerDownLeft, 
  Undo, Redo, Star, Archive, Clock, LayoutGrid
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder, ColorTheme } from './types';
import { DARK_COLORS, LIGHT_COLORS, SHAPES, ICONS } from './constants';

// --- Constants ---
const springTransition = { type: "spring", stiffness: 500, damping: 30, mass: 1 }; // Lebih fluid

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

const IconButton = ({ onClick, icon: Icon, className = "", active = false, activeClass = "bg-zinc-800 text-white" }: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
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

// --- Modals ---

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDark, title = "Hapus Item?", message = "Item ini akan dihapus." }: any) => {
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
             <AlertCircle size={32}/>
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="opacity-60 text-sm">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium opacity-60 hover:opacity-100 hover:bg-black/5">Batal</button>
          <button onClick={() => onConfirm()} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600">Hapus</button>
        </div>
      </motion.div>
    </div>
  );
}

const NoteSettingsModal = ({ isOpen, onClose, note, onUpdate, isDark, colors }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Note Settings</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={24}/></button></div>
                
                <div className="mb-6 flex gap-2">
                   <button onClick={() => onUpdate(note.id, { isFavorite: !note.isFavorite })} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border font-medium ${note.isFavorite ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-current/20'}`}>
                      <Star size={20} fill={note.isFavorite ? "currentColor" : "none"} /> Favorite
                   </button>
                   <button onClick={() => onUpdate(note.id, { isArchived: !note.isArchived })} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border font-medium ${note.isArchived ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-current/20'}`}>
                      <Archive size={20} /> {note.isArchived ? 'Unarchive' : 'Archive'}
                   </button>
                </div>

                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Color Theme</h4><div className="flex flex-wrap gap-3">{Object.keys(colors).map(c => { const bgClass = LIGHT_COLORS[c as ColorTheme].split(' ')[0]; const isActive = note.color === c; return (<button key={c} onClick={() => onUpdate(note.id, {color: c})} className={`w-10 h-10 rounded-full ${bgClass} ${isActive ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : ''}`} />) })}</div></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Shape</h4><div className="grid grid-cols-4 gap-3">{SHAPES.slice(0, 12).map((s,i) => <button key={i} onClick={() => onUpdate(note.id, {shape: s})} className={`h-12 bg-current opacity-10 hover:opacity-30 transition-opacity ${s} ${note.shape === s ? '!opacity-100 ring-2 ring-indigo-500' : ''}`} />)}</div></div>
                <div className="mb-6"><h4 className="text-xs font-bold opacity-50 mb-3 uppercase tracking-wider">Icon</h4><div className="grid grid-cols-6 gap-2">{Object.keys(ICONS).map(k => { const I = ICONS[k]; return <button key={k} onClick={() => onUpdate(note.id, {icon: k})} className={`p-2 hover:bg-black/5 rounded flex items-center justify-center ${note.icon === k ? 'text-indigo-600 bg-indigo-50' : ''}`}><I size={20}/></button> })}</div></div>
            </motion.div>
        </div>
    );
};

// --- Note Editor (FIX KEYBOARD: Absolute + Resize) ---
const NoteEditor = ({ note, onUpdate, onClose, onDelete, isDark, showSettings, onCloseSettings, onOpenSettings }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  
  const bgClass = isDark ? 'bg-[#121212]' : (colors[note.color] || colors.slate).split(' ')[0];
  const textClass = isDark ? 'text-white' : (colors[note.color] || colors.slate).split(' ')[1];
  const themeClass = `${bgClass} ${textClass}`;
  
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const checkFormats = () => { /* ... existing formatting logic ... */ };
  const format = (cmd: string, val?: string) => { editorRef.current?.focus(); setTimeout(() => { document.execCommand(cmd, false, val); checkFormats(); }, 0); };
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== note.content) { editorRef.current.innerHTML = note.content; } }, []);

  return (
    // FIX: Gunakan fixed inset-0 agar benar-benar full screen dan toolbar nempel keyboard
    <div className={`fixed inset-0 z-[100] flex flex-col ${themeClass}`} style={{ height: '100dvh' }}>
       <NoteSettingsModal isOpen={showSettings} onClose={onCloseSettings} note={note} onUpdate={onUpdate} isDark={isDark} colors={colors} />
       
       {/* Top Bar */}
       <div className={`flex-none flex justify-between items-center p-4 bg-transparent`}>
          <button onClick={onClose} className={`p-3 rounded-full hover:bg-white/10`}><ArrowLeft/></button>
          <div className="flex gap-2 relative">
             <IconButton icon={Undo} onClick={() => document.execCommand('undo')} />
             <IconButton icon={Redo} onClick={() => document.execCommand('redo')} />
             {note.isFavorite && <IconButton icon={Star} active={true} activeClass="text-yellow-500" onClick={() => onUpdate(note.id, {isFavorite: false})} />}
             <IconButton icon={Palette} onClick={onOpenSettings} />
             <IconButton icon={Trash2} onClick={onDelete} className="text-current hover:bg-red-500/20" />
          </div>
       </div>

       {/* Editor Area */}
       <div className={`flex-1 overflow-y-auto px-6 py-6 bg-transparent`}>
          <div className="max-w-4xl mx-auto pb-24">
              <input value={note.title} onChange={(e) => onUpdate(note.id, {title: e.target.value})} placeholder="Title" className="w-full bg-transparent text-4xl font-bold outline-none mb-6 placeholder-current/30 text-left" dir="ltr" />
              <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(e) => { onUpdate(note.id, {content: e.currentTarget.innerHTML}); checkFormats(); }} className="outline-none text-xl leading-relaxed min-h-[50vh] empty:before:content-['Type_something...'] empty:before:opacity-50 text-left" dir="ltr" />
          </div>
       </div>

       {/* Toolbar - FIXED at bottom to sit on keyboard */}
       <div className={`flex-none w-full p-2 ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50`}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start px-4 md:justify-center">
             <ToolbarButton icon={Bold} onClick={() => format('bold')} active={activeFormats.includes('bold')} isDark={isDark} />
             <ToolbarButton icon={Italic} onClick={() => format('italic')} active={activeFormats.includes('italic')} isDark={isDark} />
             <ToolbarButton icon={Underline} onClick={() => format('underline')} active={activeFormats.includes('underline')} isDark={isDark} />
             <div className="w-px h-6 bg-current opacity-20 mx-2 self-center flex-shrink-0"/>
             <ToolbarButton icon={List} onClick={() => format('insertUnorderedList')} active={activeFormats.includes('insertUnorderedList')} isDark={isDark} />
          </div>
       </div>
    </div>
  );
};

// --- Main App Logic ---

type ViewType = 'all' | 'favorite' | 'folder' | 'note' | 'archive' | 'trash';

export default function App() {
  const [isDark, setIsDark] = useLocalStorage<boolean>('desnote-theme', false);
  useEffect(() => {
    if (isDark) { document.body.classList.add('dark'); } else { document.body.classList.remove('dark'); }
  }, [isDark]);

  const [notes, setNotes] = useLocalStorage<Note[]>('desnote-notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('desnote-folders', []);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [peekingNoteId, setPeekingNoteId] = useState<string | null>(null); 
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [showNoteSettings, setShowNoteSettings] = useState(false);

  // NEW: View State for Tabs
  const [currentView, setCurrentView] = useState<ViewType>('all');

  // NEW: State untuk drag "Floating Layer"
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: string, id: string | null}>({isOpen: false, type: '', id: null});

  // --- CRUD Logic ---

  const createNote = (folderId: string | null = null) => {
    const newNote: Note = { id: uuidv4(), title: '', content: '', folderId, color: 'slate', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl', icon: 'file-text', updatedAt: Date.now() };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setShowNewMenu(false);
  };

  const createFolder = () => {
    const newFolder: Folder = { id: uuidv4(), name: 'New Folder', color: 'violet', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' };
    setFolders([...folders, newFolder]);
    setShowNewMenu(false);
  };

  // SOFT DELETE
  const executeDelete = (type: string, id: string | null) => {
      if (!id) return;
      if (type === 'note') { 
          // Move to Trash (Soft Delete)
          setNotes(prev => prev.map(n => n.id === id ? { ...n, deletedAt: Date.now(), folderId: null, isFavorite: false, isArchived: false } : n));
          if (activeNoteId === id) setActiveNoteId(null); 
      } 
      else if (type === 'folder') { 
          // Release Notes
          setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
          setFolders(prev => prev.filter(f => f.id !== id)); 
          if (expandedFolderId === id) setExpandedFolderId(null); 
      }
      else if (type === 'permanent_note') {
          // Hard Delete from Trash
          setNotes(prev => prev.filter(n => n.id !== id));
      }
      else if (type === 'restore_note') {
          // Restore from Trash
          setNotes(prev => prev.map(n => n.id === id ? { ...n, deletedAt: null } : n));
      }
  };

  // --- Drag Logic: The "Magic" Portal ---
  const handleDragStartFromFolder = (noteId: string) => {
      setDraggingNoteId(noteId); // Ini trigger render di Floating Layer
      setExpandedFolderId(null); // Tutup folder
  };

  const handleDragEndGlobal = (noteId: string, targetFolderId: string | null) => {
      setDraggingNoteId(null); // Matikan floating layer
      
      // Update data asli
      setNotes(prev => prev.map(n => {
          if (n.id === noteId) {
              // Jika targetFolderId null, berarti user drop di Dashboard.
              // Note akan pindah ke Dashboard (folderId: null)
              // KECUALI jika user ingin "batal" drag.
              // Tapi asumsi "Drop" = pindah.
              return { ...n, folderId: targetFolderId, updatedAt: Date.now() };
          }
          return n;
      }));
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  // --- Filter Logic ---
  const getFilteredData = () => {
     let filteredNotes = notes.filter(n => !n.deletedAt); // Exclude deleted by default
     if (currentView === 'trash') filteredNotes = notes.filter(n => n.deletedAt);
     else if (currentView === 'archive') filteredNotes = notes.filter(n => n.isArchived && !n.deletedAt);
     else {
         // Standard views exclude archived
         filteredNotes = filteredNotes.filter(n => !n.isArchived);
         if (currentView === 'favorite') filteredNotes = filteredNotes.filter(n => n.isFavorite);
         if (currentView === 'note') filteredNotes = filteredNotes.filter(n => n.folderId === null); // Only root notes
     }
     
     // Search Override
     if (searchQuery) {
         return {
             notes: notes.filter(n => (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())) && !n.deletedAt),
             folders: folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
         };
     }

     return {
         notes: filteredNotes,
         folders: (currentView === 'all' || currentView === 'folder') ? folders : [] 
     };
  };

  const { notes: displayNotes, folders: displayFolders } = getFilteredData();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#121212] text-[#f0f0f0]' : 'bg-[#fdfdfd] text-[#1a1c1e]'}`}>
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({...deleteModal, isOpen: false})} isDark={isDark} onConfirm={() => { executeDelete(deleteModal.type, deleteModal.id); setDeleteModal({...deleteModal, isOpen: false}); }} />

      <AnimatePresence mode="wait">
        {activeNoteId ? (
          <NoteEditor 
            key="editor" note={activeNote!} isDark={isDark} showSettings={showNoteSettings}
            onOpenSettings={() => setShowNoteSettings(true)} onCloseSettings={() => setShowNoteSettings(false)}
            onUpdate={(id: string, u: Partial<Note>) => setNotes(prev => prev.map(n => n.id === id ? {...n, ...u, updatedAt: Date.now()} : n))}
            onClose={() => setActiveNoteId(null)} 
            onDelete={() => executeDelete('note', activeNoteId)}
          />
        ) : (
          <Dashboard 
            key="dashboard" 
            notes={displayNotes} folders={displayFolders} allNotes={notes} // Pass all notes for folder content
            isDark={isDark} 
            expandedFolderId={expandedFolderId} setExpandedFolderId={setExpandedFolderId} 
            peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId}
            onOpenNote={setActiveNoteId} 
            onUpdateFolder={(id: string, u: any) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...u} : f))}
            onDeleteFolder={(id: string) => executeDelete('folder', id)} 
            onDeleteNote={(id: string) => executeDelete(currentView === 'trash' ? 'permanent_note' : 'note', id)}
            onRestoreNote={(id: string) => executeDelete('restore_note', id)}
            onCreateNoteInFolder={createNote} 
            isSelectionMode={isSelectionMode} selectedIds={selectedIds} setSelectedIds={setSelectedIds} setIsSelectionMode={setIsSelectionMode}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            hoveredFolderId={hoveredFolderId} setHoveredFolderId={setHoveredFolderId}
            
            // UI Props
            currentView={currentView} setCurrentView={setCurrentView}
            
            // Drag Props
            draggingNoteId={draggingNoteId}
            onDragStartFromFolder={handleDragStartFromFolder}
            onDragEndGlobal={handleDragEndGlobal}
          />
        )}
      </AnimatePresence>

      {!activeNoteId && !isSelectionMode && (
        <div className="fixed bottom-6 right-6 z-[200]">
           <AnimatePresence>
            {showNewMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} transition={springTransition} className="absolute bottom-20 right-0 flex flex-col gap-3 items-end mb-2">
                <button onClick={() => createFolder()} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-800'}`}><span className="font-medium">New Folder</span><FolderPlus size={20} /></button>
                <button onClick={() => createNote()} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-800'}`}><span className="font-medium">New Note</span><FilePlus size={20} /></button>
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

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'favorite', label: 'Favorite' },
  { id: 'folder', label: 'Folder' },
  { id: 'note', label: 'Note' },
  { id: 'trash', label: 'Trash' },
  { id: 'archive', label: 'Archive' },
];

const Dashboard = ({ 
  notes, folders, allNotes, isDark, expandedFolderId, setExpandedFolderId, peekingNoteId, setPeekingNoteId,
  onOpenNote, onUpdateFolder, onDeleteFolder, onDeleteNote, onRestoreNote, onCreateNoteInFolder,
  isSelectionMode, selectedIds, setSelectedIds, setIsSelectionMode,
  searchQuery, setSearchQuery, hoveredFolderId, setHoveredFolderId,
  currentView, setCurrentView,
  draggingNoteId, onDragStartFromFolder, onDragEndGlobal
}: any) => {

  const rootNotes = notes.filter((n: Note) => n.folderId === null);
  const draggingNote = draggingNoteId ? allNotes.find((n: Note) => n.id === draggingNoteId) : null;
  
  // Logic untuk render notes dalam folder
  const getFolderNotes = (folderId: string) => allNotes.filter((n: Note) => n.folderId === folderId && !n.deletedAt);

  const toggleSelection = (id: string) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
     setSelectedIds(newSet);
  };

  const getHeaderTitle = () => {
      switch(currentView) {
          case 'favorite': return 'Your Favorites';
          case 'folder': return 'Your Folders';
          case 'note': return 'All Notes';
          case 'trash': return 'Recently Deleted';
          case 'archive': return 'Archive';
          default: return 'My Notes';
      }
  }

  return (
    <div className="pb-32 px-4 pt-8 md:px-8 max-w-7xl mx-auto min-h-screen" onClick={() => { setExpandedFolderId(null); if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds(new Set()); } }}>
      
      {/* HEADER BARU: Big Text & Fluid Pills */}
      <header className="mb-8" onClick={(e) => e.stopPropagation()}>
         <div className="flex justify-between items-start mb-6">
             <motion.h1 layout key={currentView} initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="text-5xl font-bold tracking-tight">
                 {searchQuery ? 'Search' : getHeaderTitle()}
             </motion.h1>
             
             {/* Search & Select Toggles */}
             <div className="flex gap-2">
                 <button onClick={() => isSelectionMode ? setIsSelectionMode(false) : setIsSelectionMode(true)} className={`p-3 rounded-full transition-colors ${isSelectionMode ? 'bg-indigo-600 text-white' : isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}><CheckSquare size={24}/></button>
             </div>
         </div>
         
         {/* Search Bar */}
         <div className={`mb-6 relative rounded-2xl flex items-center px-4 py-3 transition-colors ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
            <Search size={20} className="opacity-50 mr-3" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search everything..." className="bg-transparent outline-none w-full placeholder-current/50 font-medium text-lg" />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} /></button>}
         </div>

         {/* Fluid Pills Navigation */}
         {!searchQuery && (
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {FILTER_TABS.map((tab) => {
                    const isActive = currentView === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setCurrentView(tab.id)}
                            animate={{ 
                                width: isActive ? 'auto' : 'auto', 
                                paddingLeft: isActive ? 24 : 16, 
                                paddingRight: isActive ? 24 : 16 
                            }}
                            className={`h-12 rounded-full font-medium whitespace-nowrap flex items-center justify-center transition-colors
                                ${isActive 
                                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white') 
                                    : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500')
                                }`}
                        >
                           {tab.label}
                        </motion.button>
                    )
                })}
             </div>
         )}
      </header>

      <LayoutGroup>
        <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           
           {/* Folders Loop */}
           {folders.map((folder: Folder) => (
              <FolderItem 
                key={folder.id} folder={folder} notes={getFolderNotes(folder.id)}
                isExpanded={expandedFolderId === folder.id} isDark={isDark}
                onToggle={() => setExpandedFolderId(folder.id)} onClose={() => setExpandedFolderId(null)}
                onOpenNote={onOpenNote} onDelete={() => onDeleteFolder(folder.id)} onUpdate={onUpdateFolder}
                onCreateNote={() => onCreateNoteInFolder(folder.id)} isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(folder.id)} onSelect={() => toggleSelection(folder.id)}
                onDeleteNote={onDeleteNote}
                peekingNoteId={peekingNoteId} setPeekingNoteId={setPeekingNoteId}
                isHovered={hoveredFolderId === folder.id}
                onDragStartFromFolder={onDragStartFromFolder} // Pass Trigger
                // FIX SELECTION INSIDE FOLDER
                selectedIds={selectedIds} toggleSelection={toggleSelection}
              />
           ))}

           {/* Root Notes Loop */}
           {rootNotes.map((note: Note) => (
              <NoteCard 
                key={note.id} note={note} isDark={isDark}
                onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)} 
                onDelete={() => onDeleteNote(note.id)} 
                onRestore={() => onRestoreNote(note.id)}
                isTrash={currentView === 'trash'}
                isSelected={selectedIds.has(note.id)} isSelectionMode={isSelectionMode}
                isPeeking={peekingNoteId === note.id}
                onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
                onMove={(targetId: string | null) => onDragEndGlobal(note.id, targetId)}
                setHoveredFolderId={setHoveredFolderId}
              />
           ))}

        </motion.div>
      </LayoutGroup>

      {/* FLOATING DRAG LAYER (FIX LONCAT BUG) */}
      {draggingNote && (
          <div className="fixed inset-0 pointer-events-none z-[9999]">
              {/* Note ini render di atas segalanya, mengikuti mouse/finger secara absolute */}
               <NoteCard 
                  key={draggingNote.id} note={draggingNote} isDark={isDark}
                  forceDragMode={true} // Mode khusus
                  onMove={(targetId: string | null) => onDragEndGlobal(draggingNote.id, targetId)}
                  setHoveredFolderId={setHoveredFolderId}
                  className="pointer-events-auto" // Biar bisa interaksi drag
              />
          </div>
      )}

      {/* Floating Action Buttons / Selection Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pb-8">
             <div className={`flex gap-4 px-6 py-3 rounded-full shadow-2xl ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mr-4 border-r pr-4 border-gray-500/20"><span className="font-bold text-lg">{selectedIds.size}</span></div>
                <button onClick={() => onDeleteNote(Array.from(selectedIds)[0])} className="p-2 rounded-full hover:bg-red-500/10 text-red-500"><Trash2 size={24} /></button>
                <button onClick={() => setIsSelectionMode(false)} className="p-2 rounded-full hover:bg-black/5 ml-2"><X size={24} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Updated Folder Item (Fix Selection Inside) ---

const FolderItem = ({ 
  folder, notes, isExpanded, isDark, onToggle, onClose,
  onOpenNote, onDelete, onUpdate, onCreateNote,
  isSelectionMode, isSelected, onSelect, onDeleteNote,
  peekingNoteId, setPeekingNoteId, isHovered, onDragStartFromFolder,
  selectedIds, toggleSelection
}: any) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const themeClass = colors[folder.color] || colors.slate;
  const controls = useDragControls();

  const handleDragEnd = (event: any, info: PanInfo) => {
     if (Math.abs(info.offset.x) > 100 && !isSelectionMode && !isExpanded) onDelete();
  };

  return (
    <motion.div 
       layout 
       transition={springTransition}
       className={`${isExpanded ? 'col-span-full' : 'col-span-1 aspect-square'}`}
       onClick={(e) => { e.stopPropagation(); if (isSelectionMode) onSelect(); else isExpanded ? onClose() : onToggle(); }}
       data-folder-id={folder.id} 
       style={{ zIndex: isHovered ? 10 : 1 }}
    >
        <div className={`relative w-full rounded-3xl ${isExpanded ? '' : 'h-full'}`}>
            <motion.div
                drag={(!isExpanded && !isSelectionMode) ? "x" : false}
                dragControls={controls}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                dragElastic={0.5} dragSnapToOrigin={true}
                animate={{ scale: (isHovered && !isExpanded) ? 1.15 : 1 }}
                className={`${themeClass} ${folder.shape} relative z-10 w-full ${isExpanded ? 'h-auto min-h-full pb-12' : 'h-full'} ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}`}
            >
                <div className={`p-5 flex flex-col ${isExpanded ? '' : 'h-full'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold leading-tight line-clamp-2 pr-2">{folder.name}</h2> 
                    </div>
                    {!isExpanded && <div className="text-sm opacity-60 font-medium mt-auto">{notes.length} Notes</div>}
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note: Note) => (
                                <NoteCard 
                                    key={note.id} note={note} isDark={isDark} inFolder={true}
                                    // FIX SELECTION: Cek mode dulu
                                    onClick={() => isSelectionMode ? toggleSelection(note.id) : onOpenNote(note.id)}
                                    isSelected={selectedIds.has(note.id)} isSelectionMode={isSelectionMode}
                                    
                                    onDelete={() => onDeleteNote(note.id)} 
                                    isPeeking={peekingNoteId === note.id}
                                    onPeek={(val: boolean) => setPeekingNoteId(val ? note.id : null)}
                                    // FIX JUMP BUG: Trigger drag start
                                    onDragStartFromFolder={() => onDragStartFromFolder(note.id)}
                                />
                            ))}
                            {!isSelectionMode && (
                              <button onClick={(e) => { e.stopPropagation(); onCreateNote(); }} className={`border-2 border-dashed rounded-3xl aspect-square flex flex-col items-center justify-center opacity-50 hover:opacity-100 ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
                                  <Plus size={32} />
                              </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    </motion.div>
  );
};

// --- Updated Note Card (Fix Drag Portal & Selection) ---

const NoteCard = ({ note, onClick, onDelete, onRestore, isTrash, inFolder, isDark, isSelected, isSelectionMode, isPeeking, onPeek, onMove, setHoveredFolderId, onDragStartFromFolder, forceDragMode, className }: any) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const Icon = ICONS[note.icon] || ICONS['file-text'];
  const themeClass = colors[note.color] || colors.slate;
  const safeIsPeeking = isPeeking || false;
  
  const [isDragging, setIsDragging] = useState(forceDragMode || false);
  const dragControls = useDragControls();
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto start drag if forced (from portal)
  useEffect(() => { if (forceDragMode) setIsDragging(true); }, [forceDragMode]);

  const handlePointerDown = (event: React.PointerEvent) => {
     if (isSelectionMode || isTrash) return;

     if (inFolder) {
         // Logic Khusus Folder: Wait for long press then PORTAL
         longPressTimer.current = setTimeout(() => {
             if (onDragStartFromFolder) onDragStartFromFolder(); 
         }, 300);
         return;
     }

     if (safeIsPeeking) {
         longPressTimer.current = setTimeout(() => { onPeek(false); setIsDragging(true); dragControls.start(event, {snapToCursor:true}); }, 200);
     } else {
         longPressTimer.current = setTimeout(() => { setIsDragging(true); dragControls.start(event, {snapToCursor:true}); }, 300); 
     }
  };

  const handlePointerUp = () => {
     if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
     if (isDragging && !forceDragMode) setTimeout(() => setIsDragging(false), 100);
  };

  const handleDragMove = (event: any, info: PanInfo) => {
      if (!isDragging || !setHoveredFolderId) return;
      // ... Collision detection logic same as before ...
      const folders = document.querySelectorAll('[data-folder-id]');
      let foundFolderId: string | null = null;
      folders.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom) {
              foundFolderId = el.getAttribute('data-folder-id');
          }
      });
      setHoveredFolderId(foundFolderId);
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
     if (!isDragging && !forceDragMode) {
         if (Math.abs(info.offset.x) > 100 && !isSelectionMode) onDelete();
         return;
     }
     
     // Drop Logic
     setIsDragging(false);
     if (setHoveredFolderId) setHoveredFolderId(null);
     
     // Find Drop Target
     const folders = document.querySelectorAll('[data-folder-id]');
     let foundFolderId: string | null = null;
     folders.forEach((el) => {
         const rect = el.getBoundingClientRect();
         if (info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom) {
             foundFolderId = el.getAttribute('data-folder-id');
         }
     });
     onMove(foundFolderId); 
  };

  return (
    <motion.div 
       layoutId={`note-${note.id}`}
       transition={springTransition}
       style={{ zIndex: (isDragging || forceDragMode) ? 9999 : (safeIsPeeking ? 50 : 1), position: (forceDragMode ? 'fixed' : 'relative'), width: forceDragMode ? '150px' : '100%', left: forceDragMode ? 'calc(50% - 75px)' : 'auto', top: forceDragMode ? '30%' : 'auto' }} // CSS Hack for floating center if dragged
       className={`${safeIsPeeking ? 'col-span-2 row-span-2' : 'col-span-1 aspect-square'} ${className}`}
       onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
    >
        <motion.div
           ref={cardRef}
           drag={isDragging ? true : (isSelectionMode || isTrash) ? false : "x"} 
           dragControls={dragControls} dragListener={!forceDragMode}
           dragConstraints={isDragging ? undefined : { left: 0, right: 0 }}
           dragElastic={isDragging ? 0 : 0.5} dragSnapToOrigin={true}
           onDrag={handleDragMove} onDragEnd={handleDragEnd}
           onClick={(e) => { if (!isDragging) { e.stopPropagation(); onClick(); } }}
           animate={{
               scale: isDragging ? 1.05 : 1, rotate: isDragging ? 5 : 0,
               boxShadow: isDragging ? "0px 20px 50px rgba(0,0,0,0.5)" : "none"
           }}
           className={`w-full h-full relative cursor-pointer overflow-hidden ${themeClass} ${note.shape} ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2' : ''} ${safeIsPeeking ? 'shadow-2xl' : ''}`}
           style={{ touchAction: isDragging ? 'none' : 'pan-y' }}
        >
           <div className="p-5 h-full flex flex-col relative pointer-events-none"> 
               <h3 className="text-xl font-bold leading-tight line-clamp-2 relative z-10">{note.title || "Untitled"}</h3> 
               <div className="absolute bottom-4 right-4 opacity-10"><Icon size={80} /></div>
               {isSelected && <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full"><Check size={16}/></div>}
               {isTrash && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center font-bold text-red-800 rotate-45">DELETED</div>}
               {note.isFavorite && !isTrash && <div className="absolute top-4 right-4 text-yellow-500"><Star fill="currentColor" size={16}/></div>}
           </div>

           {!isSelectionMode && !isDragging && !isTrash && onPeek && (
               <button onClick={(e) => { e.stopPropagation(); onPeek(!safeIsPeeking); }} className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm z-20 pointer-events-auto transition-transform active:scale-90 ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                  {safeIsPeeking ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
               </button>
           )}
           {isTrash && (
               <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="absolute bottom-3 right-3 p-2 rounded-full bg-green-500 text-white shadow-lg z-20 pointer-events-auto">
                   <Undo size={16} />
               </button>
           )}
        </motion.div>
    </motion.div>
  );
};