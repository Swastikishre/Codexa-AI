export interface ProjectFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: { mimeType: string; data: string; dataUrl: string }[];
  isError?: boolean;
}
