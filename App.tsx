
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, HotelSearchData, RoomTourVideo } from './types';
import { generateHotelResponse } from './services/geminiService';

const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

interface VideoModalProps {
  video: RoomTourVideo;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + 0.5));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-4xl aspect-video bg-black shadow-2xl overflow-hidden md:rounded-3xl border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="absolute inset-0">
          <img src={video.coverUrl} className={`w-full h-full object-cover transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`} alt="video background" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h3 className="text-[12px] md:text-xl font-bold text-white leading-tight">{video.title}</h3>
          <div className="relative w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-[#12d65e] transition-all duration-75" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"><i className="fa-solid fa-xmark text-sm"></i></button>
      </div>
    </div>
  );
};

interface CalendarProps {
  startDate: string;
  endDate: string;
  onSelect: (start: string, end: string) => void;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ startDate, endDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(startDate));
  const [tempStart, setTempStart] = useState<string | null>(startDate);
  const [tempEnd, setTempEnd] = useState<string | null>(endDate);

  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const startOffset = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const result = [];
    for (let i = startOffset - 1; i >= 0; i--) { result.push({ day: prevMonthDays - i, current: false, date: getLocalDateString(new Date(year, month - 1, prevMonthDays - i)) }); }
    for (let i = 1; i <= days; i++) { result.push({ day: i, current: true, date: getLocalDateString(new Date(year, month, i)) }); }
    while (result.length < 42) { result.push({ day: result.length - days - startOffset + 1, current: false, date: getLocalDateString(new Date(year, month + 1, result.length - days - startOffset + 1)) }); }
    return result;
  }, [viewDate]);

  const nights = tempStart && tempEnd ? Math.ceil((new Date(tempEnd).getTime() - new Date(tempStart).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="p-3 bg-[#f8f9fa] border-b border-gray-100 flex items-center justify-between text-[11px]">
          <div className="font-bold">{tempStart ? new Date(tempStart).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '入住日期'}</div>
          <div className="text-blue-600 font-black">{nights} 晚</div>
          <div className="font-bold">{tempEnd ? new Date(tempEnd).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '离店日期'}</div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-6 h-6"><i className="fa-solid fa-chevron-left text-gray-300 text-xs"></i></button>
            <span className="text-[12px] font-black">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-6 h-6"><i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i></button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (<div key={d} className="text-[8px] font-bold text-gray-300 py-1">{d}</div>))}
            {monthData.map((d, i) => {
              const selected = d.date === tempStart || d.date === tempEnd;
              const inRange = tempStart && tempEnd && new Date(d.date) > new Date(tempStart) && new Date(d.date) < new Date(tempEnd);
              return (
                <button key={i} disabled={!d.current} onClick={() => { if (!tempStart || (tempStart && tempEnd)) { setTempStart(d.date); setTempEnd(null); } else { if (new Date(d.date) < new Date(tempStart)) setTempStart(d.date); else { setTempEnd(d.date); onSelect(tempStart, d.date); } } }} className={`relative h-8 text-[10px] font-bold ${!d.current ? 'text-gray-200' : 'text-gray-700'} ${inRange ? 'bg-blue-50' : ''}`}>
                  <div className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full transition-all ${selected ? 'bg-blue-600 text-white' : ''}`}>{d.day}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-3 bg-gray-50 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-gray-400 font-bold text-[11px]">取消</button>
          <button disabled={!tempEnd} onClick={() => tempStart && tempEnd && (onSelect(tempStart, tempEnd), onClose())} className={`flex-1 py-2 rounded-lg font-bold text-[11px] shadow-sm ${tempEnd ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>确认日期</button>
        </div>
      </div>
    </div>
  );
};

const Logo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#12d65e" />
    <g transform="translate(0, 2)">
      <path d="M21,54 C21,30 44,26 49,42 L51,42 C56,26 79,30 79,54 C79,79 50,85 21,54 Z" fill="none" stroke="black" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="46" r="7.5" fill="black" />
      <circle cx="64" cy="46" r="7.5" fill="black" />
      <path d="M32,64 Q50,77 68,64" fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" />
    </g>
  </svg>
);

const VideoTourList: React.FC<{ videos: RoomTourVideo[]; onPlay: (video: RoomTourVideo) => void }> = ({ videos, onPlay }) => {
  return (
    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
      {videos.map((video) => (
        <div key={video.id} onClick={() => onPlay(video)} className="group bg-white/5 border border-white/10 rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-white/10">
          <div className="aspect-[16/9] relative overflow-hidden">
            <img src={video.coverUrl} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-play text-[#12d65e] text-lg"></i></div>
          </div>
          <div className="p-1.5"><h4 className="text-[9.5px] font-bold text-white line-clamp-1">{video.title}</h4></div>
        </div>
      ))}
    </div>
  );
};

const ComparisonTable: React.FC<{ data: any; onBook: (row: any) => void }> = ({ data, onBook }) => {
  const rows = data.table_rows || [];
  return (
    <div className="mt-2 w-full overflow-x-auto rounded-lg border border-white/5 bg-black/40 no-scrollbar">
      <table className="w-full text-left text-[9px] md:text-[11px] min-w-[420px] border-collapse">
        <thead className="bg-white/5 text-white/20 uppercase font-black text-[7px] tracking-widest">
          <tr><th className="px-2 py-1.5">平台</th><th className="px-2 py-1.5">均价</th><th className="px-2 py-1.5">总计</th><th className="px-2 py-1.5 text-right">预订</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row: any, idx: number) => (
            <tr key={idx} className="hover:bg-white/5 transition-colors">
              <td className="px-2 py-1.5 font-bold text-[#12d65e]">{row.platform}</td>
              <td className="px-2 py-1.5">¥{row.before_tax_price?.toLocaleString()}</td>
              <td className="px-2 py-1.5 font-black text-white">¥{row.total_price?.toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right"><button onClick={() => onBook(row)} className="bg-[#12d65e] text-black text-[8px] font-bold px-2 py-0.5 rounded-full hover:scale-105 transition-all">预订</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RoomTourVideo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [hotelName, setHotelName] = useState('');
  const [startDate, setStartDate] = useState(getLocalDateString(new Date()));
  const [endDate, setEndDate] = useState(getLocalDateString(new Date(Date.now() + 86400000)));
  const [guests, setGuests] = useState('2成人');

  const bgUrl = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600";

  const scrollToTop = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToLatestMessageTop = (messageId: string) => {
    const el = messageRefs.current.get(messageId);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const elementTop = el.offsetTop;
      const stickyHeaderHeight = 54;
      container.scrollTo({
        top: elementTop - stickyHeaderHeight - 8,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (messages.length === 1 && isStarted) {
        setTimeout(scrollToTop, 50);
      } else if (latestMessage.role === 'assistant') {
        setTimeout(() => scrollToLatestMessageTop(latestMessage.id), 100);
      } else {
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages, isStarted]);

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => { setErrorMessage(null); setSuccessMessage(null); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const getFormattedDatesDisplay = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const fmt = (d: Date) => `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
    return `${fmt(start)} - ${fmt(end)} (${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))}晚)`;
  };

  const handleBook = (row: any) => { setSuccessMessage(`正在为您连接 ${row.platform} 专属通道...`); };

  const handlePriceComparison = async () => {
    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: "请查询实时比价。", timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const response = await fetch('https://waypal-agent-backend-266509309806.asia-east1.run.app/agent/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: "u1", params: { hotel_name: hotelName, check_in: startDate, check_out: endDate, adults: 2 }, channel: "web" })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', type: 'comparison', content: `尊贵的宾客，已为您获取到 **${hotelName}** 的全网比价，详情如下：`, comparisonData: data.reply_json, timestamp: Date.now() }]);
    } catch (e) { 
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: "抱歉，由于网络波动，我未能实时获取到价格数据。请您稍后重试。", timestamp: Date.now() }]); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleRoomTour = async () => {
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: `我想看 ${hotelName} 的 Room Tour。`, timestamp: Date.now() }]);
    setIsLoading(true);
    setTimeout(() => {
      const mockVideos: RoomTourVideo[] = [
        { id: '1', title: `${hotelName} 景观套房实地探访`, author: 'Lisa', likes: '1.2k', coverUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400', videoUrl: '' },
        { id: '2', title: `顶级总统套房极简测评`, author: '强哥', likes: '856', coverUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400', videoUrl: '' }
      ];
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', type: 'room-tour', content: `尊贵的宾客，已为您筛选出关于 **${hotelName}** 的实地 Room Tour 内容：`, roomTourVideos: mockVideos, timestamp: Date.now() }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleStartConsultation = (query?: string) => {
    if (!hotelName.trim()) { setErrorMessage("请输入感兴趣的酒店名称"); return; }
    setIsStarted(true);
    setIsEditingHeader(false);
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `尊贵的宾客，午安。我是您的 WayPal 奢华酒店订房助手。\n\n已锁定 **${hotelName}** 信息流：\n📅 **行程**: ${getFormattedDatesDisplay()}\n👥 **人数**: ${guests}\n\n请告知您的特定咨询需求，或点击下方快捷功能。`,
      timestamp: Date.now()
    };
    setMessages([welcomeMsg]);
    if (query) handleSend(query);
  };

  const handleSend = async (forcedQuery?: string) => {
    const text = forcedQuery || inputValue;
    if (!text.trim()) return;
    if (text.includes("全网比价")) { handlePriceComparison(); setInputValue(''); return; }
    if (text.includes("Room Tour")) { handleRoomTour(); setInputValue(''); return; }
    if (!isStarted) { handleStartConsultation(text); setInputValue(''); return; }
    
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() }]);
    setInputValue('');
    setIsLoading(true);
    try {
      const res = await generateHotelResponse(text, { hotelName, dates: getFormattedDatesDisplay(), guests });
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: res.text, groundingChunks: res.groundingChunks, timestamp: Date.now() }]);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const quickActions = [
    { label: "全网比价", icon: <i className="fa-solid fa-magnifying-glass-dollar"></i> },
    { label: "Room Tour", icon: <i className="fa-solid fa-video"></i> },
    { label: "尊享礼遇", icon: <i className="fa-solid fa-gem"></i> }
  ];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center overflow-hidden text-white bg-[#050607]">
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ 
        backgroundImage: `url(${bgUrl})`, 
        filter: isStarted ? 'blur(30px) brightness(0.2)' : 'blur(4px) brightness(0.5)' 
      }} />
      <div className="absolute inset-0 bg-black/50" />
      
      {isCalendarOpen && <Calendar startDate={startDate} endDate={endDate} onSelect={(s, e) => { setStartDate(s); setEndDate(e); }} onClose={() => setIsCalendarOpen(false)} />}
      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}

      <header className="relative z-50 w-full flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => setIsHistoryOpen(true)} className="w-8 h-8 flex items-center justify-center text-white/40"><i className="fa-solid fa-bars-staggered text-md"></i></button>
        <span className="text-[14px] font-black tracking-tighter uppercase opacity-80">WayPal<span className="text-[#00df81]">.ai</span></span>
        <div className="w-6 h-6 rounded-full border border-white/10 overflow-hidden shadow-lg agent-glow"><Logo /></div>
      </header>

      <main className="relative z-10 w-full max-w-xl flex-1 flex flex-col px-3 overflow-hidden">
        {!isStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-up pb-12">
            <h1 className="text-xl md:text-2xl font-black leading-tight tracking-tighter text-center mb-8 drop-shadow-2xl">
              WayPal<br/><span className="text-[#00df81]">奢华酒店订房助手</span>
            </h1>
            <div className="w-full max-w-xs space-y-4">
              <div className="grid grid-cols-3 gap-2">
                 {quickActions.map((a, i) => (
                   <button key={i} onClick={() => handleStartConsultation(a.label)} className="flex flex-col items-center gap-1.5 bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-3 rounded-xl hover:bg-white/[0.08] transition-all">
                     <div className="w-8 h-8 rounded-lg bg-[#00df81]/10 flex items-center justify-center text-[#00df81] text-[11px]">{a.icon}</div>
                     <span className="text-[9.5px] font-bold text-white/60 tracking-wide">{a.label}</span>
                   </button>
                 ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-white/40 mt-1">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-3">
                  <i className="fa-solid fa-magnifying-glass text-[12px] text-gray-300"></i>
                  <input className="text-[13px] font-bold text-black bg-transparent border-none outline-none flex-1 placeholder-gray-200" value={hotelName} onChange={(e) => setHotelName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStartConsultation()} placeholder="输入酒店名称..." autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3" onClick={() => setIsCalendarOpen(true)}>
                  <div className="flex flex-col"><span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">入住日期</span><div className="text-[10px] font-bold text-black">{getFormattedDatesDisplay()}</div></div>
                  <div className="flex flex-col text-right border-l border-gray-50 pl-3"><span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">入住人数</span><div className="text-[10px] font-bold text-black">{guests}</div></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-3.5 py-2 no-scrollbar overflow-y-auto relative">
            <div className="sticky top-0 z-30">
               <button onClick={() => setIsEditingHeader(!isEditingHeader)} className="w-full glass-panel rounded-xl p-2.5 flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-4 h-4 rounded-full bg-[#00df81]/20 flex items-center justify-center shrink-0 border border-[#00df81]/30"><i className="fa-solid fa-location-dot text-[#00df81] text-[8px]"></i></div>
                    <span className="text-[11px] font-bold truncate tracking-tight">{hotelName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8.5px] text-white/30 font-bold shrink-0"><span>{getFormattedDatesDisplay()}</span><i className="fa-solid fa-chevron-down text-[6px]"></i></div>
               </button>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} ref={el => { if (el) messageRefs.current.set(msg.id, el); else messageRefs.current.delete(msg.id); }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                <div className="max-w-[96%]">
                  <div className={`inline-block px-3.5 py-2.5 rounded-2xl text-[11.5px] shadow-xl message-content border ${
                    msg.role === 'user' ? 'bg-[#12d65e] text-black font-bold border-[#12d65e]/20' : 'bg-white/[0.04] backdrop-blur-2xl border-white/10 text-white/90'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    {msg.type === 'comparison' && <ComparisonTable data={msg.comparisonData} onBook={handleBook} />}
                    {msg.type === 'room-tour' && <VideoTourList videos={msg.roomTourVideos || []} onPlay={setSelectedVideo} />}
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1">
                        {msg.groundingChunks.map((c, i) => c.web && (<a key={i} href={c.web.uri} target="_blank" className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-[7.5px] font-bold text-[#12d65e]/80 flex items-center gap-1.5"><i className="fa-solid fa-link text-[6px]"></i><span className="truncate max-w-[90px]">{c.web.title}</span></a>))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start"><div className="bg-white/5 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/5 flex gap-1.5 items-center"><div className="w-1 h-1 bg-[#12d65e] rounded-full animate-bounce"></div><div className="w-1 h-1 bg-[#12d65e] rounded-full animate-bounce delay-75"></div><div className="w-1 h-1 bg-[#12d65e] rounded-full animate-bounce delay-150"></div><span className="text-[8px] font-bold text-white/20 uppercase ml-1">Agent Thinking</span></div></div>
            )}
            <div className="h-44 w-full pointer-events-none" />
          </div>
        )}
      </main>

      {isStarted && (
        <div className="fixed bottom-0 z-40 w-full max-w-xl px-3 pb-4 pt-5 bg-gradient-to-t from-black via-black/40 to-transparent">
          <div className="flex flex-col gap-2.5">
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 animate-fade-up">
              {quickActions.map((a, i) => (
                <button key={i} onClick={() => handleSend(a.label)} className="bg-white/[0.03] backdrop-blur-3xl text-white/70 text-[9.5px] font-bold px-3.5 py-2 rounded-lg border border-white/5 whitespace-nowrap active:bg-white/10 transition-colors"><span className="text-[#12d65e] mr-1.5 opacity-80">{a.icon}</span>{a.label}</button>
              ))}
            </div>
            <div className="w-full flex items-center bg-white/[0.08] backdrop-blur-3xl rounded-full p-1 pl-4.5 gap-2.5 border border-white/10 focus-within:border-[#12d65e]/30 transition-all shadow-2xl">
              <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="咨询奢华房型或会员权益..." className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20 py-2 text-[12.5px] font-medium" />
              <button onClick={() => handleSend()} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${inputValue.trim() ? 'bg-[#12d65e] text-black shadow-lg shadow-[#12d65e]/20' : 'bg-white/5 text-white/5'}`}><i className="fa-solid fa-arrow-up text-[11px]"></i></button>
            </div>
          </div>
        </div>
      )}

      {(errorMessage || successMessage) && (
        <div className="fixed inset-x-0 bottom-20 flex items-center justify-center z-[120] px-6 pointer-events-none">
          <div className={`px-4 py-2.5 rounded-full shadow-2xl animate-fade-up font-black text-[10px] uppercase tracking-wider flex items-center gap-2 border border-white/10 pointer-events-auto ${successMessage ? 'bg-[#12d65e] text-black' : 'bg-[#f04438] text-white'}`}>
            <i className={`fa-solid ${successMessage ? 'fa-check' : 'fa-info'}`}></i>{errorMessage || successMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
