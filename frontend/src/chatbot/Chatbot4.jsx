import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Bot, User, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function Chatbot4() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages/session from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedSessionId) setSessionId(savedSessionId);
  }, []);

  // Save messages to localStorage on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (sessionId) localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: userMessage.text,
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response from server');

      const data = await response.json();
      if (!sessionId) setSessionId(data.session_id);

      const aiMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'ai',
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/reset-chat/${sessionId}`, { method: 'POST' });
      }
      setMessages([]);
      setSessionId(null);
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('sessionId');
      inputRef.current?.focus();
    } catch (error) {
      // do nothing extra
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 shadow-md backdrop-blur">
      <Bot className="w-5 h-5 text-cyan-400" />
      <span className="inline-flex gap-1">
        <span className="block w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
        <span className="block w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
        <span className="block w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
      </span>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-[#161b29] via-[#1a2036] to-[#157fa1]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-14 py-4 bg-gradient-to-r from-cyan-700/75 to-fuchsia-700/60 shadow-md backdrop-blur border-b border-cyan-800/60">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-cyan-400 rounded-full p-2 shadow-cyan-700/40 shadow-lg">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">AI Chatbot</h1>
            <p className="text-sm text-cyan-200/80 mt-1">Powered by Gemini AI</p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="flex gap-2 items-center px-5 py-2 rounded-xl hover:bg-fuchsia-800/40 active:scale-95 border border-cyan-400/20 text-cyan-50 transition-all"
          title="Reset Chat"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-0">
        <div className="flex flex-col max-w-2xl w-full mx-auto py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 pb-24 rounded-2xl glass bg-white/5 shadow-lg backdrop-blur gap-4">
              <Bot className="w-16 h-16 text-cyan-300/80" />
              <h2 className="text-xl font-bold text-white mb-2">Welcome to AI Chatbot!</h2>
              <p className="text-base text-cyan-50/80 text-center max-w-md">
                Start a conversation by typing a message below. I'm here to help with any questions you might have.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'ai' && (
                    <div className="flex-shrink-0 flex items-end">
                      <span className="bg-fuchsia-800/50 p-2 rounded-full shadow-cyan-600/30 shadow mr-2">
                        <Bot className="w-5 h-5 text-cyan-300" />
                      </span>
                    </div>
                  )}
                  <div>
                    <div
                      className={
                        [
                          'rounded-2xl px-4 py-3 max-w-xs md:max-w-lg lg:max-w-xl',
                          'shadow shadow-cyan-600/15 backdrop-blur',
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-cyan-700 via-cyan-600 to-fuchsia-700/70 text-cyan-50 rounded-br-md'
                            : message.isError
                              ? 'bg-pink-900/30 text-pink-400 border border-pink-600 rounded-bl-md'
                              : 'bg-white/10 text-cyan-100 border border-cyan-400/10 rounded-bl-md'
                        ].join(' ')
                      }
                    >
                      <span className="whitespace-pre-wrap break-words">{message.text}</span>
                    </div>
                    <div
                      className={[
                        'text-xs mt-1 ',
                        message.sender === 'user'
                          ? 'text-right text-cyan-300/50 pr-2'
                          : 'text-left text-cyan-300/40 pl-2'
                      ].join(' ')}
                    >
                      {message.timestamp}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="flex-shrink-0 flex items-end">
                      <span className="bg-cyan-700/90 p-2 rounded-full shadow-cyan-900/50 shadow ml-2">
                        <User className="w-5 h-5 text-cyan-200" />
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white/5 border-t border-cyan-900/60 px-2 sm:px-0 py-5 backdrop-blur-md">
        <form
          className="flex items-center max-w-2xl mx-auto gap-3"
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
        >
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="w-full resize-none rounded-xl px-4 py-3 pr-16 bg-cyan-950/35 border border-cyan-500/15 text-cyan-100 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/30 focus:outline-none shadow-lg transition-all"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '116px' }}
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            type="submit"
            className={`
              flex items-center justify-center rounded-xl
              h-12 w-12 transition-all
              ${!inputMessage.trim() || isLoading
                ? 'bg-cyan-900/30 text-cyan-700 cursor-not-allowed'
                : 'bg-gradient-to-tr from-cyan-500 to-fuchsia-500 text-white hover:scale-105 hover:shadow-lg active:scale-95'}
              shadow-lg`}
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />
            }
          </button>
        </form>
      </footer>
    </div>
  );
}

export default Chatbot4;
