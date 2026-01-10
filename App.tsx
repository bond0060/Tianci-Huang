
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, HotelSearchData, RoomTourVideo } from './types';
import { generateHotelResponse } from './services/geminiService';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// --- Video Modal Component ---
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
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying && (
              <button onClick={() => setIsPlaying(true)} className="w-16 h-16 bg-[#12d65e] rounded-full flex items-center justify-center text-black text-xl shadow-2xl scale-110 transition-transform active:scale-95">
                <i className="fa-solid fa-play ml-1"></i>
              </button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 space-y-3">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-[#12d65e] uppercase tracking-widest">正在播放 Room Tour</span>
              <h3 className="text-md md:text-2xl font-bold text-white max-w-xl leading-tight">{video.title}</h3>
              <p className="text-[11px] text-white/60 font-medium">@{video.author} · {video.likes} 赞</p>
            </div>
            <div className="flex gap-4 items-center">
              <button className="text-white/80 hover:text-white transition-colors"><i className="fa-solid fa-share-nodes text-lg"></i></button>
              <button className="text-white/80 hover:text-white transition-colors"><i className="fa-solid fa-heart text-lg"></i></button>
            </div>
          </div>
          <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-[#12d65e] transition-all duration-75" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-[#12d65e] transition-colors">
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-md`}></i>
              </button>
              <span>0:{(Math.floor(progress / 3)).toString().padStart(2, '0')} / 0:30</span>
            </div>
            <div className="flex items-center gap-4">
              <i className="fa-solid fa-volume-high"></i>
              <i className="fa-solid fa-expand"></i>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
    </div>
  );
};

// --- Custom Calendar Component ---
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

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const prevMonthDays = daysInMonth(year, month - 1);
    
    const result = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, current: false, date: getLocalDateString(new Date(year, month - 1, prevMonthDays - i)) });
    }
    for (let i = 1; i <= days; i++) {
      result.push({ day: i, current: true, date: getLocalDateString(new Date(year, month, i)) });
    }
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: i, current: false, date: getLocalDateString(new Date(year, month + 1, i)) });
    }
    return result;
  }, [viewDate]);

  const handleDateClick = (date: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else {
      if (new Date(date) < new Date(tempStart)) {
        setTempStart(date);
      } else {
        setTempEnd(date);
        onSelect(tempStart, date);
      }
    }
  };

  const isSelected = (date: string) => date === tempStart || date === tempEnd;
  const isInRange = (date: string) => tempStart && tempEnd && new Date(date) > new Date(tempStart) && new Date(date) < new Date(tempEnd);
  const nights = tempStart && tempEnd ? Math.ceil((new Date(tempEnd).getTime() - new Date(tempStart).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-[#f8f9fa] border-b border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">入住日期</span>
            <div className={`text-md font-bold ${tempStart ? 'text-black' : 'text-gray-300'}`}>
              {tempStart ? new Date(tempStart).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }) : '选择日期'}
            </div>
          </div>
          <div className="text-gray-200 text-xl font-light">|</div>
          <div className="text-center">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{nights} 晚</span>
          </div>
          <div className="text-gray-200 text-xl font-light">|</div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">离店日期</span>
            <div className={`text-md font-bold ${tempEnd ? 'text-black' : 'text-gray-300'}`}>
              {tempEnd ? new Date(tempEnd).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }) : '选择日期'}
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all">
              <i className="fa-solid fa-chevron-left text-gray-400 text-sm"></i>
            </button>
            <span className="text-md font-black text-gray-900">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all">
              <i className="fa-solid fa-chevron-right text-gray-400 text-sm"></i>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-gray-400 py-2">{day}</div>
            ))}
            {monthData.map((d, i) => {
              const selected = isSelected(d.date);
              const inRange = isInRange(d.date);
              const isStart = d.date === tempStart;
              const isEnd = d.date === tempEnd;
              return (
                <button
                  key={i}
                  disabled={!d.current}
                  onClick={() => handleDateClick(d.date)}
                  className={`relative h-10 flex items-center justify-center text-[13px] font-bold transition-all
                    ${!d.current ? 'text-gray-200' : 'text-gray-700 hover:text-blue-600'}
                    ${inRange ? 'bg-blue-50' : ''}
                    ${isStart && tempEnd ? 'rounded-l-full bg-blue-50' : ''}
                    ${isEnd ? 'rounded-r-full bg-blue-50' : ''}
                  `}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all relative z-10
                    ${selected ? 'bg-blue-600 text-white shadow-md' : ''}
                  `}>
                    {d.day}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-5 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all text-sm">取消</button>
          <button 
            disabled={!tempEnd}
            onClick={() => tempStart && tempEnd && (onSelect(tempStart, tempEnd), onClose())} 
            className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-all text-sm ${tempEnd ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            确认日期
          </button>
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
    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
      {videos.map((video) => (
        <div 
          key={video.id} 
          onClick={() => onPlay(video)}
          className="group relative flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="aspect-[16/9] md:aspect-[3/4] overflow-hidden relative">
            <img src={video.coverUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-[#12d65e]">
              <i className="fa-solid fa-heart mr-1"></i> {video.likes}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 bg-[#12d65e] rounded-full flex items-center justify-center text-black">
                <i className="fa-solid fa-play ml-0.5 text-sm"></i>
              </div>
            </div>
          </div>
          <div className="p-2.5 space-y-0.5">
            <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-snug">{video.title}</h4>
            <p className="text-[9px] text-white/50 font-medium">@{video.author}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const ComparisonTable: React.FC<{ data: any; onBook: (row: any) => void }> = ({ data, onBook }) => {
  const rows = data.table_rows || [];
  const translateCancellation = (text: string) => {
    if (!text) return '详情咨询';
    if (text === 'Free Cancellation') return '免费取消';
    if (text === 'Non-refundable') return '不可退款';
    return text;
  };

  return (
    <div className="mt-3 w-full overflow-x-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-md scroll-smooth no-scrollbar">
      <table className="w-full text-left text-[11px] md:text-[13px] min-w-[550px] md:min-w-full border-collapse">
        <thead className="bg-white/5 text-white/40 uppercase font-black tracking-widest text-[9px]">
          <tr>
            <th className="px-3 py-3">预订平台</th>
            <th className="px-3 py-3">单晚均价</th>
            <th className="px-3 py-3">总计费用</th>
            <th className="px-3 py-3">取消政策</th>
            <th className="px-3 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row: any, idx: number) => (
            <tr key={idx} className="hover:bg-white/5 transition-colors group">
              <td className="px-3 py-4 font-bold text-[#12d65e]">{row.platform}</td>
              <td className="px-3 py-4 text-white font-medium">¥{row.before_tax_price?.toLocaleString()}</td>
              <td className="px-3 py-4 font-black text-white">¥{row.total_price?.toLocaleString()}</td>
              <td className="px-3 py-4">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${row.cancellation_main === 'Free Cancellation' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {translateCancellation(row.cancellation_main)}
                </span>
              </td>
              <td className="px-3 py-4 text-right">
                <button 
                  onClick={() => onBook(row)}
                  className="bg-[#12d65e] text-black text-[10px] md:text-[11px] font-black px-3 py-1.5 rounded-full shadow-md shadow-[#12d65e]/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  预订
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 0 && rows[0].perks && (
        <div className="p-3 bg-white/5 border-t border-white/5">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">尊享礼遇包含</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(rows[0].perks).map(([key, value]: [string, any], i: number) => (
              <span key={i} className="bg-[#12d65e]/10 text-[#12d65e] text-[10px] font-bold px-2 py-0.5 rounded-lg" title={String(value)}>
                <i className="fa-solid fa-star text-[8px] mr-1"></i>
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RoomTourVideo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [hotelName, setHotelName] = useState('');
  const [startDate, setStartDate] = useState(getLocalDateString(new Date()));
  const [endDate, setEndDate] = useState(getLocalDateString(new Date(Date.now() + 86400000)));
  const [guests, setGuests] = useState('2成人');
  const [historyItems] = useState<string[]>([]);

  const bgUrl = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600";

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset scroll to top when consultation starts to show first message from its beginning
  useEffect(() => {
    if (isStarted && messages.length > 0) {
      scrollToTop();
    }
  }, [isStarted]);

  useEffect(() => {
    if (messages.length > 1 || isLoading) {
      const timeout = setTimeout(() => scrollToBottom(), 150);
      return () => clearTimeout(timeout);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const getFormattedDatesDisplay = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const fmt = (d: Date) => `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
    return `${fmt(start)} - ${fmt(end)} (${nights > 0 ? nights : 1}晚)`;
  };

  const translateSummary = (text: string) => {
    if (!text) return "";
    if (text.includes("Result generated from cached offers")) return "根据系统缓存，为您匹配到当前最优参考方案。 ✅";
    return text;
  };

  const handleBook = (row: any) => {
    setSuccessMessage(`正在为您连接 ${row.platform} 专属通道... 礼遇已锁定。`);
  };

  const generateComparisonText = (json: any, queryName: string) => {
    const { hotel_name, checkin_date, checkout_date, nights, summary_text } = json;
    let result = "";
    if (hotel_name && hotel_name !== queryName) {
      result += `管家注意到您关注的是 **${queryName}**，但目前实时数据正在更新中。\n\n为了不耽误您的行程规划，我先展示了同级别的 **${hotel_name}** 作为参考。如有需要，我可以为您手动发起深度询价：\n\n`;
    } else {
      result += `已为您备妥 **${hotel_name}** 的全平台比价详情，供您审阅：\n\n`;
    }
    result += `📅 **入住周期**: ${checkin_date} 至 ${checkout_date} (${nights}晚)\n`;
    result += `👥 **入住人数**: ${json.guests}人\n`;
    if (summary_text) result += `\n📝 **管家提示**: ${translateSummary(summary_text)}`;
    return result;
  };

  const handlePriceComparison = async () => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: "请帮我查询全平台的实时价格对比。", timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    const currentQueryName = hotelName;
    const adultsMatch = guests.match(/(\d+)/);
    const adults = adultsMatch ? parseInt(adultsMatch[1]) : 2;
    const payload = {
      user_id: "test_user_001",
      params: { destination: currentQueryName.includes("上海") ? "上海" : "未知", hotel_name: currentQueryName, check_in: startDate, check_out: endDate, room_count: 1, adults, children: 0, additional_notes: "无其他要求" },
      channel: "web"
    };
    setIsLoading(true);
    try {
      const response = await fetch('https://waypal-agent-backend-266509309806.asia-east1.run.app/agent/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', type: 'comparison', content: generateComparisonText(data.reply_json, currentQueryName), comparisonData: data.reply_json, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "管家繁忙，请重试或咨询其他问题。", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomTour = async () => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `请查找 ${hotelName} 的 Room Tour 视频。`, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setTimeout(() => {
      const mockVideos: RoomTourVideo[] = [
        { id: 'xhs-1', title: `顶级视野！${hotelName} 景观套房深度测评...`, author: '奢华酒店控Lisa', likes: '1.2k', coverUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600', videoUrl: '' },
        { id: 'xhs-2', title: `总统套房 Room Tour 全记录`, author: '酒店试睡员阿强', likes: '856', coverUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600', videoUrl: '' },
        { id: 'xhs-3', title: `${hotelName} 必住理由：开箱最美下午茶`, author: 'Vicky在旅行', likes: '643', coverUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600', videoUrl: '' }
      ];
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', type: 'room-tour', content: `尊贵的宾客，已为您精选了 **${hotelName}** 最具人气的三段 Room Tour 视频预览：`, roomTourVideos: mockVideos, timestamp: Date.now() }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleStartConsultation = (initialQuery?: string, isComparison?: boolean) => {
    if (!hotelName.trim()) {
      setErrorMessage("请输入感兴趣的酒店名称");
      return;
    }
    setIsStarted(true);
    setIsEditingHeader(false);
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `尊贵的宾客，午安。我是您的 WayPal 奢华酒店私人管家。\n\n已锁定 **${hotelName}** 咨询通道：\n\n📅 **预计行程**: ${getFormattedDatesDisplay()}\n👥 **同行人数**: ${guests}\n\n您可以点击快捷指令获取比价、探索实景，或直接输入个性化需求。`,
      timestamp: Date.now()
    };
    setMessages([welcomeMsg]);
    if (isComparison) handlePriceComparison();
    else if (initialQuery) handleSend(initialQuery);
  };

  const handleSend = async (forcedQuery?: string) => {
    const queryText = forcedQuery || inputValue;
    if (!queryText.trim()) return;
    if (queryText.includes("全平台比价")) { handlePriceComparison(); setInputValue(''); return; }
    if (queryText.includes("Room Tour")) { handleRoomTour(); setInputValue(''); return; }
    if (!isStarted) { handleStartConsultation(queryText); setInputValue(''); return; }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: queryText, timestamp: Date.now(), hotelInfo: { hotelName, dates: getFormattedDatesDisplay(), guests } };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    try {
      const response = await generateHotelResponse(queryText, { hotelName, dates: getFormattedDatesDisplay(), guests });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response.text, groundingChunks: response.groundingChunks, timestamp: Date.now() }]);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const quickActions = [
    { label: "全网比价", icon: <i className="fa-solid fa-magnifying-glass-dollar"></i>, isSpecial: true },
    { label: "Room Tour", icon: <i className="fa-solid fa-video"></i>, query: "请查找该酒店的 Room Tour。" },
    { label: "价格趋势", icon: <i className="fa-solid fa-chart-line"></i>, query: "请分析价格趋势。" }
  ];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center overflow-hidden text-white bg-[#0b0d0f]">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105" style={{ 
        backgroundImage: `url(${bgUrl})`, 
        filter: isStarted ? 'blur(25px) brightness(0.3)' : 'blur(6px) brightness(0.6)' 
      }} />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      
      {isCalendarOpen && <Calendar startDate={startDate} endDate={endDate} onSelect={(s, e) => { setStartDate(s); setEndDate(e); }} onClose={() => setIsCalendarOpen(false)} />}
      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}

      <header className="relative z-50 w-full max-w-7xl flex items-center justify-between px-4 md:px-8 py-4 md:py-10 shrink-0">
        <button onClick={() => setIsHistoryOpen(true)} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white rounded-xl transition-all"><i className="fa-solid fa-bars text-lg"></i></button>
        <div className="absolute left-1/2 -translate-x-1/2 text-center"><span className="text-lg md:text-2xl font-black tracking-tighter text-white">WayPal<span className="text-[#00df81]">.ai</span></span></div>
        <button onClick={() => setIsLoginOpen(true)} className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden border-[1.5px] border-white/20 transition-all"><Logo /></button>
      </header>

      <main className="relative z-10 w-full max-w-4xl flex-1 flex flex-col px-3 md:px-10 overflow-hidden">
        {!isStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center py-4 animate-fade-up">
            <h1 className="text-2xl md:text-5xl font-black leading-tight tracking-tighter text-white drop-shadow-2xl text-center mb-8">
              午安，WayPal是<br/><span className="text-[#00df81]">奢华酒店私人管家</span>
            </h1>
            <div className="w-full max-w-lg space-y-4">
              <div className="grid grid-cols-3 gap-2 w-full">
                 {quickActions.map((action, idx) => (
                   <button key={idx} onClick={() => action.isSpecial ? handleStartConsultation(undefined, true) : (action.label === "Room Tour" ? handleRoomTour() : handleSend(action.query))} className="flex flex-col items-center gap-1.5 bg-white/5 backdrop-blur-3xl border border-white/10 p-3.5 rounded-2xl hover:bg-white/10 transition-all group">
                     <div className="w-9 h-9 rounded-xl bg-[#00df81]/10 flex items-center justify-center text-[#00df81] text-md group-hover:bg-[#00df81] group-hover:text-black transition-all">{action.icon}</div>
                     <span className="text-[10px] md:text-[12px] font-bold text-white/90">{action.label}</span>
                   </button>
                 ))}
              </div>
              <div className="bg-white/95 rounded-[1.75rem] p-5 md:p-8 shadow-2xl border border-white mt-2">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                  <i className="fa-solid fa-hotel text-md text-[#00df81]"></i>
                  <input className="text-md md:text-xl font-bold text-black bg-transparent border-none outline-none flex-1 placeholder-gray-300" value={hotelName} onChange={(e) => setHotelName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStartConsultation()} placeholder="输入酒店名称..." autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4 cursor-pointer" onClick={() => setIsCalendarOpen(true)}>
                  <div className="flex flex-col gap-0.5"><span className="text-[8px] text-gray-400 font-black uppercase">日期</span><div className="text-[12px] font-bold text-black">{getFormattedDatesDisplay()}</div></div>
                  <div className="flex flex-col gap-0.5 text-right border-l border-gray-100 pl-4"><span className="text-[8px] text-gray-400 font-black uppercase">人数</span><div className="text-[12px] font-bold text-black">{guests}</div></div>
                </div>
              </div>
              <p className="text-white/20 text-[9px] font-black tracking-widest uppercase text-center mt-2 animate-shimmer">回车开始您的非凡旅程</p>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-4 md:space-y-6 py-4 md:py-8 no-scrollbar overflow-y-auto relative">
            <div className="sticky top-0 z-30 pb-2">
               <button onClick={() => setIsEditingHeader(!isEditingHeader)} className="w-full bg-white/15 backdrop-blur-3xl border border-white/20 rounded-xl p-2.5 px-3.5 flex items-center justify-between shadow-xl transition-all">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-[#00df81] flex items-center justify-center text-black shrink-0"><i className="fa-solid fa-location-dot text-[11px]"></i></div>
                    <span className="text-[13px] font-black truncate text-white">{hotelName}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-white/50 font-bold shrink-0"><span>{getFormattedDatesDisplay()}</span><i className="fa-solid fa-chevron-down text-[8px]"></i></div>
               </button>
               {isEditingHeader && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 animate-fade-up z-50">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 border-b border-gray-50 pb-2">
                        <i className="fa-solid fa-location-dot text-[#00df81] text-sm"></i>
                        <input className="text-sm font-bold text-black bg-transparent border-none outline-none flex-1" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="修改酒店" autoFocus />
                      </div>
                      <div className="grid grid-cols-2 gap-3" onClick={() => setIsCalendarOpen(true)}>
                        <div className="flex flex-col"><span className="text-[8px] text-gray-400 font-bold">日期</span><div className="text-[11px] font-bold text-black">{getFormattedDatesDisplay()}</div></div>
                        <div className="flex flex-col text-right"><span className="text-[8px] text-gray-400 font-bold">人数</span><div className="text-[11px] font-bold text-black">{guests}</div></div>
                      </div>
                      <button onClick={() => setIsEditingHeader(false)} className="bg-black text-white font-bold py-2.5 rounded-xl text-xs">保存更新</button>
                    </div>
                 </div>
               )}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                <div className={`max-w-[92%] md:max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-3 md:px-7 md:py-5 rounded-xl md:rounded-3xl shadow-xl text-[13px] md:text-[15px] transition-all text-left message-content ${
                    msg.role === 'user' ? 'bg-[#12d65e] text-black font-bold' : 'bg-white/[0.08] backdrop-blur-3xl border border-white/10 text-white'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content.split('\n\n').map((para, i) => <p key={i} className="mb-3 last:mb-0 text-left">{para}</p>)}</div>
                    {msg.type === 'comparison' && msg.comparisonData && <ComparisonTable data={msg.comparisonData} onBook={handleBook} />}
                    {msg.type === 'room-tour' && msg.roomTourVideos && <VideoTourList videos={msg.roomTourVideos} onPlay={(v) => setSelectedVideo(v)} />}
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">参考来源</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.groundingChunks.map((chunk, idx) => chunk.web && (
                            <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-[#12d65e] flex items-center gap-1.5">
                              <i className="fa-solid fa-link text-[8px]"></i>
                              <span className="truncate max-w-[120px]">{chunk.web.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-up">
                <div className="bg-white/10 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/10">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1 h-1 bg-[#12d65e] rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-[#12d65e] rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 h-1 bg-[#12d65e] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-[200px] w-full pointer-events-none shrink-0" />
          </div>
        )}
      </main>

      {isStarted && (
        <div className="fixed bottom-0 z-40 w-full max-w-4xl px-3 md:px-6 pb-5 md:pb-8 pt-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent shrink-0">
          <div className="flex flex-col gap-3">
            <div className="flex overflow-x-auto no-scrollbar gap-2 animate-fade-up snap-x">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => action.isSpecial ? handlePriceComparison() : (action.label === "Room Tour" ? handleRoomTour() : handleSend(action.query))} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-3xl text-white text-[11px] font-bold px-4 py-2.5 rounded-xl border border-white/10 whitespace-nowrap hover:bg-white/20 transition-all">
                  <span className="text-[#12d65e]">{action.icon}</span><span>{action.label}</span>
                </button>
              ))}
            </div>
            <div className="w-full flex items-center bg-white/15 backdrop-blur-3xl rounded-full p-1.5 pl-5 gap-2.5 border border-white/20 transition-all focus-within:border-[#12d65e]/40 shadow-2xl">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="咨询个性化方案..." className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20 py-2.5 text-[14px] font-medium" />
              <button onClick={() => handleSend()} disabled={!inputValue.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${inputValue.trim() ? 'bg-[#12d65e] text-black shadow-lg' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}><i className="fa-solid fa-arrow-up text-md"></i></button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsHistoryOpen(false)} />
      <aside className={`fixed top-0 left-0 bottom-0 z-[110] w-[80%] max-w-[320px] bg-[#f8f9fa] text-black transition-transform duration-500 shadow-2xl flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg overflow-hidden shadow-md"><Logo /></div><span className="text-lg font-black">WayPal.ai</span></div>
            <button onClick={() => setIsHistoryOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-300"><i className="fa-solid fa-xmark text-lg"></i></button>
          </div>
          <button onClick={() => { setIsStarted(false); setMessages([]); setHotelName(''); setIsHistoryOpen(false); }} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all font-bold text-sm">
            <i className="fa-solid fa-plus text-[#12d65e]"></i>发起新咨询
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1.5 no-scrollbar">
          <p className="px-2 py-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">最近咨询</p>
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-gray-300">
            <i className="fa-solid fa-clock-rotate-left text-2xl mb-3"></i>
            <p className="text-[12px] font-medium">暂无历史记录</p>
          </div>
        </div>
      </aside>

      {(errorMessage || successMessage) && (
        <div className="fixed inset-x-0 bottom-24 flex items-center justify-center pointer-events-none z-[120] px-6">
          <div className={`px-5 py-3 rounded-xl shadow-2xl animate-fade-up font-bold text-[12px] flex items-center gap-2.5 pointer-events-auto border border-white/10 ${successMessage ? 'bg-[#12d65e] text-black' : 'bg-[#f04438] text-white'}`}>
            <i className={`fa-solid ${successMessage ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {errorMessage || successMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
