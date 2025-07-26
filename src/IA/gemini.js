import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function askGemini(prompt) {
  try {
    console.log('🧠 Gemini: Generando respuesta...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log('✅ Gemini: Respuesta generada exitosamente');
    return response;
  } catch (error) {
    console.error('❌ Error en Gemini:', error);
    throw error;
  }
}
