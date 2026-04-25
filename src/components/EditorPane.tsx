import Editor from '@monaco-editor/react';
import { Plus } from 'lucide-react';
import { ProjectFile } from '../types';

interface EditorPaneProps {
  files: ProjectFile[];
  activeFileId: string;
  theme: string;
  onFileChange: (id: string, content: string | undefined) => void;
  onTabSelect: (id: string) => void;
  onAddFile: () => void;
}

export function EditorPane({ files, activeFileId, theme, onFileChange, onTabSelect, onAddFile }: EditorPaneProps) {
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 w-full">
      <div className="flex bg-neutral-950 overflow-x-auto border-b border-neutral-800 shrink-0 items-center scrollbar-hide">
        {files.map(file => (
          <button
            key={file.id}
            onClick={() => onTabSelect(file.id)}
            className={`px-4 py-2 text-sm max-w-[150px] truncate border-r border-neutral-800 transition-colors shrink-0 ${
              file.id === activeFileId 
                ? 'bg-neutral-800 text-neutral-100 border-t-2 border-t-blue-500' 
                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border-t-2 border-t-transparent'
            }`}
          >
            {file.name}
          </button>
        ))}
        <button 
          onClick={onAddFile}
          className="p-2 text-neutral-400 hover:text-neutral-100 transition-colors shrink-0 mx-1"
          title="Create New File"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 relative">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            theme={theme}
            value={activeFile.content}
            onChange={(val) => onFileChange(activeFile.id, val)}
            options={{
              minimap: { enabled: false }, // disabled for cleaner look
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm gap-3">
            <CodeIcon />
            <p>No file selected or created</p>
            <button 
              onClick={onAddFile}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-200 transition-colors"
            >
              <Plus size={14} /> Create a File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeIcon() {
  return (
    <div className="h-12 w-12 rounded-full bg-neutral-800/50 border border-neutral-700 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    </div>
  );
}
