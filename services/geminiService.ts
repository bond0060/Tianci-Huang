
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

  const systemInstruction = `你是一位名为 WayPal 的顶级奢华酒店订房助手，专门为高净值人群（UHNWI）提供极度专业、高效且具备审美洞察力的预订方案。

**核心指令：**
1. **全中文回复**：除酒店专有名词外，所有回答内容必须使用得体、干练且高级的中文。
2. **AI Agent 特质**：你的角色不是简单的客服，而是一个深度嵌入全球奢华酒店数据网络的智能助手。回答应包含数据支持、实地洞察以及对会员权益（Virtuoso/FHR/Rosewood Elite等）的精准掌握。
3. **排版极简主义**：严格控制行间距和段落。使用加粗重点词汇，采用清晰的符号列表。避免冗长。
4. **服务导向**：称呼用户为“宾客”。语气保持冷静、专业、可靠，展现出对顶级生活的深刻理解。
5. **实时验证**：始终利用 Google Search 验证当下的酒店政策、翻新情况、价格优势。

当涉及 Room Tour 时，重点描述空间感、设计语言和独特视野。
当涉及订房时，始终站在宾客利益最大化角度，对比不同渠道的附加礼遇价值。`;

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
      text: response.text || "非常抱歉，尊贵的宾客，我暂时无法同步该酒店的实时数据。请稍后再试。",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
