import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Code2, Settings2 } from 'lucide-react';
import { EditorPane } from './components/EditorPane';
import { ChatPane } from './components/ChatPane';
import { ProjectFile } from './types';

const INITIAL_FILES: ProjectFile[] = [
  {
    id: '1',
    name: 'index.html',
    language: 'html',
    content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>'
  },
  {
    id: '2',
    name: 'styles.css',
    language: 'css',
    content: 'body {\n  margin: 0;\n  font-family: sans-serif;\n  background: #111;\n  color: #fff;\n}'
  },
  {
    id: '3',
    name: 'script.js',
    language: 'javascript',
    content: 'console.log("Hello from the editor!");\n\nfunction doMagic() {\n  return "Magic!";\n}'
  }
];

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('3');
  const [theme, setTheme] = useState('vs-dark');

  const handleFileChange = (id: string, content: string | undefined) => {
    setFiles(files.map(f => f.id === id ? { ...f, content: content || '' } : f));
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'project.zip');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-900 shadow-sm border border-neutral-200">
            <Code2 size={18} strokeWidth={2.5} />
          </div>
          <h1 className="font-semibold text-sm tracking-wide">Studio IDE</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400 border border-neutral-800 rounded-lg px-2 py-1.5 bg-neutral-900 transition-colors focus-within:border-neutral-600">
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
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Download size={14} />
            Download Project
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <EditorPane 
            files={files} 
            activeFileId={activeFileId} 
            theme={theme}
            onFileChange={handleFileChange}
            onTabSelect={setActiveFileId}
          />
        </div>
        <ChatPane files={files} />
      </main>
    </div>
  );
}
