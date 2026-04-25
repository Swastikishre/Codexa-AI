import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Code2, Settings2, Code, MessageSquare, KeyRound } from 'lucide-react';
import { EditorPane } from './components/EditorPane';
import { ChatPane } from './components/ChatPane';
import { ProjectFile } from './types';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { setApiKey, hasApiKey } from './lib/gemini';

const INITIAL_FILES: ProjectFile[] = [];

const MONACO_LANGUAGES = [
  "javascript", "typescript", "python", "java", "c", "cpp", "csharp", "go",
  "rust", "php", "ruby", "swift", "kotlin", "html", "css", "scss", "less",
  "json", "yaml", "xml", "markdown", "sql", "shell", "powershell", "dockerfile",
  "graphql", "r", "lua", "objective-c", "fsharp", "vb", "perl", "coffeescript", "dart"
].sort();

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [theme, setTheme] = useState('vs-dark');
  const [mobileView, setMobileView] = useState<'editor' | 'chat'>('editor');

  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const activeFile = files.find(f => f.id === activeFileId);

  const handleFileChange = (id: string, content: string | undefined) => {
    setFiles(files.map(f => f.id === id ? { ...f, content: content || '' } : f));
  };

  const handleLanguageChange = (id: string, language: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, language } : f));
  };

  const submitNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName;
    if (!name?.trim()) return;
    
    const ext = name.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = { 
      js: 'javascript', ts: 'typescript', py: 'python', 
      html: 'html', css: 'css', json: 'json', md: 'markdown',
      cpp: 'cpp', c: 'c', go: 'go', rs: 'rust'
    };
    const language = langMap[ext || ''] || 'plaintext';
    
    const newId = Date.now().toString();
    setFiles([...files, { id: newId, name, language, content: '' }]);
    setActiveFileId(newId);
    setMobileView('editor');
    setShowAddFileModal(false);
    setNewFileName('');
  };

  const handleAddFile = () => {
    setShowAddFileModal(true);
  };

  const deleteFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : '');
    }
  };

  const startRename = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      setRenameValue(file.name);
      setRenameFileId(id);
    }
  };

  const submitRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !renameFileId) return;

    const ext = renameValue.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = { 
      js: 'javascript', ts: 'typescript', py: 'python', 
      html: 'html', css: 'css', json: 'json', md: 'markdown',
      cpp: 'cpp', c: 'c', go: 'go', rs: 'rust'
    };
    const newLanguage = langMap[ext || ''] || 'plaintext';

    setFiles(files.map(f => f.id === renameFileId ? { ...f, name: renameValue, language: newLanguage } : f));
    setRenameFileId(null);
    setRenameValue('');
  };

  const handleApplyCode = (code: string) => {
    if (!activeFileId || files.length === 0) {
      const newId = Date.now().toString();
      setFiles([{ id: newId, name: 'untitled.txt', language: 'plaintext', content: code }]);
      setActiveFileId(newId);
    } else {
      handleFileChange(activeFileId, code);
    }
    setMobileView('editor');
  };

  const handleDownload = async () => {
    if (files.length === 0) return alert("Nothing to download!");
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'project.zip');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-neutral-100 overflow-hidden font-sans">
      <header className="h-12 border-b border-black/50 bg-[#323233] flex items-center justify-between px-3 md:px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-blue-500 rounded flex items-center justify-center text-white shadow-sm border border-blue-600">
            <Code2 size={16} strokeWidth={2.5} />
          </div>
          <h1 className="font-medium text-sm tracking-wide text-neutral-200">Codexa AI</h1>
        </div>
        
        <div className="flex md:hidden items-center p-1 bg-black/20 rounded-md border border-neutral-700/50 mr-auto ml-4">
          <button 
            onClick={() => setMobileView('editor')}
            className={`px-3 py-1 flex items-center gap-1.5 text-xs rounded transition-all ${mobileView === 'editor' ? 'bg-[#1e1e1e] text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <Code size={14} /> Editor
          </button>
          <button 
            onClick={() => setMobileView('chat')}
            className={`px-3 py-1 flex items-center gap-1.5 text-xs rounded transition-all ${mobileView === 'chat' ? 'bg-[#1e1e1e] text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {activeFile && (
            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-300 px-2 py-1 bg-black/20 rounded border border-neutral-700/50 transition-colors focus-within:border-neutral-500">
              <span className="ml-1 font-medium select-none">Lang:</span>
              <select 
                value={activeFile.language}
                onChange={(e) => handleLanguageChange(activeFile.id, e.target.value)}
                className="bg-transparent border-none text-neutral-200 focus:outline-none cursor-pointer appearance-none px-2 pr-4 capitalize"
              >
                {MONACO_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-300 px-2 py-1 bg-black/20 rounded border border-neutral-700/50 transition-colors focus-within:border-neutral-500">
            <Settings2 size={14} className="ml-1" />
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-transparent border-none text-neutral-200 focus:outline-none cursor-pointer appearance-none px-2"
            >
              <option value="vs-dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#37373d] hover:bg-[#2a2d2e] rounded text-xs font-medium text-white shadow-sm transition-colors border border-black/30"
          >
            <KeyRound size={14} />
            <span className="hidden md:inline">API Key</span>
          </button>

          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium text-white shadow-sm transition-colors border border-blue-500"
          >
            <Download size={14} />
            <span className="hidden md:inline">Download</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden relative">
        <PanelGroup direction="horizontal" className="w-full h-full">
          {/* Mobile wraps Editor and Sidebar (simple setup for mobile: just show editor) */}
          <Panel defaultSize={70} minSize={30} className={`flex flex-col relative w-full h-full bg-[#1e1e1e] ${mobileView === 'editor' ? 'flex' : 'hidden md:flex'}`}>
            <EditorPane 
              files={files} 
              activeFileId={activeFileId} 
              theme={theme}
              onFileChange={handleFileChange}
              onTabSelect={setActiveFileId}
              onAddFile={handleAddFile}
              onCloseFile={deleteFile}
              onRenameFile={startRename}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#252526] hover:bg-blue-500 transition-colors hidden md:block cursor-col-resize z-10" />

          {/* Chat Pane */}
          <Panel defaultSize={30} minSize={20} className={`flex flex-col h-full w-full bg-[#1e1e1e] absolute z-20 top-0 right-0 md:relative md:flex ${mobileView === 'chat' ? 'flex' : 'hidden'}`}>
            <ChatPane files={files} onApplyCode={handleApplyCode} />
          </Panel>
        </PanelGroup>
      </main>

      {/* Add File Modal */}
      {showAddFileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitNewFile} className="bg-[#252526] border border-neutral-700/50 rounded-xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-100">Create New File</h2>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g., index.html, script.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="bg-[#1e1e1e] border border-neutral-700 text-neutral-100 px-3 py-2 text-sm rounded shadow-inner focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAddFileModal(false)} className="px-4 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Cancel</button>
              <button type="submit" disabled={!newFileName.trim()} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Create File</button>
            </div>
          </form>
        </div>
      )}

      {/* Rename File Modal */}
      {renameFileId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitRename} className="bg-[#252526] border border-neutral-700/50 rounded-xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-100">Rename File</h2>
            <input 
              autoFocus
              type="text" 
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="bg-[#1e1e1e] border border-neutral-700 text-neutral-100 px-3 py-2 text-sm rounded shadow-inner focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setRenameFileId(null)} className="px-4 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Cancel</button>
              <button type="submit" disabled={!renameValue.trim()} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Rename File</button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setApiKey(apiKeyValue);
              setShowSettingsModal(false);
            }} 
            className="bg-[#252526] border border-neutral-700/50 rounded-xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4"
          >
            <h2 className="text-sm font-semibold text-neutral-100">Settings</h2>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Gemini API Key</label>
              <input 
                autoFocus
                type="password" 
                placeholder="AIzaSy..."
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-neutral-700 text-neutral-100 px-3 py-2 text-sm rounded shadow-inner focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500 mt-2">Stored locally in your browser. Leave blank to use environment default.</p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors">Save Settings</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
