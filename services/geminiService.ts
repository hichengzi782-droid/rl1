import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { LetterData, GeneratedContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the structured output
const letterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    chineseLogicDraft: {
      type: Type.STRING,
      description: "A verbatim draft of the logic flow in Chinese, explaining how the student's projects led to challenges and demonstrated qualities.",
    },
    englishLetter: {
      type: Type.STRING,
      description: "The full English recommendation letter (~350 words).",
    },
    grammarAnalysis: {
      type: Type.STRING,
      description: "A critique of the input material, checking for logical gaps or grammatical nuances to be aware of.",
    },
  },
  required: ["chineseLogicDraft", "englishLetter", "grammarAnalysis"],
};

export const generateLetter = async (data: LetterData): Promise<GeneratedContent> => {
  const model = "gemini-2.5-flash";
  
  const systemPrompt = `
    You are an expert academic writer specializing in recommendation letters.
    Your task is to take Chinese input regarding a professor and a student's projects and write a professional English recommendation letter.
    
    STRICT STRUCTURE REQUIREMENTS:
    1.  **Date:** Do NOT include a date.
    2.  **Salutation:** Start exactly with "To Whom It May Concern,".
    3.  **Opening:** Start exactly with "It is with great enthusiasm that I recommend [Student Name]...".
    4.  **Body Paragraph 1:** MUST start with "On the one hand,".
        - Logic: Describe a specific project -> The difficulties/challenges faced -> How the student solved them -> The qualities demonstrated.
        - Length: Approximately 125 words.
    5.  **Body Paragraph 2:** MUST start with "On the other hand,".
        - Logic: Describe a different project/aspect -> The difficulties/challenges -> Solution -> Qualities demonstrated.
        - Length: Approximately 125 words.
    6.  **Conclusion:** MUST start with "Given [summary of qualities]...".
    7.  **Sign-off:** "Yours truly," followed by the Professor's info.
    8.  **Total Length:** Approximately 350 words.
    9.  **Tone:** Professional, academic, highly positive.

    Input Data:
    Professor Info: ${data.professorInfo}
    Student Material: ${data.studentMaterial}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: "Generate the recommendation letter and analysis based on the system instructions.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: letterSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");
    
    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.error("Error generating letter:", error);
    throw error;
  }
};

let chatSession: Chat | null = null;

export const initializeChat = (initialContext: string) => {
  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are an assistant helping a user refine a recommendation letter. 
      The current letter context is provided. 
      When the user asks to change something, output the *Revised English Letter Only* if they ask for a rewrite, or answer their question politely.
      If you rewrite the letter, please keep the strict structure (To Whom It May Concern, On the one hand, On the other hand, Given...) unless explicitly told otherwise.
      
      Current Letter Context:
      ${initialContext}`,
    }
  });
};

export const sendMessageToChat = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  const response = await chatSession.sendMessage({ message });
  return response.text || "I'm sorry, I couldn't process that.";
};