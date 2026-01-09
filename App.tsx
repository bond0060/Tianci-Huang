
import React, { useState, useRef, useEffect } from 'react';
import { Message, HotelSearchData } from './types';
import { generateHotelResponse } from './services/geminiService';

// High-fidelity SVG version of the provided Frog Logo
const Logo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#12d65e" />
    <g transform="translate(0, 2)">
      {/* The main outline of the frog head */}
      <path 
        d="M21,54 
           C21,30 44,26 49,42 
           L51,42 
           C56,26 79,30 79,54 
           C79,79 50,85 21,54 Z" 
        fill="none" 
        stroke="black" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Solid black circular eyes */}
      <circle cx="36" cy="46" r="7.5" fill="black" />
      <circle cx="64" cy="46" r="7.5" fill="black" />
      {/* Cheerful wide smile */}
      <path 
        d="M32,64 Q50,77 68,64" 
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Search state
  const [hotelName, setHotelName] = useState('');
  const [dates, setDates] = useState('09/01 - 12/01 (3晚)');
  const [guests, setGuests] = useState('2成人');

  // Mock history data
  const [historyItems] = useState([
    "奢华酒店比价与预订建议",
    "上海文华东方酒店价格查询",
    "WayPal 定位分析与融合建议",
    "曼谷嘉佩乐房型深度对比",
    "三亚柏悦酒店亲子套房预定",
    "京都安缦下午茶预约咨询",
    "关于酒店权益 FHR 的详细解释"
  ]);

  const bgUrl = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStarted]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleStartConsultation = (initialQuery?: string) => {
    if (!hotelName.trim()) {
      setErrorMessage("请先告诉我你想问的酒店名称");
      return;
    }
    setIsStarted(true);
    setIsEditingHeader(false);
    
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是您的 WayPal 奢华酒店订房管家。\n\n我已经为您锁定了 **${hotelName}** 的相关信息：\n📅 **${dates}**\n👥 **${guests}**\n\n您可以点击下方的快捷指令开始探索，或者直接告诉我您的特殊需求（如：景观要求、特定权益等）。`,
      timestamp: Date.now()
    };
    
    if (initialQuery) {
      setMessages([welcomeMsg]);
      handleSend(initialQuery);
    } else {
      setMessages([welcomeMsg]);
    }
  };

  const handleNewConsultation = () => {
    setIsStarted(false);
    setMessages([]);
    setHotelName('');
    setIsHistoryOpen(false);
  };

  const handleSend = async (forcedQuery?: string) => {
    const queryText = forcedQuery || inputValue;
    if (!queryText.trim()) return;
    
    if (!isStarted) {
      if (!hotelName.trim()) {
        setErrorMessage("请先告诉我你想问的酒店名称");
        return;
      }
      handleStartConsultation(queryText);
      setInputValue('');
      return;
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
      icon: <i className="fa-solid fa-magnifying-glass-dollar"></i>,
      query: "请帮我查询全平台的实时价格对比。请涵盖官方渠道、主要OTA平台（如携程、Booking）以及高端旅行社礼遇（如FHR、Virtuoso等），并给出最划算的预定建议。" 
    },
    { 
      label: "Room Tour", 
      icon: <i className="fa-solid fa-video"></i>,
      query: "请带我进行一次该酒店的 Room Tour。请详细描述最顶级房型的设计美学、窗外景观、以及那些普通酒店没有的奢华细节设施。请以第一人称视角描述，就像我正站在这间房里一样。" 
    },
    { 
      label: "价格趋势", 
      icon: <i className="fa-solid fa-chart-line"></i>,
      query: "请分析该酒店在接下来的价格趋势。哪段时间入住最划算？有没有明显的淡旺季价格波动？" 
    }
  ];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center overflow-hidden text-white font-['Noto_Sans_SC'] bg-black">
      {/* Background with responsive coverage */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ 
          backgroundImage: `url(${bgUrl})`,
          filter: isStarted ? 'blur(20px) brightness(0.2)' : 'blur(8px) brightness(0.3)'
        }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* History Sidebar */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsHistoryOpen(false)}
      />
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-[70] w-[85%] max-w-[360px] bg-[#f8f9fa] text-black transition-transform duration-500 ease-in-out shadow-2xl flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <Logo />
              </div>
              <span className="text-xl font-bold tracking-tight">WayPal.ai</span>
            </div>
            <button onClick={() => setIsHistoryOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all">
              <i className="fa-solid fa-xmark text-[20px]"></i>
            </button>
          </div>
          <div className="relative group">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#12d65e] transition-colors"></i>
            <input type="text" placeholder="搜索对话记录..." className="w-full bg-white rounded-2xl py-3.5 pl-11 pr-4 outline-none text-[14px] font-medium border border-gray-200 focus:border-[#12d65e] transition-all" />
          </div>
          <button onClick={handleNewConsultation} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-[#12d65e]/10 transition-all overflow-hidden">
                <Logo />
              </div>
              <span className="text-[16px] font-bold text-gray-800">发起新咨询</span>
            </div>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 no-scrollbar">
          <p className="px-2 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">最近对话</p>
          {historyItems.map((item, index) => (
            <button key={index} className="w-full text-left px-4 py-4 rounded-xl text-[14px] font-medium text-gray-600 hover:bg-gray-100 transition-all truncate border border-transparent" onClick={() => setIsHistoryOpen(false)}>
              {item}
            </button>
          ))}
        </div>
      </aside>

      {/* Profile Modal - UPDATED HIGH-FIDELITY DESIGN */}
      <div 
        className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-md transition-opacity duration-300 flex items-center justify-center p-0 md:p-4 ${isLoginOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsLoginOpen(false)}
      >
        <div 
          className={`w-full max-w-[560px] h-full md:h-[90vh] bg-[#f0f4f9] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl transform transition-all duration-500 ease-out flex flex-col ${isLoginOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 md:p-8 pb-4 flex justify-between items-start bg-[#f0f4f9] z-10">
             <div className="flex flex-col">
               <span className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Account</span>
               <span className="text-[14px] md:text-[16px] text-gray-800 font-bold">bond0060@gmail.com</span>
             </div>
             <button onClick={() => setIsLoginOpen(false)} className="bg-[#e2e8f0] text-gray-800 text-[13px] font-bold px-5 py-2 hover:bg-gray-300 rounded-xl shadow-sm transition-all">完成</button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-10">
            {/* Centered Profile Section */}
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] overflow-hidden border-[4px] border-white shadow-2xl">
                <Logo />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Tianci，下午好！</h2>
            </div>

            {/* Stay Stats Section - MATCHING SCREENSHOT */}
            <div className="bg-white rounded-[3rem] p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden group border border-white">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Stay Stats</h3>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"><i className="fa-solid fa-ellipsis"></i></button>
                  <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"><i className="fa-solid fa-expand text-[13px]"></i></button>
                </div>
              </div>
              
              {/* Map Illustration Area */}
              <div className="w-full aspect-[16/10] bg-[#f8f9fb] rounded-[2.5rem] relative overflow-hidden border border-gray-100/50">
                <div className="absolute inset-0 p-8 opacity-80">
                  <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100,100 C150,80 250,90 300,150 C320,180 300,250 250,300 C200,320 150,350 100,340 Z" fill="#E5E7EB" />
                    <path d="M450,80 C550,60 600,100 620,150 C630,200 600,250 550,280 C500,300 450,320 450,280 Z" fill="#E5E7EB" />
                    <path d="M600,180 C700,160 850,150 900,250 C920,300 850,400 750,420 C650,440 600,350 600,250 Z" fill="#E5E7EB" />
                    {[
                      {x: 180, y: 150}, {x: 230, y: 190}, {x: 210, y: 220}, {x: 270, y: 180},
                      {x: 480, y: 120}, {x: 520, y: 140}, {x: 500, y: 180}, {x: 470, y: 220},
                      {x: 750, y: 250}, {x: 780, y: 280}, {x: 820, y: 260}, {x: 730, y: 320},
                      {x: 500, y: 350}, {x: 780, y: 430}
                    ].map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="8" fill="#007AFF" stroke="white" strokeWidth="2" />
                    ))}
                  </svg>
                </div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-gray-800 hover:scale-110 transition-all">
                  <i className="fa-solid fa-arrow-up-from-bracket text-[16px]"></i>
                </button>
              </div>

              {/* Stats Labels */}
              <div className="flex items-center justify-between px-3 pt-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <i className="fa-solid fa-hotel text-blue-500"></i> Hotels
                  </div>
                  <span className="text-[38px] font-black text-gray-900 tracking-tighter">41</span>
                </div>
                <div className="flex flex-col gap-1 pr-12">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <i className="fa-solid fa-earth-americas text-blue-500"></i> Countries
                  </div>
                  <span className="text-[38px] font-black text-gray-900 tracking-tighter">19</span>
                </div>
              </div>

              {/* Flags Strip */}
              <div className="flex items-center gap-2.5 pt-2 flex-wrap px-1">
                {['🇨🇳', '🇨🇦', '🇭🇰', '🇲🇴', '🇹🇭', '🇯🇵', '🇸🇬', '🇫🇷', '🇮🇹', '🇬🇧', '🇺🇸'].map((flag, i) => (
                  <div key={i} className="text-[26px] hover:scale-125 transition-transform cursor-pointer drop-shadow-sm">{flag}</div>
                ))}
                <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl uppercase tracking-widest ml-auto hover:bg-blue-100 transition-colors">
                  +9 More
                </button>
              </div>
            </div>

            {/* Memberships & Billing */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-2">Memberships & Billing</h3>
              <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-white divide-y divide-gray-50">
                {[
                  { brand: "Marriott Bonvoy", level: "Titanium Elite", icon: "M" },
                  { brand: "Hilton Honors", level: "Diamond", icon: "H" },
                  { brand: "IHG Rewards", level: "Diamond Select", icon: "I" }
                ].map((item, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all text-left">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-300 border border-gray-100 text-[20px]">{item.icon}</div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-gray-900">{item.brand}</span>
                        <span className="text-[12px] font-bold text-blue-700 uppercase tracking-tight">{item.level}</span>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[12px] text-gray-300"></i>
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full bg-red-50 text-red-600 font-bold py-6 rounded-[3rem] hover:bg-red-100 transition-all shadow-sm">退出当前账号</button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20 w-full max-w-7xl flex items-center justify-between px-5 md:px-8 py-6 md:py-14">
        <button onClick={() => setIsHistoryOpen(true)} className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white rounded-xl transition-all">
          <i className="fa-solid fa-bars text-[20px]"></i>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <span className="text-xl md:text-2xl font-black tracking-[-0.04em] text-white">
            WayPal<span className="text-[#00df81]">.ai</span>
          </span>
        </div>
        <button onClick={() => setIsLoginOpen(true)} className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-2xl border-[2px] border-white/20 transition-all">
          <Logo />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-4xl flex-1 flex flex-col px-4 md:px-10 overflow-hidden">
        {!isStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 animate-fade-up">
            <div className="text-center space-y-3 mb-10 md:mb-16">
              <h1 className="text-3xl md:text-6xl font-black leading-relaxed md:leading-[1.6] tracking-tighter text-white drop-shadow-2xl">
                你好，WayPal是<br/>
                <span className="text-[#00df81]">奢华酒店订房助手</span>
              </h1>
            </div>

            <div className="w-full max-w-xl space-y-6 flex flex-col items-center">
              {/* Home Quick Actions */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 w-full animate-fade-up">
                 {quickActions.map((action, idx) => (
                   <button 
                     key={idx}
                     onClick={() => handleStartConsultation(action.query)}
                     className="flex flex-col items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] hover:bg-white/15 transition-all group"
                   >
                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#00df81]/10 flex items-center justify-center text-[#00df81] text-lg md:text-xl group-hover:bg-[#00df81] group-hover:text-black transition-all">
                        {action.icon}
                     </div>
                     <span className="text-[10px] md:text-[14px] font-bold text-white transition-colors">{action.label}</span>
                   </button>
                 ))}
              </div>

              {/* Main Search Box */}
              <div className="w-full bg-white/95 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-white transition-all group mt-2">
                <div className="flex items-center gap-4 md:gap-6 border-b-2 border-gray-50 pb-6 md:pb-8 mb-6 md:mb-8">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-[#00df81]/10 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-hotel text-lg md:text-[22px] text-[#00df81]"></i>
                  </div>
                  <input 
                    className="text-lg md:text-2xl font-bold text-black bg-transparent border-none outline-none flex-1 placeholder-gray-300"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartConsultation()}
                    placeholder="请输入酒店名称"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] md:text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">CHECK-IN / OUT</span>
                    <input className="text-[13px] md:text-[16px] font-bold text-black bg-transparent outline-none w-full" value={dates} onChange={(e) => setDates(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1 text-right border-l-2 border-gray-50 pl-4">
                    <span className="text-[9px] md:text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">GUESTS</span>
                    <input className="text-[13px] md:text-[16px] font-bold text-black bg-transparent outline-none w-full text-right" value={guests} onChange={(e) => setGuests(e.target.value)} />
                  </div>
                </div>
              </div>
              <p className="text-white/30 text-[10px] md:text-[12px] font-black tracking-[0.2em] uppercase text-center mt-2 animate-shimmer">
                ENTER TO EXPLORE YOUR NEXT DESTINATION
              </p>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-6 md:space-y-8 py-6 md:py-10 no-scrollbar overflow-y-auto pb-48">
            <div className="sticky top-0 z-20 py-2">
               {isEditingHeader ? (
                 <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-fade-up">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-3">
                        <i className="fa-solid fa-location-dot text-[#00df81]"></i>
                        <input className="text-lg font-bold text-black bg-transparent border-none outline-none flex-1" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="修改酒店名称" autoFocus />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 font-black uppercase">入住周期</span>
                          <input className="text-[12px] font-bold text-black bg-transparent outline-none" value={dates} onChange={(e) => setDates(e.target.value)} />
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-gray-400 font-black uppercase">预订人数</span>
                          <input className="text-[12px] font-bold text-black bg-transparent outline-none text-right" value={guests} onChange={(e) => setGuests(e.target.value)} />
                        </div>
                      </div>
                      <button onClick={() => setIsEditingHeader(false)} className="bg-black text-white font-bold py-3 rounded-xl shadow-lg">保存修改</button>
                    </div>
                 </div>
               ) : (
                 <button onClick={() => setIsEditingHeader(true)} className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl p-4 flex items-center justify-between shadow-2xl transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-[#00df81] flex items-center justify-center text-black shrink-0">
                        <i className="fa-solid fa-location-dot text-[14px]"></i>
                      </div>
                      <span className="text-[16px] font-bold truncate text-white">{hotelName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-white/60 font-bold shrink-0">
                      <span>{guests}</span>
                      <i className="fa-solid fa-pencil text-[10px]"></i>
                    </div>
                 </button>
               )}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-5 py-3.5 md:px-8 md:py-5 rounded-2xl md:rounded-[2.5rem] shadow-2xl text-[14px] md:text-[16px] leading-relaxed transition-all whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-[#00df81] text-black font-bold' : 'bg-white/10 backdrop-blur-2xl border border-white/10 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-up">
                <div className="bg-white/10 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10">
                  <div className="flex gap-2 items-center">
                    <div className="w-1.5 h-1.5 bg-[#00df81] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#00df81] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#00df81] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {isStarted && (
        <div className="fixed bottom-0 z-30 w-full max-w-4xl px-4 md:px-6 pb-6 md:pb-10 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="flex flex-col gap-4">
            <div className="flex overflow-x-auto no-scrollbar gap-2 animate-fade-up snap-x">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => handleSend(action.query)} className="flex items-center gap-2 bg-white/10 backdrop-blur-3xl text-white text-[12px] font-bold px-5 py-3 rounded-xl border border-white/10 whitespace-nowrap transition-all">
                  <span className="text-[#00df81]">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
            <div className="w-full flex items-center bg-white/15 backdrop-blur-[40px] rounded-[2.5rem] p-2 pl-6 gap-3 border border-white/20 transition-all focus-within:border-[#00df81]/50 shadow-2xl">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="咨询您的奢华度假方案..." 
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 py-3 text-[14px] md:text-[16px] font-medium"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  inputValue.trim() ? 'bg-[#00df81] text-black shadow-[0_0_20px_rgba(0,223,129,0.4)]' : 'bg-white/5 text-white/10 scale-95 opacity-50'
                }`}
              >
                <i className="fa-solid fa-arrow-up text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed inset-x-0 bottom-24 flex items-center justify-center pointer-events-none z-[100] px-6">
          <div className="bg-[#f04438] text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-up font-bold text-[14px] flex items-center gap-3 pointer-events-auto border border-white/10">
            <i className="fa-solid fa-circle-exclamation"></i>
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
