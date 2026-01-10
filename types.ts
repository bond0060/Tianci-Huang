
export interface RoomTourVideo {
  id: string;
  title: string;
  author: string;
  likes: string;
  coverUrl: string;
  videoUrl: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'room-tour' | 'offer' | 'comparison';
  timestamp: number;
  hotelInfo?: HotelSearchData;
  groundingChunks?: GroundingChunk[];
  comparisonData?: any; // Stores the reply_json from the comparison API
  roomTourVideos?: RoomTourVideo[];
}

export interface HotelSearchData {
  hotelName: string;
  dates: string;
  guests: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
