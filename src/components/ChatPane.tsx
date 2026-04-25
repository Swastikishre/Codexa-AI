import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, ImagePlus, X, Loader2 } from 'lucide-react';
import { ChatMessage, ProjectFile } from '../types';
import { startDictation } from '../lib/speech';
import { sendMessage } from '../lib/gemini';
import Markdown from 'react-markdown';

interface ChatPaneProps {
  files: ProjectFile[];
}

export function ChatPane({ files }: ChatPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  }, [messages, isLoading]);

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

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const aiResponse = await sendMessage(
        newMessage.text,
        newMessage.images || [],
        includeContext ? files : null
      );
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: err.message,
        isError: true
      }]);
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
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 w-[400px] shrink-0">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 shrink-0">
        <h2 className="font-semibold text-neutral-100 text-sm">AI Assistant</h2>
        <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-200">
          <input 
            type="checkbox" 
            checked={includeContext} 
            onChange={(e) => setIncludeContext(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
          />
          Read Editor Tabs
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 mt-10">
            <p className="text-sm">Hi! I'm your GenAI coding assistant.</p>
            <p className="text-xs mt-2">I use Google Search grounding and can read your editor files.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
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
              <div className="text-sm markdown-body leading-relaxed max-w-none break-words">
                <Markdown>{msg.text}</Markdown>
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
