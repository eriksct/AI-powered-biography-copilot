import { useState } from "react";
import { Header } from "@/components/Header";
import { RecordingsList } from "@/components/RecordingsList";
import { TextEditor } from "@/components/TextEditor";
import { AIAssistant } from "@/components/AIAssistant";
import { Recording, Message } from "@/types/biography";

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
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecordingId === id) {
      setSelectedRecordingId(null);
    }
  };
  const handleSendMessage = (messageContent: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };
    setMessages([...messages, newMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Je comprends. Je vais vous aider avec votre biographie. Pouvez-vous me donner plus de détails sur ce que vous souhaitez développer ?",
      };
      setMessages((prev) => [...prev, aiResponse]);
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
          <AIAssistant messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
