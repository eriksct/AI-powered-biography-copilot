import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Send, Copy, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatThreads, useCreateChatThread } from '@/hooks/useChatThreads';
import { useMessages, useSendMessage } from '@/hooks/useMessages';

interface AIAssistantProps {
  projectId: string;
  subjectName?: string;
}

export function AIAssistant({ projectId, subjectName }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats, isLoading: chatsLoading } = useChatThreads(projectId);
  const createThread = useCreateChatThread();
  const { data: messages, isLoading: messagesLoading } = useMessages(activeChatId);
  const sendMessage = useSendMessage();

  // Auto-select first chat or create one
  useEffect(() => {
    if (chats && chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatUpdatedAt = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const handleCreateChat = async () => {
    try {
      const thread = await createThread.mutateAsync({ projectId });
      setActiveChatId(thread.id);
    } catch {
      toast.error('Erreur lors de la création du chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    // Auto-create a thread if none exists
    let threadId = activeChatId;
    if (!threadId) {
      try {
        const thread = await createThread.mutateAsync({ projectId });
        threadId = thread.id;
        setActiveChatId(thread.id);
      } catch {
        toast.error('Erreur lors de la création du chat');
        return;
      }
    }

    setInput('');
    try {
      await sendMessage.mutateAsync({
        chatThreadId: threadId,
        content,
        projectId,
        subjectName: subjectName || undefined,
      });
    } catch {
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('Copié !');
  };

  return (
    <div className="flex flex-col h-full bg-panel border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MessageSquare className="w-4 h-4" />
          <span>Assistant IA</span>
        </div>
        <div className="flex items-center gap-1">
          {chats && chats.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <History className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {chats.map((chat) => (
                  <DropdownMenuItem
                    key={chat.id}
                    onSelect={() => setActiveChatId(chat.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-md px-3 py-2',
                      chat.id === activeChatId && 'bg-accent/50'
                    )}
                  >
                    <div className="flex w-full items-center justify-between text-sm font-medium">
                      <span className="truncate">{chat.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatUpdatedAt(chat.updated_at)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCreateChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatsLoading || messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                  message.role === 'user'
                    ? 'bg-chat-user text-chat-user-foreground rounded-br-md'
                    : 'bg-chat-assistant text-chat-assistant-foreground rounded-bl-md'
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            Commencez une conversation avec l'assistant IA.
            {subjectName && (
              <p className="mt-1">
                Sujet : <span className="font-medium">{subjectName}</span>
              </p>
            )}
          </div>
        )}

        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="bg-chat-assistant text-chat-assistant-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Réflexion en cours...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
              disabled={!input.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
