
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Plus, ArrowLeft, MoreVertical, 
  Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
  Type, FolderPlus, FilePlus, Settings, Trash2, X, ChevronDown, Palette,
  Sun, Moon, CornerDownLeft, GripVertical, Folder as FolderIcon,
  CheckCircle2, Check, MoveRight, ChevronUp, Maximize2, Minimize2, AlertTriangle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder, Shape, ColorTheme, AppState } from './types';
import { DARK_COLORS, LIGHT_COLORS, SHAPES, ICONS } from './constants';

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

const useLongPress = (callback: () => void, ms = 500) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (startLongPress) {
      timerId = setTimeout(() => {
        callbackRef.current();
        setStartLongPress(false); // Fix: Reset state immediately after trigger to prevent loops
      }, ms);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [ms, startLongPress]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
    onTouchMove: () => setStartLongPress(false), // Cancel on scroll
  };
};

// --- Components ---

const IconButton = ({ onClick, icon: Icon, className = "", active = false, activeClass = "bg-black/20 text-current" }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-full transition-all active:scale-90 flex items-center justify-center ${active ? activeClass : 'hover:bg-black/5 text-inherit'} ${className}`}
  >
    <Icon size={24} />
  </button>
);

const ToolbarButton = ({ onClick, icon: Icon, active = false, isDark }: any) => (
  <button 
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-500 text-white' : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
  >
    <Icon size={20} />
  </button>
);

// --- Main App ---

export default function App() {
  const [isDark, setIsDark] = useLocalStorage<boolean>('desnote-theme', false);
  
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const [notes, setNotes] = useLocalStorage<Note[]>('desnote-notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('desnote-folders', [
    { id: '1', name: 'Personal', color: 'rose', shape: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl' },
    { id: '2', name: 'Work', color: 'blue', shape: 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl' }
  ]);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNoteSettings, setShowNoteSettings] = useState(false);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  
  // Delete Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{
      isOpen: boolean;
      type: 'note' | 'folder' | 'selection';
      count?: number; 
      id?: string;
  }>({ isOpen: false, type: 'note' });

  // Helper to find active note
  const activeNote = notes.find(n => n.id === activeNoteId);

  // --- CRUD Operations ---

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

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const deleteFolder = (id: string) => {
    // Move notes to root
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
    setFolders(prev => prev.filter(f => f.id !== id));
    if (expandedFolderId === id) setExpandedFolderId(null);
  };

  const moveNoteToFolder = (noteId: string, folderId: string | null) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId, updatedAt: Date.now() } : n));
  };

  // --- Selection Logic ---

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const enterSelectionMode = (initialId?: string) => {
    setIsSelectionMode(true);
    if (initialId) {
      setSelectedIds(new Set([initialId]));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const executeDelete = () => {
    if (deleteConfirm.type === 'note' && deleteConfirm.id) {
        deleteNote(deleteConfirm.id);
    } else if (deleteConfirm.type === 'folder' && deleteConfirm.id) {
        deleteFolder(deleteConfirm.id);
    } else if (deleteConfirm.type === 'selection') {
        // 1. Delete notes that are selected
        setNotes(prev => {
            // Filter out selected notes
            let nextNotes = prev.filter(n => !selectedIds.has(n.id));
            
            // Handle notes that are inside deleted folders (move them to dashboard)
            // If the note itself wasn't selected but its folder was
            nextNotes = nextNotes.map(n => {
                if (n.folderId && selectedIds.has(n.folderId)) {
                    return { ...n, folderId: null };
                }
                return n;
            });
            return nextNotes;
        });

        // 2. Delete folders that are selected
        setFolders(prev => prev.filter(f => !selectedIds.has(f.id)));
        
        exitSelectionMode();
    }
    setDeleteConfirm({ ...deleteConfirm, isOpen: false });
  };

  const moveSelected = (targetFolderId: string | null) => {
    setNotes(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, folderId: targetFolderId, updatedAt: Date.now() } : n));
    exitSelectionMode();
    setShowMoveDialog(false);
  };
  
  // --- Request Deletes ---
  const onRequestDeleteNote = (id: string) => {
      setDeleteConfirm({ isOpen: true, type: 'note', id });
  };
  
  const onRequestDeleteFolder = (id: string) => {
      setDeleteConfirm({ isOpen: true, type: 'folder', id });
  };
  
  const onRequestDeleteSelection = () => {
      if (selectedIds.size === 0) return;
      setDeleteConfirm({ isOpen: true, type: 'selection', count: selectedIds.size });
  };

  const isAnyFolderSelected = Array.from(selectedIds).some(id => folders.some(f => f.id === id));

  // --- Render ---

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'text-[#f0f0f0]' : 'text-[#1a1c1e]'}`}>
      <AnimatePresence mode="wait">
        {activeNoteId ? (
          <NoteEditor 
            key="editor"
            note={activeNote!}
            folders={folders}
            isDark={isDark}
            onUpdate={updateNote}
            onClose={() => setActiveNoteId(null)}
            onDelete={() => onRequestDeleteNote(activeNoteId)}
            showSettings={showNoteSettings}
            setShowSettings={setShowNoteSettings}
            onMoveNote={moveNoteToFolder}
          />
        ) : (
          <Dashboard 
            key="dashboard"
            notes={notes}
            folders={folders}
            isDark={isDark}
            toggleTheme={() => setIsDark(!isDark)}
            expandedFolderId={expandedFolderId}
            setExpandedFolderId={setExpandedFolderId}
            onOpenNote={setActiveNoteId}
            onUpdateFolder={(id, updates) => setFolders(prev => prev.map(f => f.id === id ? {...f, ...updates} : f))}
            onDeleteFolder={onRequestDeleteFolder}
            onMoveNote={moveNoteToFolder}
            onCreateNoteInFolder={(folderId) => createNote(folderId)}
            
            // Selection Props
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onEnterSelectionMode={enterSelectionMode}
            onExitSelectionMode={exitSelectionMode}
          />
        )}
      </AnimatePresence>

      {/* FAB (Floating Action Button) */}
      {!activeNoteId && !isSelectionMode && (
        <div className="fixed bottom-6 right-6 z-40">
          <AnimatePresence>
            {showNewMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute bottom-20 right-0 flex flex-col gap-3 items-end mb-2"
              >
                <button 
                  onClick={() => createFolder()} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
                >
                  <span className="font-medium">New Folder</span>
                  <FolderPlus size={20} />
                </button>
                <button 
                  onClick={() => createNote()} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
                >
                  <span className="font-medium">New Note</span>
                  <FilePlus size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNewMenu(!showNewMenu)}
            className={`w-16 h-16 rounded-[1.2rem] shadow-xl flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#c3eedf] text-[#003829]' : 'bg-[#1a1c1e] text-[#f0f0f0]'}`}
          >
            <motion.div animate={{ rotate: showNewMenu ? 45 : 0 }}>
              <Plus size={32} />
            </motion.div>
          </motion.button>
        </div>
      )}

      {/* Selection Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pb-8`}
          >
             <div className={`flex gap-4 px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl border ${isDark ? 'bg-zinc-900/90 border-zinc-700' : 'bg-white/90 border-zinc-200'}`}>
                <div className="flex items-center gap-3 mr-4 border-r pr-4 border-gray-500/20">
                   <span className="font-bold text-lg">{selectedIds.size}</span>
                   <span className="text-sm opacity-60">Selected</span>
                </div>
                
                {/* Only show Move button if NO folders are selected */}
                {!isAnyFolderSelected && (
                  <button onClick={() => setShowMoveDialog(true)} className="p-2 rounded-full hover:bg-black/5 flex flex-col items-center gap-1 text-xs font-medium">
                     <FolderIcon size={24} />
                  </button>
                )}

                <button onClick={onRequestDeleteSelection} className="p-2 rounded-full hover:bg-red-500/10 text-red-500 flex flex-col items-center gap-1 text-xs font-medium">
                   <Trash2 size={24} />
                </button>
                <button onClick={exitSelectionMode} className="p-2 rounded-full hover:bg-black/5 ml-2">
                   <X size={24} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Dialog */}
      <AnimatePresence>
        {showMoveDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
            >
              <h3 className="text-xl font-bold mb-4">Move {selectedIds.size} items to...</h3>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                 <button 
                   onClick={() => moveSelected(null)}
                   className={`flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${isDark ? 'hover:bg-zinc-800 bg-zinc-800/50' : 'hover:bg-zinc-100 bg-zinc-50'}`}
                 >
                    <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-500"><CornerDownLeft size={20}/></div>
                    <span className="font-medium">Dashboard</span>
                 </button>
                 {folders.map(f => (
                   <button 
                     key={f.id}
                     onClick={() => moveSelected(f.id)}
                     className={`flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${isDark ? 'hover:bg-zinc-800 bg-zinc-800/50' : 'hover:bg-zinc-100 bg-zinc-50'}`}
                   >
                      <div className="p-2 rounded-full bg-orange-500/10 text-orange-500"><FolderIcon size={20}/></div>
                      <span className="font-medium">{f.name}</span>
                   </button>
                 ))}
              </div>
              <button 
                onClick={() => setShowMoveDialog(false)}
                className="mt-6 w-full py-3 rounded-xl font-medium bg-transparent hover:bg-black/5 text-current opacity-60"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Custom Delete Dialog */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
                >
                  <div className="flex flex-col items-center text-center mb-4">
                     <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                     </div>
                     <h3 className="text-xl font-bold">Delete {deleteConfirm.type}?</h3>
                     <p className="opacity-60 mt-2">
                        {deleteConfirm.type === 'selection' 
                           ? `Are you sure you want to delete ${deleteConfirm.count} items?` 
                           : deleteConfirm.type === 'folder' 
                             ? "This will delete the folder and move all notes inside to the dashboard."
                             : "This action cannot be undone."}
                     </p>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setDeleteConfirm({...deleteConfirm, isOpen: false})}
                        className="flex-1 py-3 rounded-xl font-medium bg-black/5 hover:bg-black/10 text-current transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={executeDelete}
                        className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                      >
                        Delete
                      </button>
                  </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Dashboard Component ---

