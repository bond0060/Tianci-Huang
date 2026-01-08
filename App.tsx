
import React, { useState, useRef, useEffect } from 'react';
import { Message, HotelSearchData } from './types';
import { generateHotelResponse } from './services/geminiService';

// High-fidelity SVG version of the provided Brand Logo
const Logo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#12d65e" />
    <g transform="translate(10, 15) scale(0.8)">
      <path 
        d="M10,50 Q10,25 30,25 Q40,25 50,35 Q60,25 70,25 Q90,25 90,50 Q90,85 50,85 Q10,85 10,50" 
        fill="none" 
        stroke="black" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle cx="30" cy="45" r="7" fill="black" />
      <circle cx="70" cy="45" r="7" fill="black" />
      <path 
        d="M28,65 Q50,80 72,65" 
        fill="none" 
        stroke="black" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
    </g>
  </svg>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Search state
  const [hotelName, setHotelName] = useState('');
  const [dates, setDates] = useState('09/01 - 12/01 (3晚)');
  const [guests, setGuests] = useState('2成人');

  const bgUrl = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStarted]);

  const handleStartConsultation = () => {
    if (!hotelName.trim()) return;
    setIsStarted(true);
    setIsEditingHeader(false);
    // Initial greeting from AI with better formatting
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是您的 WayPal 奢华酒店订房管家。\n\n我已经为您锁定了 **${hotelName}** 的相关信息：\n📅 **${dates}**\n👥 **${guests}**\n\n您可以点击下方的快捷指令开始探索，或者直接告诉我您的特殊需求（如：景观要求、特定权益等）。`,
      timestamp: Date.now()
    };
    setMessages([welcomeMsg]);
  };

  const handleSend = async (forcedQuery?: string) => {
    const queryText = forcedQuery || inputValue;
    if (!queryText.trim()) return;
    
    if (!isStarted) {
      if (!hotelName.trim()) return;
      handleStartConsultation();
    }

    const currentSearchData: HotelSearchData = {
      hotelName,
      dates,
      guests
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: Date.now(),
      hotelInfo: currentSearchData
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await generateHotelResponse(queryText, currentSearchData);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { 
      label: "全平台比价", 
      icon: <i className="fa-solid fa-magnifying-glass-dollar text-[#00df81]"></i>,
      query: "请帮我查询全平台的实时价格对比。请涵盖官方渠道、主要OTA平台（如携程、Booking）以及高端旅行社礼遇（如FHR、Virtuoso等），并给出最划算的预定建议。" 
    },
    { 
      label: "房型推荐", 
      icon: <i className="fa-solid fa-wand-magic-sparkles text-[#00df81]"></i>,
      query: "请根据该酒店的特色，为我推荐最值得入住的房型。重点对比景观差异、房间面积以及特色设施，并给出性价比最高和极致奢享两种选择。" 
    },
    { 
      label: "价格趋势", 
      icon: <i className="fa-solid fa-chart-line text-[#00df81]"></i>,
      query: "请分析该酒店在接下来的价格趋势。哪段时间入住最划算？有没有明显的淡旺季价格波动？" 
    }
  ];

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden text-white font-['Noto_Sans_SC'] bg-black">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ 
          backgroundImage: `url(${bgUrl})`,
          filter: isStarted ? 'blur(12px) brightness(0.35)' : 'blur(4px) brightness(0.55)'
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Header - Redesigned to match Gemini layout */}
      <header className="relative z-20 flex items-center justify-between px-5 pt-12 pb-4">
        <button className="w-10 h-10 flex items-center justify-start text-white/80 hover:text-white transition-colors">
          <i className="fa-solid fa-bars text-[18px]"></i>
        </button>
        
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-[17px] font-semibold tracking-tight text-white/90">WayPal</span>
        </div>
        
        <button className="w-8 h-8 rounded-full overflow-hidden shadow-lg border border-white/20 active:scale-95 transition-transform bg-[#12d65e]">
          <Logo />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col pt-2">
        {!isStarted ? (
          /* Step 1: Entry Flow Redesigned */
          <div className="flex-1 flex flex-col items-center justify-between py-10 animate-fade-up">
            {/* Centered Title Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 px-4">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white drop-shadow-xl">
                你好，WayPal是<br/>
                <span className="text-[#00df81]">奢华酒店订房助手</span>
              </h1>
              <p className="text-white/50 text-[14px] font-light max-w-[240px]">
                为您寻找最极致的入住体验与全球顶奢权益
              </p>
            </div>

            {/* Bottom-aligned Search Box */}
            <div className="w-full max-w-[340px] space-y-6">
              <div className="bg-white/90 backdrop-blur-2xl rounded-[1.75rem] p-6 shadow-2xl border border-white/30 transition-all hover:shadow-[#00df81]/10">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4 group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors group-focus-within:bg-[#00df81]/10 shrink-0">
                      <i className="fa-solid fa-hotel text-[13px] text-slate-700 group-focus-within:text-[#00df81]"></i>
                  </div>
                  <input 
                    className="text-[15px] font-bold text-black bg-transparent border-none outline-none flex-1 placeholder-gray-400"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartConsultation()}
                    placeholder="请输入您心仪的酒店"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">入住离店</span>
                    <input 
                      className="text-[13px] font-semibold text-black bg-transparent outline-none w-full"
                      value={dates}
                      onChange={(e) => setDates(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartConsultation()}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-right border-l border-gray-100 pl-4">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">入住人数</span>
                    <input 
                      className="text-[13px] font-semibold text-black bg-transparent outline-none w-full text-right"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartConsultation()}
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-white/60 text-[12px] font-bold tracking-wide text-center animate-shimmer">
                输入酒店回车开启您的奢华旅程
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Chat Flow */
          <div ref={scrollRef} className="flex-1 space-y-4 pb-48">
            {/* Sticky Interactive Context Header */}
            <div className="sticky top-0 z-20 py-1.5 transition-all duration-300">
               {isEditingHeader ? (
                 <div className="bg-white/95 backdrop-blur-3xl border border-white/30 rounded-xl px-4 py-3 shadow-2xl animate-fade-up">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                        <i className="fa-solid fa-location-dot text-[#00df81] text-[12px]"></i>
                        <input 
                          className="text-[13px] font-bold text-black bg-transparent border-none outline-none flex-1"
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                          placeholder="修改酒店名称"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">时间</span>
                          <input 
                            className="text-[11px] font-semibold text-black bg-transparent border-none outline-none"
                            value={dates}
                            onChange={(e) => setDates(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5 text-right border-l border-gray-100 pl-4">
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">人数</span>
                          <input 
                            className="text-[11px] font-semibold text-black bg-transparent border-none outline-none text-right"
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsEditingHeader(false)}
                        className="mt-1 bg-[#00df81] text-black text-[11px] font-bold py-2 rounded-lg shadow-md active:scale-95 transition-transform"
                      >
                        保存修改
                      </button>
                    </div>
                 </div>
               ) : (
                 <button 
                    onClick={() => setIsEditingHeader(true)}
                    className="w-full bg-white/10 backdrop-blur-2xl border border-white/10 rounded-xl px-4 py-2 flex items-center justify-between shadow-lg hover:bg-white/20 transition-all group active:scale-[0.99]"
                 >
                    <div className="flex items-center gap-2 overflow-hidden shrink min-w-0">
                      <i className="fa-solid fa-location-dot text-[#00df81] text-[10px]"></i>
                      <span className="text-[12px] font-bold truncate text-white">{hotelName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/50 font-medium shrink-0 ml-3">
                      <span>{dates}</span>
                      <div className="w-[1px] h-2 bg-white/20"></div>
                      <span>{guests}</span>
                      <i className="fa-solid fa-pencil text-[8px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                 </button>
               )}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-2.5 rounded-[1.25rem] shadow-lg text-[14px] leading-relaxed transition-all whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-white text-black font-semibold' 
                      : 'bg-white/10 backdrop-blur-xl border border-white/10 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-up">
                <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-[1rem] border border-white/5 shadow-inner">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1 h-1 bg-[#00df81] rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-[#00df81] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 bg-[#00df81] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Area - Only visible after started */}
      {isStarted && (
        <div className="relative z-30 px-6 pb-6 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="max-w-md mx-auto flex flex-col gap-3">
            
            {/* Quick Actions - Optimized as horizontal scrollable pills */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 w-full animate-fade-up snap-x px-1">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.query)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-3xl hover:bg-white/20 text-white text-[12px] font-semibold px-4 py-2.5 rounded-full transition-all active:scale-[0.98] border border-white/10 whitespace-nowrap snap-start shadow-md shrink-0"
                >
                  <span className="text-[14px] flex items-center justify-center shrink-0 opacity-90">
                    {action.icon}
                  </span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="w-full flex items-center bg-white/15 backdrop-blur-[40px] rounded-full p-1.5 pl-6 gap-2 border border-white/20 transition-all focus-within:border-[#00df81]/50 focus-within:bg-white/20 shadow-xl">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="咨询关于您的度假方案..." 
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 py-2.5 text-[14px] font-medium"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  inputValue.trim() ? 'bg-[#00df81] text-black scale-100 shadow-[0_0_15px_rgba(0,223,129,0.5)]' : 'bg-white/5 text-white/10 scale-95 opacity-50'
                }`}
              >
                <i className="fa-solid fa-arrow-up text-[15px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
