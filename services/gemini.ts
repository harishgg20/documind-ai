import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProcessedDocument, AIModelMode } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEmailContent = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8, // Slightly higher creativity for emails
      }
    });

    let text = response.text || '';
    // Robustly strip markdown code blocks (start and end)
    text = text.replace(/^```(html)?\s*/i, '').replace(/```\s*$/i, '').trim();
    return text;
  } catch (error) {
    console.error("Gemini Email Generation Error:", error);
    // Basic fallback if AI fails
    return `<div style="font-family: sans-serif; padding: 20px; text-align: center; color: #333;">
      <h2 style="color: #0b57d0;">DocuMind AI Notification</h2>
      <p>We encountered an error generating the fully formatted email, but your request was processed successfully.</p>
    </div>`;
  }
};

export const generateAnswer = async (
  document: ProcessedDocument,
  question: string,
  history: { role: string; parts: { text: string }[] }[],
  mode: AIModelMode
): Promise<{ text: string; citations: number[] }> => {
  const ai = getAiClient();
  
  // 1. Select Model and Configuration based on User Mode
  // Default logic
  let model = 'gemini-2.5-flash-lite';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestConfig: any = {};

  // For Video, we MUST use gemini-3-pro-preview as per requirements
  if (document.type === 'video') {
    model = 'gemini-3-pro-preview';
  } else {
    switch (mode) {
      case 'fast':
        model = 'gemini-2.5-flash-lite';
        break;
      case 'pro':
        model = 'gemini-3-pro-preview';
        break;
      case 'thinking':
        model = 'gemini-3-pro-preview';
        requestConfig.thinkingConfig = { thinkingBudget: 32768 };
        break;
      default:
        model = 'gemini-2.5-flash-lite';
    }
  }

  // 2. Prepare Content and System Instructions based on Document Type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [];
  let systemInstruction = '';

  if (document.type === 'pdf') {
    // --- PDF / Text Logic ---
    let contextString = "DOCUMENT CONTEXT:\n";
    document.content.forEach(page => {
      contextString += `[Page ${page.page}] ${page.text}\n\n`;
    });

    systemInstruction = `
      You are DocuMind, an intelligent document assistant.
      Your task is to answer the user's question based ONLY on the provided document context.
      
      RULES:
      1. Answer truthfully using the provided context.
      2. If the answer is not in the document, say exactly: "The information is not available in the document."
      3. You must cite the page numbers where you found the information at the end of your response in this format: [Page X] or [Page X, Y].
      4. Do not hallucinate information.
      5. Keep answers concise and professional.
    `;

    // Inject Context
    contents.push({ role: 'user', parts: [{ text: contextString }] });
    
    // Inject History
    history.forEach(h => contents.push({ role: h.role, parts: h.parts }));
    
    // Inject Current Question
    contents.push({ role: 'user', parts: [{ text: question }] });

  } else if (document.type === 'image' && document.inlineData) {
    // --- Image Logic ---
    systemInstruction = `
      You are DocuMind, an intelligent assistant capable of analyzing images.
      Analyze the provided image and answer the user's questions about it.
      Be descriptive and helpful.
    `;

    const imagePart = {
      inlineData: {
        mimeType: document.mimeType || 'image/jpeg',
        data: document.inlineData,
      },
    };

    if (history.length === 0) {
       contents.push({
         role: 'user',
         parts: [imagePart, { text: question }]
       });
    } else {
       contents.push({
         role: 'user',
         parts: [imagePart, { text: "Reference Image for this conversation." }]
       });
       contents.push({
          role: 'model',
          parts: [{ text: "Understood. I have analyzed the image." }]
       });
       history.forEach(h => contents.push({ role: h.role, parts: h.parts }));
       contents.push({ role: 'user', parts: [{ text: question }] });
    }

  } else if (document.type === 'video' && document.inlineData) {
    // --- Video Logic ---
    systemInstruction = `
      You are DocuMind, an intelligent assistant capable of analyzing videos.
      Analyze the provided video content and answer the user's questions about it.
      Provide timestamps where possible if describing specific events.
      The video is provided as context.
    `;

    const videoPart = {
      inlineData: {
        mimeType: document.mimeType || 'video/mp4',
        data: document.inlineData,
      },
    };

    if (history.length === 0) {
       contents.push({
         role: 'user',
         parts: [videoPart, { text: question }]
       });
    } else {
       // Multi-turn context for video
       contents.push({
         role: 'user',
         parts: [videoPart, { text: "Reference Video for this conversation." }]
       });
       contents.push({
          role: 'model',
          parts: [{ text: "Understood. I have analyzed the video." }]
       });
       history.forEach(h => contents.push({ role: h.role, parts: h.parts }));
       contents.push({ role: 'user', parts: [{ text: question }] });
    }
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        ...requestConfig
      }
    });

    const text = response.text || "I couldn't generate a response.";
    
    // Extract citations (Only for PDFs)
    let citations: number[] = [];
    if (document.type === 'pdf') {
        const citationRegex = /\[Page (\d+(?:, \d+)*)\]/g;
        const citSet: Set<number> = new Set();
        let match;
        while ((match = citationRegex.exec(text)) !== null) {
          const pages = match[1].split(',').map(p => parseInt(p.trim()));
          pages.forEach(p => citSet.add(p));
        }
        citations = Array.from(citSet).sort((a, b) => a - b);
    }

    return {
      text: text,
      citations: citations
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};