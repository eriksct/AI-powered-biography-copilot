import { useState, useRef, useEffect } from "react";
import { MessageSquare, Plus, Send, RotateCcw, Volume2, Copy, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/biography";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export function AIAssistant({ messages, onSendMessage }: AIAssistantProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-panel border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MessageSquare className="w-4 h-4" />
          <span>Assistant IA</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                message.role === "user"
                  ? "bg-chat-user text-chat-user-foreground rounded-br-md"
                  : "bg-chat-assistant text-chat-assistant-foreground rounded-bl-md"
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Assistant message actions */}
              {message.role === "assistant" && (
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <Volume2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
