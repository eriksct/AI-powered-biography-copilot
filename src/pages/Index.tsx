import { useState } from "react";
import { Header } from "@/components/Header";
import { RecordingsList } from "@/components/RecordingsList";
import { TextEditor } from "@/components/TextEditor";
import { AIAssistant } from "@/components/AIAssistant";
import { Recording, Message, ChatThread } from "@/types/biography";

const initialRecordings: Recording[] = [
  {
    id: "1",
    name: "Enregistrement 1",
    duration: "28min",
    currentTime: "14:56",
    transcript: "Transcription de l'enregistrement 1...",
  },
  {
    id: "2",
    name: "Enregistrement 2",
    duration: "57min",
    currentTime: "0:00",
  },
  {
    id: "3",
    name: "Enregistrement 3",
    duration: "57min",
    currentTime: "0:00",
  },
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "J'écris une biographie sur Madame Herveux",
  },
  {
    id: "2",
    role: "assistant",
    content: `D'accord 😊

Tu peux me dire ce que tu attends exactement ?

Par exemple, est-ce que tu veux :

• de l'aide pour structurer la biographie (plan, chapitres)
• une réécriture plus littéraire ou plus académique
• de l'aide pour inventer une biographie (fiction)
• ou travailler à partir de faits réels que tu as déjà ?

Dis-moi aussi qui est Madame Herveux (personnage réel ou fictif, époque, domaine, ton souhaité), et je t'aide à avancer pas à pas.`,
  },
];

const initialChats: ChatThread[] = [
  {
    id: "chat-1",
    title: "Discussion actuelle",
    updatedAt: "2026-02-06T10:15:00.000Z",
    messages: initialMessages,
  },
  {
    id: "chat-2",
    title: "Plan de biographie",
    updatedAt: "2026-02-01T18:40:00.000Z",
    messages: [
      {
        id: "c2-1",
        role: "user",
        content: "Peux-tu proposer un plan en 5 chapitres ?",
      },
      {
        id: "c2-2",
        role: "assistant",
        content:
          "Bien sûr. Voici un plan structuré en 5 chapitres avec une introduction et une conclusion.",
      },
    ],
  },
  {
    id: "chat-3",
    title: "Style littéraire",
    updatedAt: "2026-01-28T09:05:00.000Z",
    messages: [
      {
        id: "c3-1",
        role: "user",
        content: "Réécris ce passage dans un style plus poétique.",
      },
      {
        id: "c3-2",
        role: "assistant",
        content:
          "Je propose une réécriture plus imagée, tout en conservant les faits historiques.",
      },
    ],
  },
];

const initialContent = `Madame Herveux (1930 – 2024)

Introduction

Madame Herveux est née le 20 décembre 1930 à Toul
...

Chapitre 1

À sa naissance, Madame Herveux était aveugle.
En effet, ...`;

export default function Index() {
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>("1");
  const [content, setContent] = useState(initialContent);
  const [chats, setChats] = useState<ChatThread[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string>(initialChats[0]?.id ?? "");

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecordingId === id) {
      setSelectedRecordingId(null);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleCreateChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatThread = {
      id: newChatId,
      title: `Nouveau chat ${chats.length + 1}`,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
  };

  const handleSendMessage = (messageContent: string) => {
    if (!activeChatId) {
      return;
    }
    const targetChatId = activeChatId;
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === targetChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              updatedAt: new Date().toISOString(),
            }
          : chat
      )
    );
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Je comprends. Je vais vous aider avec votre biographie. Pouvez-vous me donner plus de détails sur ce que vous souhaitez développer ?",
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                messages: [...chat.messages, aiResponse],
                updatedAt: new Date().toISOString(),
              }
            : chat
        )
      );
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header biographyTitle="Madame Herveux" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Recordings */}
        <div className="w-64 shrink-0">
          <RecordingsList
            recordings={recordings}
            onSelectRecording={handleSelectRecording}
            onDeleteRecording={handleDeleteRecording}
            selectedRecordingId={selectedRecordingId}
          />
        </div>

        {/* Center panel - Text Editor */}
        <div className="flex-1 min-w-0">
          <TextEditor content={content} onContentChange={setContent} />
        </div>

        {/* Right panel - AI Assistant */}
        <div className="w-80 shrink-0">
          <AIAssistant
            chats={chats}
            activeChatId={activeChatId}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSelectChat={handleSelectChat}
            onCreateChat={handleCreateChat}
          />
        </div>
      </div>
    </div>
  );
}
