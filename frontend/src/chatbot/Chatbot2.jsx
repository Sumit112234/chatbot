import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Bot, User, Loader2, Sparkles } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function Chatbot2() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedSessionId = localStorage.getItem('sessionId');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save session ID to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      // Update session ID if it's new
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'ai',
        timestamp: new Date(data.timestamp).toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/reset-chat/${sessionId}`, {
          method: 'POST'
        });
      }
      
      setMessages([]);
      setSessionId(null);
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('sessionId');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-3 p-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl max-w-xs border border-slate-700/50">
      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="relative bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              AI Assistant
              <Sparkles className="w-5 h-5 text-violet-400" />
            </h1>
            <p className="text-sm text-slate-400">Powered by Gemini AI • Always ready to help</p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="flex items-center space-x-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-700/50 hover:border-slate-600"
          title="Reset Chat"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Reset</span>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Bot className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Welcome to AI Assistant!</h2>
            <p className="text-center max-w-md text-slate-300 leading-relaxed">
              Ready to chat? Type your message below and let's start an amazing conversation together.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-3 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl group`}>
                  {message.sender === 'ai' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <div
                      className={`px-5 py-3 rounded-2xl backdrop-blur-sm transition-all duration-200 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-xl rounded-br-lg'
                          : message.isError
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 rounded-bl-lg'
                          : 'bg-slate-800/70 text-slate-100 border border-slate-700/50 hover:bg-slate-800/90 rounded-bl-lg shadow-lg'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                    </div>
                    <span className={`text-xs text-slate-500 mt-2 px-1 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp}
                    </span>
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/50 p-6">
        <div className="flex items-end space-x-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... ✨"
              className="w-full px-5 py-4 pr-16 bg-slate-900/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-slate-900/70"
              rows="1"
              style={{ minHeight: '56px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <div className="absolute right-4 bottom-4 text-xs text-slate-500 flex items-center gap-1">
              <span>Press Enter to send</span>
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-4 rounded-2xl transition-all duration-200 shadow-lg ${
              !inputMessage.trim() || isLoading
                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot2;