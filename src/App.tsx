import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Code2, Settings2, Code, MessageSquare } from 'lucide-react';
import { EditorPane } from './components/EditorPane';
import { ChatPane } from './components/ChatPane';
import { ProjectFile } from './types';

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

  const activeFile = files.find(f => f.id === activeFileId);

  const handleFileChange = (id: string, content: string | undefined) => {
    setFiles(files.map(f => f.id === id ? { ...f, content: content || '' } : f));
  };

  const handleLanguageChange = (id: string, language: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, language } : f));
  };

  const handleAddFile = () => {
    const name = prompt("Enter file name (e.g., script.js, index.html):");
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
    setMobileView('editor'); // Switch to editor view if on mobile
  };

  const handleApplyCode = (code: string) => {
    if (!activeFileId || files.length === 0) {
      // If no file, create a new untitled file automatically
      const newId = Date.now().toString();
      setFiles([{ id: newId, name: 'untitled.txt', language: 'plaintext', content: code }]);
      setActiveFileId(newId);
    } else {
      // Apply to active file
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
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between px-3 md:px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-neutral-100 rounded-lg hidden md:flex items-center justify-center text-neutral-900 shadow-sm border border-neutral-200">
            <Code2 size={18} strokeWidth={2.5} />
          </div>
          <h1 className="font-semibold text-sm tracking-wide">Codexa AI</h1>
        </div>
        
        <div className="flex md:hidden items-center p-1 bg-neutral-900 rounded-lg border border-neutral-800 mr-auto ml-4">
          <button 
            onClick={() => setMobileView('editor')}
            className={`px-3 py-1 flex items-center gap-1.5 text-xs rounded-md transition-all ${mobileView === 'editor' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <Code size={14} /> Editor
          </button>
          <button 
            onClick={() => setMobileView('chat')}
            className={`px-3 py-1 flex items-center gap-1.5 text-xs rounded-md transition-all ${mobileView === 'chat' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {activeFile && (
            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 border border-neutral-800 rounded-lg px-2 py-1.5 bg-neutral-900 transition-colors focus-within:border-neutral-600">
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
          
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 border border-neutral-800 rounded-lg px-2 py-1.5 bg-neutral-900 transition-colors focus-within:border-neutral-600">
            <Settings2 size={14} className="ml-1" />
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-transparent border-none text-neutral-200 focus:outline-none cursor-pointer appearance-none px-2 pr-4"
            >
              <option value="vs-dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>
          
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Download size={14} />
            <span className="hidden md:inline">Download Project</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 relative w-full h-full transition-all duration-300 ${mobileView === 'editor' ? 'block' : 'hidden md:block'}`}>
          <EditorPane 
            files={files} 
            activeFileId={activeFileId} 
            theme={theme}
            onFileChange={handleFileChange}
            onTabSelect={setActiveFileId}
            onAddFile={handleAddFile}
          />
        </div>
        <div className={`h-full w-full md:w-[400px] absolute z-20 top-0 right-0 md:relative transition-all duration-300 ${mobileView === 'chat' ? 'block' : 'hidden md:block'}`}>
          <ChatPane files={files} onApplyCode={handleApplyCode} />
        </div>
      </main>
    </div>
  );
}
