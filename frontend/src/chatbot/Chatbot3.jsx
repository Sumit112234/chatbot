// ./chatbot/Chatbot5.js
import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Send, RefreshCw, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_APP_URL;

function Chatbot3() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Init/load from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages5");
    const savedSessionId = localStorage.getItem("sessionId5");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedSessionId) setSessionId(savedSessionId);
  }, []);
  // Save to localStorage
  useEffect(() => {
    if (messages.length)
      localStorage.setItem("chatMessages5", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    if (sessionId) localStorage.setItem("sessionId5", sessionId);
  }, [sessionId]);
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message logic
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          session_id: sessionId,
        }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!sessionId) setSessionId(data.session_id);
      const aiMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: "ai",
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "Sorry, I ran into an error. Please try again!",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset (also clears local storage for this bot)
  const resetChat = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/reset-chat/${sessionId}`, { method: "POST" });
      }
    } catch {}
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem("chatMessages5");
    localStorage.removeItem("sessionId5");
    inputRef.current?.focus();
  };

  // Handle Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f7eafd] via-[#f7daed] via-60% to-[#e9e7fd]">
      {/* Header */}
      <header className="w-full px-4 sm:px-12 py-4 bg-gradient-to-r from-pink-400/80 via-fuchsia-400/90 to-violet-500/80 shadow-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="bg-white/20 rounded-full p-2 shadow-xl">
            <Bot className="w-6 h-6 text-pink-100" />
          </span>
          <span className="text-xl font-bold text-white tracking-wide drop-shadow">VioletBot</span>
          <span className="ml-2 px-2 py-0.5 bg-white/10 text-pink-200 rounded-full text-xs">experimental</span>
        </div>
        <button
          className="flex items-center gap-1 px-4 py-2 bg-pink-400/70 text-white rounded-lg shadow hover:bg-white/20 hover:text-fuchsia-700 transition"
          onClick={resetChat}
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </header>

      {/* Messages timeline */}
      <main className="flex-1 overflow-y-auto py-6 px-2 sm:px-0">
        <div className="max-w-xl mx-auto flex flex-col gap-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-pink-700/80 my-12">
              <Bot className="w-14 h-14 mb-3 text-fuchsia-400" />
              <h2 className="text-2xl font-bold mb-2">Welcome to VioletBot!</h2>
              <p className="text-center text-xl max-w-md">Start your smart, elegant chat below.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={m.id} className={`flex items-end gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                {/* User */}
                {m.sender === "user" && (
                  <>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-right text-rose-400 font-medium">{m.timestamp}</span>
                        <User className="w-7 h-7 p-1 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-300 text-pink-50 shadow" />
                      </div>
                      <div className="rounded-t-xl rounded-bl-xl bg-gradient-to-bl from-pink-400 to-fuchsia-400/90 text-white px-5 py-2.5 shadow-md max-w-xs md:max-w-md text-right">
                        {m.text}
                      </div>
                    </div>
                  </>
                )}
                {/* Bot */}
                {m.sender === "ai" && (
                  <>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Bot className="w-7 h-7 p-1 rounded-full bg-gradient-to-br from-fuchsia-200 to-rose-100 text-fuchsia-700 shadow" />
                        <span className="text-xs text-rose-500">{m.timestamp}</span>
                      </div>
                      <div className={`rounded-t-xl rounded-br-xl px-5 py-2.5 shadow ${m.isError
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-white/90 text-fuchsia-900 border border-fuchsia-100"} max-w-xs md:max-w-md text-left`}>
                        {m.text}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-2 items-center mt-1">
              <Bot className="w-5 h-5 text-fuchsia-500 animate-pulse" />
              <span className="flex gap-1">
                <span className="block w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                <span className="block w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: "100ms"}} />
                <span className="block w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{animationDelay: "200ms"}} />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input bar */}
      <footer className="fixed bottom-0 left-0 right-0 px-3 sm:px-0 pb-3 bg-gradient-to-t from-white/55 to-white/10 backdrop-blur-md shadow-inner z-10">
        <form
          className="flex items-end max-w-xl mx-auto gap-2"
          onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message and press Enter…"
            className="w-full resize-none rounded-2xl px-4 py-3 bg-white/95 text-fuchsia-900 border border-fuchsia-200 placeholder-fuchsia-300 focus:outline-none focus:border-fuchsia-400 shadow"
            rows={1}
            style={{ minHeight: 44, maxHeight: 120 }}
            disabled={isLoading}
            autoFocus
          />
          <button
            disabled={!inputMessage.trim() || isLoading}
            className={`
              h-12 w-12 flex justify-center items-center
              bg-gradient-to-tr from-pink-400 to-fuchsia-400
              text-white rounded-2xl shadow
              hover:scale-105 active:scale-95 transition
              ${!inputMessage.trim() || isLoading
                ? "opacity-60 cursor-not-allowed"
                : ""}
            `}
            type="submit"
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-6 h-6" />
            }
          </button>
        </form>
      </footer>
    </div>
  );
}

export default Chatbot3;
