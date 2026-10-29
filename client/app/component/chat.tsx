
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

interface IMessage {
  role: "assistant" | "user";
  content: string;
  documents?: string[];
}

export const ChatComponent = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSendChatMessage = async () => {
    const userMessage = message.trim();

    if (!userMessage || loading) return;

    // Add user's message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`
      );

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await res.json();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <h2 className="text-xl font-semibold">
          Chat with PDF
        </h2>
        <p className="text-sm text-gray-400">
          Ask questions about your uploaded PDF
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-4">

          {messages.length === 0 && (
            <div className="text-center mt-20 text-gray-400">
              <p className="text-lg font-medium">
                Start a conversation
              </p>
              <p className="text-sm mt-2">
                Ask anything about your PDF document.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* AI loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3 text-gray-400">
                AI is thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Chat input */}
      <div className="border-t border-gray-800 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleSendChatMessage();
              }
            }}
            placeholder="Ask a question about your PDF..."
            disabled={loading}
            className="bg-gray-900 border-gray-700 text-white"
          />

          <Button
            onClick={handleSendChatMessage}
            disabled={!message.trim() || loading}
          >
            {loading ? "Thinking..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
};
