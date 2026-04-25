import Editor from '@monaco-editor/react';
import { ProjectFile } from '../types';

interface EditorPaneProps {
  files: ProjectFile[];
  activeFileId: string;
  theme: string;
  onFileChange: (id: string, content: string | undefined) => void;
  onTabSelect: (id: string) => void;
}

export function EditorPane({ files, activeFileId, theme, onFileChange, onTabSelect }: EditorPaneProps) {
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      <div className="flex bg-neutral-950 overflow-x-auto border-b border-neutral-800 shrink-0">
        {files.map(file => (
          <button
            key={file.id}
            onClick={() => onTabSelect(file.id)}
            className={`px-4 py-2 text-sm max-w-[150px] truncate border-r border-neutral-800 transition-colors ${
              file.id === activeFileId 
                ? 'bg-neutral-800 text-neutral-100 flex-shrink-0 border-t-2 border-t-blue-500' 
                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border-t-2 border-t-transparent'
            }`}
          >
            {file.name}
          </button>
        ))}
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
          <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
            No file selected
          </div>
        )}
      </div>
    </div>
  );
}
