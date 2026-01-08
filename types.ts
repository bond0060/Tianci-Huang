
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'room-tour' | 'offer';
  timestamp: number;
  hotelInfo?: HotelSearchData;
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
