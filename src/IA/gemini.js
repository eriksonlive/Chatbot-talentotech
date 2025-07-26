import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Función para truncar texto
function truncateText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export async function askGemini(prompt, websiteData = null) {
  try {
    console.log('🧠 Gemini: Generando respuesta...');
    
    let enhancedPrompt = prompt;
    
    // Si tenemos datos del sitio web y la consulta podría estar relacionada con la empresa
    if (websiteData && 
        (prompt.toLowerCase().includes('ingelean') || 
         prompt.toLowerCase().includes('empresa') ||
         prompt.toLowerCase().includes('servicio') ||
         prompt.toLowerCase().includes('contacto') ||
         prompt.toLowerCase().includes('proyecto'))) {
      
      console.log('🔍 Enriqueciendo prompt con datos del sitio web...');
      
      enhancedPrompt += `\n\nInformación actualizada del sitio web (ingelean.com):\n`;
      
      if (websiteData.description) {
        enhancedPrompt += `Descripción: ${truncateText(websiteData.description)}\n\n`;
      }
      
      // Si la consulta es sobre proyectos, agregar esta información específica
      if (prompt.toLowerCase().includes('proyecto') || prompt.toLowerCase().includes('portafolio')) {
        enhancedPrompt += `Proyectos destacados:\n`;
        enhancedPrompt += `- Domótica: Tecnologías para el control inteligente de espacios.\n`;
        enhancedPrompt += `- Máquina dosificadora de maní: Soluciones para la industria alimentaria.\n`;
        enhancedPrompt += `- Tarjetas NFC: Herramientas para networking y eventos empresariales.\n`;
        enhancedPrompt += `- DMP Lab IoT & Industry: Equipos educativos para la industria 4.0.\n`;
        enhancedPrompt += `- Automatización de parqueaderos: Optimizando el proceso de parqueo con tecnología.\n`;
        enhancedPrompt += `- Extrusora de Jabón: Fabricación de barras de jabón a gran escala.\n\n`;
      }
      
      if (websiteData.servicios && websiteData.servicios.length > 0) {
        enhancedPrompt += `Servicios (limitado a 3 ejemplos):\n`;
        websiteData.servicios.slice(0, 3).forEach(servicio => {
          enhancedPrompt += `- ${servicio.title}: ${truncateText(servicio.description, 200)}\n`;
        });
        enhancedPrompt += '\n';
      }
      
      if (websiteData.contacto) {
        enhancedPrompt += `Contacto:\n`;
        if (websiteData.contacto.email) enhancedPrompt += `- Email: ${websiteData.contacto.email}\n`;
        if (websiteData.contacto.telefono) enhancedPrompt += `- Teléfono: ${websiteData.contacto.telefono}\n`;
        if (websiteData.contacto.direccion) enhancedPrompt += `- Dirección: ${websiteData.contacto.direccion}\n`;
        enhancedPrompt += '\n';
      }
      
      if (websiteData.aboutCompany) {
        enhancedPrompt += `Acerca de la empresa:\n${truncateText(websiteData.aboutCompany, 500)}\n\n`;
      }
      
      enhancedPrompt += `IMPORTANTE: Usa esta información actualizada para responder a la consulta del usuario, pero manteniendo un tono conversacional y amigable.`;
    }
    
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    console.log('✅ Gemini: Respuesta generada exitosamente');
    return response;
  } catch (error) {
    console.error('❌ Error en Gemini:', error);
    throw error;
  }
}
