export interface Recording {
  id: string;
  name: string;
  duration: string;
  currentTime: string;
  transcript?: string;
  isActive?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Biography {
  id: string;
  title: string;
  content: string;
  recordings: Recording[];
  messages: Message[];
}
