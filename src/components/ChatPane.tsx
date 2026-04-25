import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, ImagePlus, X, Loader2, Code2, Plus, MessageSquare, ChevronDown } from 'lucide-react';
import { ChatMessage, ProjectFile, ChatSession } from '../types';
import { startDictation } from '../lib/speech';
import { sendMessage } from '../lib/gemini';
import Markdown from 'react-markdown';

interface ChatPaneProps {
  files: ProjectFile[];
  onApplyCode?: (code: string) => void;
}

export function ChatPane({ files, onApplyCode }: ChatPaneProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([{
    id: '1', title: 'New Chat', messages: [], updatedAt: Date.now()
  }]);
  const [activeSessionId, setActiveSessionId] = useState<string>('1');
  const [showHistory, setShowHistory] = useState(false);
  
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<{mimeType: string, data: string, dataUrl: string}[]>([]);
  const [includeContext, setIncludeContext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const createNewChat = () => {
    const newId = Date.now().toString();
    setSessions(prev => [{ id: newId, title: 'New Chat', messages: [], updatedAt: Date.now() }, ...prev]);
    setActiveSessionId(newId);
    setShowHistory(false);
  };

  const toggleRecording = () => {
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      setRecognition(null);
    } else {
      const rec = startDictation(
        (text) => setInput(text),
        (err) => { console.error(err); setIsRecording(false); },
        () => setIsRecording(false)
      );
      if (rec) {
        setRecognition(rec);
        setIsRecording(true);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const base64Data = dataUrl.split(',')[1];
          setSelectedImages(prev => [...prev, {
            mimeType: file.type,
            dataUrl,
            data: base64Data
          }]);
        };
        reader.readAsDataURL(file);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && selectedImages.length === 0) return;

    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      setRecognition(null);
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      images: selectedImages.length > 0 ? selectedImages : undefined
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      messages: [...s.messages, newMessage],
      updatedAt: Date.now()
    } : s));
    
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      // Build full prompt history
      const currentMessages = activeSession.messages;
      const fullHistoryStr = currentMessages.length > 0 
        ? '[Previous Chat History]\n' + currentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n\n') + '\n\n[New Message]\n'
        : '';
        
      const promptToUse = fullHistoryStr + newMessage.text;

      const aiResponse = await sendMessage(
        promptToUse,
        newMessage.images || [],
        includeContext ? files : null
      );
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const isFirstInteraction = s.title === 'New Chat';
          let newTitle = s.title;
          if (isFirstInteraction) {
            const cleaned = aiResponse.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ').filter(Boolean);
            newTitle = cleaned.slice(0, 4).join(' ') + (cleaned.length > 4 ? '...' : '');
            if (!newTitle) newTitle = "Chat";
          }
          return {
            ...s,
            title: newTitle,
            messages: [...s.messages, {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: aiResponse
            }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } catch (err: any) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: err.message,
          isError: true
        }]
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 md:border-l border-neutral-800 w-full shrink-0 relative">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 shrink-0">
        <div className="relative">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 font-semibold text-neutral-100 text-sm hover:text-neutral-300 transition-colors"
          >
            {activeSession.title}
            <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          
          {showHistory && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-30 flex flex-col py-2 max-h-96 overflow-y-auto">
              <button 
                onClick={createNewChat}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 mx-2 rounded-md mb-2 border border-neutral-700 hover:border-neutral-600 transition-all font-medium"
              >
                <Plus size={16} /> New Chat
              </button>
              <div className="px-3 pb-1 pt-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Recent</div>
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm text-left truncate transition-colors ${activeSessionId === s.id ? 'bg-blue-500/10 text-blue-400' : 'text-neutral-300 hover:bg-neutral-800'}`}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={createNewChat}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-200">
            <input 
              type="checkbox" 
              checked={includeContext} 
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
            />
            Read Tabs
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 mt-10">
            <p className="text-sm">Hi! I'm Codexa AI, your coding assistant.</p>
            <p className="text-xs mt-2">I support over 30 languages! I use Google Search grounding and can read your editor files.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[100%] md:max-w-[90%] rounded-lg px-4 py-3 ${
              msg.role === 'user' ? 'bg-neutral-800 text-neutral-100' 
              : msg.isError ? 'bg-red-900/20 text-red-200 border border-red-800/50' 
              : 'bg-transparent text-neutral-200'
            }`}>
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.images.map((img, i) => (
                    <img key={i} src={img.dataUrl} alt="upload" className="h-20 w-20 object-cover rounded-lg border border-neutral-700" />
                  ))}
                </div>
              )}
              <div className="text-sm markdown-body leading-relaxed max-w-none break-words w-full">
                <Markdown
                  components={{
                    pre: ({children}) => <>{children}</>,
                    code(props) {
                      const {children, className, node, ...rest} = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');
                      
                      if (!isInline) {
                        const codeString = String(children).replace(/\n$/, '');
                        return (
                          <div className="relative group my-4">
                            <div className="absolute right-2 top-2 z-10">
                              <button 
                                onClick={() => onApplyCode && onApplyCode(codeString)} 
                                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md text-[11px] font-medium shadow-sm flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                title="Apply to current active file"
                              >
                                <Code2 size={12} /> Apply Code
                              </button>
                            </div>
                            <pre className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg overflow-x-auto font-mono text-[13px] text-neutral-300 w-full mb-0 mt-0">
                              <code className={className} {...rest}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                      return <code className={`${className} bg-neutral-800 px-1 py-0.5 rounded font-mono text-[13px] text-blue-300`} {...rest}>{children}</code>;
                    }
                  }}
                >
                  {msg.text}
                </Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start px-4">
            <div className="text-neutral-500 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-800 bg-neutral-950 shrink-0 relative">
        {selectedImages.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 p-3 bg-neutral-950 border-t border-neutral-800 flex flex-wrap gap-2 z-10">
            {selectedImages.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img.dataUrl} alt="selected" className="h-12 w-12 object-cover rounded border border-neutral-700" />
                <button 
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-neutral-800 rounded-full p-0.5 text-neutral-400 hover:text-white border border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden focus-within:border-neutral-500 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "ask anything i will code it"}
            className="w-full bg-transparent p-3 pb-1 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none resize-none min-h-[44px] max-h-32"
            rows={Math.min(4, Math.max(1, input.split('\n').length))}
          />
          
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                title="Attach Images"
              >
                <ImagePlus size={18} />
              </button>
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${isRecording ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20 animate-pulse' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'}`}
                title="Voice Dictation"
              >
                {isRecording ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
              className="p-1.5 bg-neutral-100 text-neutral-900 rounded-lg hover:bg-white disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

