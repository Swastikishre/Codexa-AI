import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Plus, Play, Code, X, Edit2 } from 'lucide-react';
import { ProjectFile } from '../types';
import Markdown from 'react-markdown';

interface EditorPaneProps {
  files: ProjectFile[];
  activeFileId: string;
  theme: string;
  onFileChange: (id: string, content: string | undefined) => void;
  onTabSelect: (id: string) => void;
  onAddFile: () => void;
  onCloseFile: (id: string) => void;
  onRenameFile: (id: string) => void;
}

export function EditorPane({ files, activeFileId, theme, onFileChange, onTabSelect, onAddFile, onCloseFile, onRenameFile }: EditorPaneProps) {
  const activeFile = files.find(f => f.id === activeFileId);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const canPreview = activeFile?.language === 'html' || activeFile?.language === 'markdown';

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] w-full">
      <div className="flex bg-[#252526] overflow-x-auto border-b border-neutral-800 shrink-0 items-center scrollbar-hide">
        {files.map(file => (
          <div
            key={file.id}
            onClick={() => onTabSelect(file.id)}
            className={`group flex items-center gap-2 px-3 py-2 text-[13px] min-w-[120px] max-w-[200px] border-r border-[#1e1e1e] cursor-pointer transition-colors shrink-0 ${
              file.id === activeFileId 
                ? 'bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500 pb-[7px]' 
                : 'text-neutral-400 hover:bg-[#2d2d30] hover:text-neutral-200 border-t-2 border-t-transparent'
            }`}
          >
            <span className="truncate flex-1" onDoubleClick={(e) => { e.stopPropagation(); onRenameFile(file.id); }}>{file.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onCloseFile(file.id); }}
              className={`p-0.5 rounded-md hover:bg-neutral-700/50 transition-colors ${file.id === activeFileId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300'}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button 
          onClick={onAddFile}
          className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-[#2d2d30] rounded-md transition-colors shrink-0 mx-2"
          title="Create New File"
        >
          <Plus size={16} />
        </button>
      </div>

      {activeFile && canPreview && (
        <div className="flex items-center px-4 py-1.5 bg-[#1e1e1e] border-b border-neutral-800 shrink-0">
          <div className="flex items-center bg-[#252526] rounded-md p-0.5 border border-neutral-800/80 shadow-sm">
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-4 py-1 text-xs font-medium rounded-sm transition-colors ${
                viewMode === 'code' ? 'bg-[#37373d] text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Code size={14} /> Code
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-4 py-1 text-xs font-medium rounded-sm transition-colors ${
                viewMode === 'preview' ? 'bg-[#37373d] text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Play size={14} /> Preview
            </button>
          </div>
          <span className="ml-auto text-xs text-neutral-500">Double-click a tab to rename</span>
        </div>
      )}
      
      <div className="flex-1 relative">
        {activeFile ? (
          viewMode === 'preview' && canPreview ? (
            <div className="w-full h-full bg-white overflow-auto">
              {activeFile.language === 'html' ? (
                <iframe 
                  sandbox="allow-scripts"
                  srcDoc={activeFile.content} 
                  className="w-full h-full border-0" 
                  title="Preview"
                />
              ) : (
                <div className="markdown-body p-8 max-w-4xl mx-auto text-black !bg-white">
                  <Markdown>{activeFile.content}</Markdown>
                </div>
              )}
            </div>
          ) : (
            <Editor
              height="100%"
              language={activeFile.language}
              theme={theme}
              value={activeFile.content}
              onChange={(val) => onFileChange(activeFile.id, val)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                wordWrap: 'on',
                padding: { top: 16 }
              }}
            />
          )
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
    <div className="h-12 w-12 rounded-full bg-neutral-800/50 border border-neutral-700 flex items-center justify-center relative shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    </div>
  );
}
