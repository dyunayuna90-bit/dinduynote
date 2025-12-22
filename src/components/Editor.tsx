import React, { useState, useEffect } from 'react';
import { Note, Theme } from '../types';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface EditorProps {
  note: Note;
  theme: Theme;
  onUpdate: (note: Note) => void;
  onClose: () => void;
  onDelete: () => void;
}

const Editor: React.FC<EditorProps> = ({ note, theme, onUpdate, onClose, onDelete }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  // Sync state kalau prop note berubah
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  // Auto-save logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onUpdate({
          ...note,
          title,
          content,
          updatedAt: Date.now()
        });
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [title, content, note, onUpdate]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] text-gh-text dark:text-gh-darkText animate-in slide-in-from-right duration-200 fixed inset-0 z-50 pt-14 md:static md:pt-0">
      {/* Header Editor */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border dark:border-gh-darkBorder bg-gh-bgSec dark:bg-[#161b22]">
        <div className="flex items-center gap-3">
            <button 
                onClick={onClose} 
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gh-textSec dark:text-gh-darkTextSec transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-gh-textSec dark:text-gh-darkTextSec hidden md:inline">Editing</span>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="text-xs text-gh-textSec dark:text-gh-darkTextSec mr-2">
                {title !== note.title || content !== note.content ? 'Unsaved...' : 'Saved'}
            </span>
            <button 
                onClick={onDelete}
                className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete note"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Area Ngetik */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full bg-white dark:bg-[#0d1117]">
        <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="File name..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-700 mb-6 text-gh-text dark:text-gh-darkText"
        />
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full h-[calc(100vh-250px)] resize-none bg-transparent border-none outline-none font-mono text-sm leading-relaxed text-gh-text dark:text-gh-darkText placeholder-gray-300 dark:placeholder-gray-700"
            spellCheck={false}
        />
      </div>
    </div>
  );
};

export default Editor;