interface DashboardProps {
  notes: Note[];
  folders: Folder[];
  isDark: boolean;
  toggleTheme: () => void;
  expandedFolderId: string | null;
  setExpandedFolderId: (id: string | null) => void;
  onOpenNote: (id: string) => void;
  onUpdateFolder: (id: string, updates: Partial<Folder>) => void;
  onDeleteFolder: (id: string) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  onCreateNoteInFolder: (folderId: string) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onEnterSelectionMode: (id?: string) => void;
  onExitSelectionMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  notes, folders, isDark, toggleTheme, expandedFolderId, setExpandedFolderId, 
  onOpenNote, onUpdateFolder, onDeleteFolder, onMoveNote, onCreateNoteInFolder,
  isSelectionMode, selectedIds, onToggleSelection, onEnterSelectionMode, onExitSelectionMode
}) => {
  const rootNotes = notes.filter(n => n.folderId === null);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div 
      className="pb-32 px-4 pt-12 md:px-8 max-w-7xl mx-auto min-h-screen"
      onClick={() => {
        setExpandedFolderId(null);
        if (isSelectionMode) onExitSelectionMode();
      }}
    >
      <header className="mb-12 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
        <div>
           <h1 className={`text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'}`}>
             Desnote
           </h1>
           <p className={`mt-2 text-lg ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
             Capture your thoughts, beautifully.
           </p>
        </div>
        <div className="flex gap-2">
           <IconButton 
              icon={isSelectionMode ? X : CheckCircle2}
              onClick={isSelectionMode ? onExitSelectionMode : () => onEnterSelectionMode()}
              active={isSelectionMode}
              className={isSelectionMode ? "bg-indigo-500 text-white" : ""}
           />
           <IconButton 
             icon={isDark ? Sun : Moon} 
             onClick={toggleTheme} 
             className={isDark ? "text-yellow-300 bg-white/10" : "text-indigo-600 bg-black/5"}
          />
        </div>
      </header>

      <LayoutGroup>
        <motion.div 
          layout 
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          // Removed stopPropagation to allow clicking empty grid space to trigger exit selection logic
        >
          {/* Folders */}
          {folders.map(folder => {
            const isExpanded = expandedFolderId === folder.id;
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            const isSelected = selectedIds.has(folder.id);

            return (
              <FolderItem 
                key={folder.id} 
                folder={folder} 
                notes={folderNotes}
                isExpanded={isExpanded}
                isDark={isDark}
                colors={colors}
                onToggle={() => setExpandedFolderId(folder.id)} 
                onClose={() => setExpandedFolderId(null)}
                onOpenNote={onOpenNote}
                onDelete={() => onDeleteFolder(folder.id)}
                onUpdate={onUpdateFolder}
                onCreateNote={() => onCreateNoteInFolder(folder.id)}
                
                isSelectionMode={isSelectionMode}
                isSelected={isSelected}
                selectedIds={selectedIds}
                onToggleSelection={onToggleSelection}
                onEnterSelectionMode={onEnterSelectionMode}
              />
            );
          })}

          {/* Root Notes */}
          {rootNotes.map(note => (
            <NoteCard 
               key={note.id} 
               note={note} 
               isDark={isDark}
               colors={colors}
               onClick={() => {
                 if (isSelectionMode) {
                   onToggleSelection(note.id);
                 } else {
                   onOpenNote(note.id);
                 }
               }} 
               
               isSelected={selectedIds.has(note.id)}
               isSelectionMode={isSelectionMode}
               onLongPress={() => !isSelectionMode && onEnterSelectionMode(note.id)}
            />
          ))}
        </motion.div>
      </LayoutGroup>
      
      {rootNotes.length === 0 && folders.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
           <div className={`w-20 h-20 rounded-3xl mb-4 flex items-center justify-center ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
             <FilePlus size={32} className="opacity-50"/>
           </div>
           <p className="text-lg">Your canvas is empty.</p>
        </div>
      )}
    </div>
  );
};

