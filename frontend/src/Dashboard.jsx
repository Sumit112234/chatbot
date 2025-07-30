import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Bot, Sparkles, Zap, Brain, Heart, ArrowRight, Star } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const chatbots = [
    {
      id: 1,
      name: "Assistant Alpha",
      description: "Your creative companion for brainstorming and innovative solutions",
      icon: Sparkles,
      gradient: "from-purple-600 via-pink-500 to-red-400",
      bgGlow: "bg-purple-500/20",
      route: "/chat1",
      speciality: "Creative & Innovative"
    },
    {
      id: 2,
      name: "Logic Beta",
      description: "Analytical powerhouse for data-driven insights and problem solving",
      icon: Brain,
      gradient: "from-blue-600 via-cyan-500 to-teal-400",
      bgGlow: "bg-blue-500/20",
      route: "/chat2",
      speciality: "Analysis & Logic"
    },
    {
      id: 3,
      name: "Speed Gamma",
      description: "Lightning-fast responses for quick questions and rapid assistance",
      icon: Zap,
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      bgGlow: "bg-yellow-500/20",
      route: "/chat3",
      speciality: "Quick & Efficient"
    },
    {
      id: 4,
      name: "Empathy Delta",
      description: "Warm and understanding support for personal conversations",
      icon: Heart,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bgGlow: "bg-green-500/20",
      route: "/chat4",
      speciality: "Supportive & Caring"
    }
  ];

  const FloatingParticle = ({ delay, size, duration }) => (
    <div
      className={`absolute rounded-full bg-gradient-to-r from-white/20 to-white/5 animate-pulse`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            size={Math.random() * 6 + 2}
            duration={Math.random() * 4 + 3}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6 animate-pulse">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
            AI Assistant Hub
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose your perfect AI companion from our specialized collection of intelligent assistants
          </p>
          <div className="flex items-center justify-center mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current mx-1 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>

        {/* Chatbot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {chatbots.map((bot, index) => {
            const IconComponent = bot.icon;
            return (
              <div
                key={bot.id}
                className={`relative group cursor-pointer transition-all duration-700 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onMouseEnter={() => setHoveredCard(bot.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(bot.route)}
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${bot.gradient} rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-1000 group-hover:blur-xl`} />
                
                {/* Card */}
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 group-hover:border-slate-600/50 transition-all duration-500 transform group-hover:scale-105">
                  {/* Background Glow */}
                  <div className={`absolute inset-0 ${bot.bgGlow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${bot.gradient} mb-6 transform transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    {/* Badge */}
                    <div className="inline-block px-3 py-1 bg-slate-700/50 rounded-full text-xs text-gray-300 mb-4">
                      {bot.speciality}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                      {bot.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {bot.description}
                    </p>

                    {/* Action Button */}
                    <div className="flex items-center text-white group-hover:text-gray-200 transition-colors duration-300">
                      <span className="mr-2 font-medium">Start Chatting</span>
                      <ArrowRight className={`w-5 h-5 transform transition-transform duration-300 ${
                        hoveredCard === bot.id ? 'translate-x-2' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <MessageCircle className="w-6 h-6 text-white animate-bounce" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className={`text-center transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <p className="text-gray-400">Always Available</p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                ∞
              </div>
              <p className="text-gray-400">Unlimited Conversations</p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                4
              </div>
              <p className="text-gray-400">Specialized Assistants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, purple 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, pink 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
    </div>
  );
};

export default Dashboard;