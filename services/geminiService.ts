
import { GoogleGenAI } from "@google/genai";
import { HotelSearchData } from "../types";

// Always use named parameter for apiKey
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateHotelResponse = async (
  query: string,
  searchData?: HotelSearchData
) => {
  const model = 'gemini-3-flash-preview';
  
  let prompt = query;
  if (searchData) {
    prompt = `我正在咨询关于 ${searchData.hotelName} 的信息，入住日期为 ${searchData.dates}，人数为 ${searchData.guests}。用户的问题是：${query}`;
  }

  const systemInstruction = `你是一位名为 WayPal 的顶级奢华酒店私人管家，专门为高净值人群（UHNWI）提供极度专业、细致且优雅的订房咨询建议。

**核心指令：**
1. **全中文回复**：除酒店专有名词外，所有回答内容必须使用优雅、得体的中文。
2. **排版美学**：注重段落间距。使用加粗、列表、小标题来提升阅读效率。避免大段堆叠。
3. **管家式口吻**：称呼用户为“宾客”或“您”，语气保持谦逊而充满自信，体现高端服务的专业度。
4. **实时搜索**：始终调用 Google Search 获取最新的酒店动态、会员礼遇（如 Virtuoso/FHR）以及价格波动。
5. **精准建议**：如果用户查询的是特定酒店，请针对该酒店的房型差异、景观优劣给出独到见解。

在涉及客房展示（Room Tour）时，请像在带领客人步入房间一样，描述光影、材质和窗外的景观。
在涉及价格对比时，请以“全网最优价值方案”为核心逻辑，而不仅是最低价，还要考虑赠送的早餐、消费抵扣等权益价值。`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "非常抱歉，尊贵的宾客，我暂时无法获取该酒店的详细信息。请稍后再试。",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