// --- Folder Component ---

const FolderItem = ({ 
  folder, notes, isExpanded, isDark, colors, onToggle, onClose,
  onOpenNote, onDelete, onUpdate, onCreateNote,
  isSelectionMode, isSelected, selectedIds, onToggleSelection, onEnterSelectionMode
}: any) => {
  
  const themeClass = colors[folder.color as ColorTheme] || colors.slate;
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // NEW: Settings state
  const [showSettings, setShowSettings] = useState(false);

  // NEW: Long press for rename
  const nameLongPress = useLongPress(() => {
    setEditingName(true);
  }, 500);
  
  // NEW: Long press for selection (container)
  const ignoreClickRef = useRef(false);
  const containerLongPress = useLongPress(() => {
    if (!isSelectionMode) {
        ignoreClickRef.current = true;
        onEnterSelectionMode(folder.id);
    }
  }, 500);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingName]);
  
  // NEW: Click outside handler for settings
  useEffect(() => {
    const handleClick = () => setShowSettings(false);
    if(showSettings) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showSettings]);

  const handleNameBlur = () => {
    setEditingName(false);
    if (!nameInputRef.current?.value.trim()) return;
    onUpdate(folder.id, { name: nameInputRef.current.value });
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...containerLongPress}
      onClick={(e) => {
        // Handle ignored click from long press
        if (ignoreClickRef.current) {
            ignoreClickRef.current = false;
            e.stopPropagation();
            return;
        }

        // Prevent interfering with editing inputs
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        
        // Always stop propagation to handle click strictly on the folder
        e.stopPropagation();

        if (isSelectionMode) {
            onToggleSelection(folder.id);
            return;
        }

        if (isExpanded) {
           onClose();
        } else {
           onToggle();
        }
      }}
      className={`
        ${isExpanded ? 'col-span-full row-span-auto min-h-[250px] z-20 overflow-visible' : 'col-span-1 aspect-square overflow-hidden'}
        ${themeClass} border relative cursor-pointer
        group
        ${folder.shape}
        ${isDark ? 'backdrop-blur-md' : 'shadow-sm'}
        ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}
      `}
    >
      {/* Folder Header */}
      <motion.div layout="position" className="p-6 flex justify-between items-start z-10 relative">
        <div className="flex-1 min-w-0 pr-2">
          {editingName ? (
            <input 
              ref={nameInputRef}
              defaultValue={folder.name}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-2xl font-bold outline-none border-b border-current w-full"
            />
          ) : (
            <motion.h2 
              layout="position" 
              className="text-2xl font-bold flex items-center gap-2 select-none"
              // Manually handle name events to prevent bubbling to container long press
              onMouseDown={(e) => { e.stopPropagation(); nameLongPress.onMouseDown(); }}
              onMouseUp={nameLongPress.onMouseUp}
              onMouseLeave={nameLongPress.onMouseLeave}
              onTouchStart={(e) => { e.stopPropagation(); nameLongPress.onTouchStart(); }}
              onTouchEnd={nameLongPress.onTouchEnd}
              onTouchMove={nameLongPress.onTouchMove}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span className="truncate">{folder.name}</span>
              <span className="text-xs font-normal opacity-60 bg-black/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {notes.length}
              </span>
            </motion.h2>
          )}
        </div>
        
        {/* Actions - visible when expanded */}
        {isExpanded && !isSelectionMode && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
               
               {/* Settings Toggle */}
               <div className="relative">
                 <IconButton 
                   icon={Palette} 
                   onClick={(e: React.MouseEvent) => {
                      e.stopPropagation(); // prevent folder toggle
                      setShowSettings(!showSettings);
                   }}
                   active={showSettings}
                   className={isDark ? "text-zinc-400 hover:text-white hover:bg-white/10" : "text-zinc-500 hover:text-black hover:bg-black/5"}
                 />

                 {/* Settings Modal - Now handles Delete too */}
                 <AnimatePresence>
                  {showSettings && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute top-14 right-0 w-64 max-h-64 overflow-y-auto custom-scrollbar rounded-3xl p-5 shadow-2xl z-50 border cursor-default ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}
                    >
                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Color</h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {Object.keys(colors).map((c) => (
                          <button 
                            key={c}
                            onClick={() => onUpdate(folder.id, { color: c as ColorTheme })}
                            className={`w-8 h-8 rounded-full border-2 ${folder.color === c ? 'border-indigo-500' : 'border-transparent'}`}
                            style={{ backgroundColor: c === 'slate' ? '#64748b' : `var(--color-${c}-400, ${c})` }} 
                          >
                             <div className={`w-full h-full rounded-full opacity-50 bg-${c}-400`} />
                          </button>
                        ))}
                      </div>

                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Shape</h4>
                      <div className="grid grid-cols-2 gap-2 mb-6">
                         {SHAPES.map((s, i) => (
                           <button
                             key={i}
                             onClick={() => onUpdate(folder.id, { shape: s })}
                             className={`h-10 ${isDark ? 'bg-white/10' : 'bg-black/5'} ${s} border-2 ${folder.shape === s ? 'border-indigo-500' : 'border-transparent'}`}
                           />
                         ))}
                      </div>
                      
                      <div className="pt-4 border-t border-black/5">
                        <button 
                            onClick={() => onDelete()} 
                            className="w-full flex items-center gap-2 text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors font-medium text-sm"
                        >
                            <Trash2 size={16}/> Delete Folder
                        </button>
                      </div>

                    </motion.div>
                  )}
                 </AnimatePresence>
               </div>

            </div>
        )}
      </motion.div>

       {/* Selection Checkmark */}
       <AnimatePresence>
        {isSelected && (
           <motion.div 
             initial={{ scale: 0 }} 
             animate={{ scale: 1 }} 
             exit={{ scale: 0 }}
             className="absolute top-4 right-4 bg-indigo-500 text-white rounded-full p-1 shadow-md z-30"
           >
              <Check size={16} />
           </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && !isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="p-6 pt-0 w-full"
            // We use the parent click handler to close, so no onClick here needed unless we wanted to stop prop
          >
            {/* Added layout prop here to ensure notes inside folder animate when one expands */}
            <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {notes.map((note: Note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  isDark={isDark}
                  colors={colors}
                  onClick={() => {
                     if (isSelectionMode) {
                        onToggleSelection(note.id);
                     } else {
                        onOpenNote(note.id);
                     }
                  }}
                  inFolder 
                  isCompact
                  isSelected={selectedIds?.has(note.id)}
                  isSelectionMode={isSelectionMode}
                  onLongPress={() => !isSelectionMode && onEnterSelectionMode(note.id)}
                />
              ))}
              
              <button 
                onClick={(e) => {
                   e.stopPropagation(); // Don't close folder
                   onCreateNote();
                }}
                className={`border-2 border-dashed rounded-3xl flex flex-col gap-2 items-center justify-center aspect-square transition-colors ${isDark ? 'border-white/20 text-white/40 hover:bg-white/5 hover:text-white/80' : 'border-black/10 text-black/40 hover:bg-black/5 hover:text-black/70'}`}
              >
                <Plus size={32} />
                <span className="text-sm font-medium">New Note</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Preview */}
      {!isExpanded && (
        <motion.div 
          layout
          className="absolute bottom-6 left-6 right-6 flex gap-2 opacity-50"
        >
          {[...Array(Math.min(3, notes.length))].map((_, i) => (
            <div key={i} className="h-2 w-full bg-current opacity-40 rounded-full" />
          ))}
          {notes.length === 0 && <div className="text-sm opacity-50">Empty</div>}
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Note Card Component ---

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  inFolder?: boolean;
  isCompact?: boolean;
  isDark: boolean;
  colors: Record<ColorTheme, string>;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, onClick, inFolder = false, isCompact = false, isDark, colors,
  isSelected, isSelectionMode, onLongPress
}) => {
  const Icon = ICONS[note.icon] || ICONS['file-text'];
  const themeClass = colors[note.color] || colors.slate;
  
  // Local state for expanding content (Peeking)
  const [isPeeking, setIsPeeking] = useState(false);
  
  // Long press handler
  const longPressProps = useLongPress(() => {
    if (onLongPress) onLongPress();
  });
  
  // Clean text extract preserving newlines
  const previewText = note.content
    .replace(/<\/div>|<\/p>|<\/h1>|<\/h2>|<\/h3>/g, '\n')
    .replace(/<br>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .trim() || "No content";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      layoutId={`note-${note.id}`}
      onClick={(e) => {
         e.stopPropagation(); // Stop propagation for background click (folder close)
         onClick();
      }}
      {...longPressProps}
      whileHover={!isSelectionMode ? { scale: 1.02, y: -2 } : {}}
      whileTap={{ scale: 0.98 }}
      className={`
        ${themeClass} border cursor-pointer 
        ${note.shape} relative overflow-hidden group 
        ${inFolder ? 'bg-black/5 backdrop-blur-sm' : isDark ? 'shadow-sm' : 'shadow-sm hover:shadow-md'}
        
        ${isPeeking 
            ? 'col-span-2 h-auto min-h-[350px] z-20 flex flex-col p-6' 
            : 'col-span-1 aspect-square z-0 p-6'
        }
        
        ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}
      `}
    >
      
      {/* Header Section: Logic split for better layout control */}
      {isPeeking ? (
          /* EXPANDED HEADER (Flex row) */
          <motion.div layout="position" className="w-full flex items-start justify-between mb-4">
              <motion.h3 
                 layout="position"
                 className="font-bold leading-tight text-3xl pr-4"
              >
                {note.title || <span className="opacity-50 italic">Untitled</span>}
              </motion.h3>
              <motion.div layout="position" className="text-current opacity-100 flex-shrink-0">
                 <Icon size={24} />
              </motion.div>
          </motion.div>
      ) : (
          /* COLLAPSED HEADER (Relative positioning for neatness) */
          <>
            <motion.h3 
               layout="position"
               className="font-bold leading-tight text-xl text-left line-clamp-3 relative z-10 pr-2"
            >
              {note.title || <span className="opacity-50 italic">Untitled</span>}
            </motion.h3>

            {/* Watermark Icon */}
            <motion.div 
               layout="position"
               className="absolute bottom-2 right-2 text-current opacity-10 pointer-events-none"
            >
              <Icon size={64} />
            </motion.div>
          </>
      )}

      {/* Selection Checkmark */}
      <AnimatePresence>
        {isSelected && (
           <motion.div 
             initial={{ scale: 0 }} 
             animate={{ scale: 1 }} 
             exit={{ scale: 0 }}
             className="absolute top-4 right-4 bg-indigo-500 text-white rounded-full p-1 shadow-md z-30"
           >
              <Check size={16} />
           </motion.div>
        )}
      </AnimatePresence>

      {/* Content - Only Visible when Peeking */}
      <AnimatePresence>
          {isPeeking && (
              <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="flex-1 flex flex-col relative w-full overflow-hidden"
              >
                  <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 -mr-2 custom-scrollbar pb-8">
                      <p className="text-sm md:text-base opacity-90 leading-relaxed font-normal whitespace-pre-wrap">
                          {previewText}
                      </p>
                  </div>

                  <div className="mt-4 pt-2 flex justify-between items-end border-t border-black/5 bg-inherit">
                      <span className="text-[10px] uppercase tracking-wider opacity-50 font-medium">
                      {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Peek Toggle Button - Always at Bottom Right */}
      {!isSelectionMode && (
          <motion.div layout="position" className="absolute bottom-3 right-3 z-30">
             <button 
               onClick={(e) => {
                  e.stopPropagation();
                  setIsPeeking(!isPeeking);
               }}
               className={`p-2 rounded-full transition-all active:scale-90 shadow-sm ${isDark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-white text-zinc-600 hover:bg-zinc-100'}`}
               title={isPeeking ? "Collapse" : "Expand"}
             >
               {isPeeking ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
             </button>
          </motion.div>
      )}
    </motion.div>
  );
};

// --- Editor Component ---

const NoteEditor = ({ 
  note, onUpdate, onClose, onDelete, showSettings, setShowSettings, 
  isDark, folders, onMoveNote 
}: any) => {
  const [title, setTitle] = useState(note.title);
  // Use a ref to store content to avoid re-rendering the dangerous HTML while typing
  const contentRef = useRef(note.content);
  // Separate state to force render only when strictly necessary (e.g. initial load)
  // We actually don't need a state for content if we manage the div manually, 
  // but to keep it React-friendly for initial render, we use a key or initial prop.
  
  const editorDivRef = useRef<HTMLDivElement>(null);

  // Sync title when note changes externally (rare in this app flow but good practice)
  useEffect(() => {
    setTitle(note.title);
    contentRef.current = note.content;
    if (editorDivRef.current && editorDivRef.current.innerHTML !== note.content) {
        editorDivRef.current.innerHTML = note.content;
    }
  }, [note.id]);

  // Handle outside click to close settings
  useEffect(() => {
    const handleClick = () => setShowSettings(false);
    if(showSettings) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showSettings]);

  // Exec command helper
  const format = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorDivRef.current?.focus();
  };

  const handleInput = () => {
    if (editorDivRef.current) {
        const html = editorDivRef.current.innerHTML;
        contentRef.current = html;
        // Debounce or just update state?
        // Updating state immediately causes the re-render cursor jump issue if we bind generic HTML.
        // So we just call onUpdate without triggering a re-render of this component's content buffer.
        // We do this by NOT having `content` in the dependency array of the component render for the Editable div.
        onUpdate(note.id, { 
            title, 
            content: html 
        });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      onUpdate(note.id, { title: e.target.value });
  }

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const themeClass = colors[note.color as ColorTheme] || colors.slate;

  return (
    <motion.div 
      layoutId={`note-${note.id}`}
      className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-[#121212]' : 'bg-[#fdfcf4]'} md:p-4`}
    >
      {/* Editor Container */}
      <motion.div 
        className={`flex-1 flex flex-col w-full max-w-4xl mx-auto md:rounded-[2.5rem] overflow-hidden shadow-2xl relative ${themeClass} ${isDark ? 'md:border md:border-white/5' : 'md:border md:border-black/5'} transition-colors duration-500`}
      >
        {/* Navbar */}
        <div className={`flex items-center justify-between p-4 md:p-6 sticky top-0 z-20 backdrop-blur-md ${isDark ? 'bg-black/10' : 'bg-white/30'}`}>
          <button 
            onClick={onClose}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex gap-2 relative" onClick={e => e.stopPropagation()}>
             <IconButton 
                icon={Palette} 
                onClick={() => setShowSettings(!showSettings)} 
                active={showSettings} 
                activeClass={isDark ? "bg-white/20 text-white" : "bg-black/20 text-black"}
             />
             <IconButton icon={Trash2} onClick={onDelete} className="text-red-400 hover:bg-red-500/20" />

             {/* Settings Popover */}
             <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  className={`absolute top-14 right-0 w-72 max-h-80 overflow-y-auto custom-scrollbar rounded-3xl p-5 shadow-2xl z-50 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Color</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {Object.keys(colors).map((c) => (
                      <button 
                        key={c}
                        onClick={() => onUpdate(note.id, { color: c as ColorTheme })}
                        className={`w-8 h-8 rounded-full border-2 ${note.color === c ? 'border-indigo-500' : 'border-transparent'}`}
                        style={{ backgroundColor: c === 'slate' ? '#64748b' : `var(--color-${c}-400, ${c})` }} 
                      >
                         <div className={`w-full h-full rounded-full opacity-50 bg-${c}-400`} />
                      </button>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Shape</h4>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                     {SHAPES.map((s, i) => (
                       <button
                         key={i}
                         onClick={() => onUpdate(note.id, { shape: s })}
                         className={`h-10 ${isDark ? 'bg-white/10' : 'bg-black/5'} ${s} border-2 ${note.shape === s ? 'border-indigo-500' : 'border-transparent'}`}
                       />
                     ))}
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Icon</h4>
                  <div className="grid grid-cols-5 gap-1 mb-6">
                    {Object.keys(ICONS).map((iconKey) => {
                      const I = ICONS[iconKey];
                      return (
                        <button 
                          key={iconKey}
                          onClick={() => onUpdate(note.id, { icon: iconKey })}
                          className={`p-1.5 rounded-lg hover:bg-black/5 ${note.icon === iconKey ? 'text-indigo-500' : 'text-zinc-500'}`}
                        >
                          <I size={18} />
                        </button>
                      )
                    })}
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Location</h4>
                   <div className="flex flex-col gap-1">
                      <button 
                         onClick={() => onMoveNote(note.id, null)}
                         className={`flex items-center gap-2 p-2 rounded-lg text-sm ${note.folderId === null ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-black/5'}`}
                      >
                         <CornerDownLeft size={14}/> Dashboard (No folder)
                      </button>
                      {folders.map(f => (
                         <button 
                           key={f.id}
                           onClick={() => onMoveNote(note.id, f.id)}
                           className={`flex items-center gap-2 p-2 rounded-lg text-sm ${note.folderId === f.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-black/5'}`}
                         >
                           <FolderIcon size={14}/> {f.name}
                         </button>
                      ))}
                   </div>

                </motion.div>
              )}
             </AnimatePresence>
          </div>
        </div>

        {/* Editing Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 md:px-12 scroll-smooth">
          <input 
            value={title}
            onChange={handleTitleChange}
            placeholder="Title"
            className={`w-full bg-transparent text-4xl md:text-5xl font-bold placeholder-current/30 outline-none mb-6 mt-4`}
          />
          
          <div 
            ref={editorDivRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className={`content-editable outline-none text-lg md:text-xl leading-relaxed min-h-[50vh] opacity-90 empty:before:content-['Start_typing...']`}
          />
          <div className="h-32" /> {/* Spacer for keyboard/toolbar */}
        </div>

        {/* Toolbar */}
        <div className={`sticky bottom-0 backdrop-blur-xl border-t p-2 md:p-4 md:mx-4 md:mb-4 md:rounded-2xl flex justify-between gap-1 overflow-x-auto no-scrollbar ${isDark ? 'bg-[#121212]/90 border-white/10' : 'bg-[#fdfcf4]/90 border-black/5'}`}>
          <div className="flex gap-1 items-center">
            <ToolbarButton icon={Bold} onClick={() => format('bold')} isDark={isDark} />
            <ToolbarButton icon={Italic} onClick={() => format('italic')} isDark={isDark} />
            <ToolbarButton icon={Underline} onClick={() => format('underline')} isDark={isDark} />
          </div>
          <div className={`w-px h-8 mx-1 self-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`} />
          <div className="flex gap-1 items-center">
             <ToolbarButton icon={AlignLeft} onClick={() => format('justifyLeft')} isDark={isDark} />
             <ToolbarButton icon={AlignCenter} onClick={() => format('justifyCenter')} isDark={isDark} />
             <ToolbarButton icon={AlignRight} onClick={() => format('justifyRight')} isDark={isDark} />
          </div>
          <div className={`w-px h-8 mx-1 self-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`} />
          <div className="flex gap-1 items-center">
            <ToolbarButton icon={List} onClick={() => format('insertUnorderedList')} isDark={isDark} />
             <button 
                onMouseDown={(e) => { e.preventDefault(); format('formatBlock', 'H2'); }}
                className={`p-2 rounded-xl font-bold ${isDark ? 'text-zinc-400 hover:bg-white/10' : 'text-zinc-500 hover:bg-black/5'}`}
             >
               H1
             </button>
             <button 
                onMouseDown={(e) => { e.preventDefault(); format('formatBlock', 'H3'); }}
                className={`p-2 rounded-xl font-bold text-sm ${isDark ? 'text-zinc-400 hover:bg-white/10' : 'text-zinc-500 hover:bg-black/5'}`}
             >
               H2
             </button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
