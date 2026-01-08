
import { GoogleGenAI } from "@google/genai";
import { HotelSearchData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateHotelResponse = async (
  query: string,
  searchData?: HotelSearchData,
  isRoomTour: boolean = false
) => {
  const model = 'gemini-3-flash-preview';
  
  let prompt = query;
  if (searchData) {
    prompt = `I am looking for information about ${searchData.hotelName} for ${searchData.guests} guests on ${searchData.dates}. ${query}`;
  }

  const systemInstruction = `你是一位名为 WayPal 的顶级奢华酒店管家，专门为高净值人群提供个性化的订房咨询。
  你的目标是提供最高效、最专业的订房方案建议。

  **回复原则：**
  1. **排版优雅**：你的回答必须极其注重排版和换行。避免大段堆砌文字。
  2. **结构清晰**：使用分段、小标题、或者清晰的列表来展示方案详情。
  3. **礼貌专业**：语气要得体、奢华且具有亲和力，使用高雅的中文。
  4. **重点突出**：关键信息（如价格、房型、礼遇）应适当加粗。
  5. **即时搜索**：始终利用 Google Search 工具获取实时的价格趋势、会员礼遇（如 Virtuoso/FHR）以及酒店最新的活动信息。

  如果是 Room Tour 请求，请详细描述客房的审美设计、景观角度及核心设施。
  如果是优惠方案，请对比不同的预定渠道（官方、代理、信用卡礼遇等）。`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "抱歉，我暂时无法获取相关细节，请稍后再试。",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
