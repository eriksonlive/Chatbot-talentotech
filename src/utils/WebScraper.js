import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Obtiene y analiza el contenido de la página web de Ingelean
 * @returns {Promise<Object>} Información extraída del sitio web
 */
export async function scrapIngeleanWebsite() {
  try {
   // console.log('🔍 Iniciando scraping de ingelean.com...');
    const response = await axios.get('https://ingelean.com/');
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extraer información relevante
    const websiteData = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      servicios: [],
      contacto: {},
      sections: {}
    };

    // Extraer servicios
    $('.service-box').each((index, element) => {
      const title = $(element).find('h3').text().trim();
      const description = $(element).find('p').text().trim();
      if (title) {
        websiteData.servicios.push({ title, description });
      }
    });
    
    // Extraer información de contacto
    websiteData.contacto.email = $('a[href^="mailto:"]').text().trim() || $('a[href^="mailto:"]').attr('href')?.replace('mailto:', '') || '';
    websiteData.contacto.telefono = $('a[href^="tel:"]').text().trim() || $('a[href^="tel:"]').attr('href')?.replace('tel:', '') || '';
    
    // Ubicación
    $('.contact-info-item').each((index, element) => {
      const text = $(element).text().trim();
      if (text.includes('Dirección') || text.includes('ubicados')) {
        websiteData.contacto.direccion = text.replace('Dirección:', '').trim();
      }
    });

    // Extraer secciones principales
    $('section').each((index, element) => {
      const id = $(element).attr('id');
      if (id) {
        const title = $(element).find('h2').first().text().trim();
        const content = $(element).text().trim();
        if (title && content) {
          websiteData.sections[id] = { title, content };
        }
      }
    });
    
    // Extraer textos principales sobre la empresa
    let aboutText = '';
    $('section').each((index, element) => {
      const text = $(element).text().trim();
      if (text.includes('INGE LEAN') || text.includes('empresa')) {
        aboutText += text + ' ';
      }
    });
    websiteData.aboutCompany = aboutText.trim();

   // console.log('✅ Scraping completado con éxito');
    return websiteData;
  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
    throw error;
  }
}

/**
 * Busca información específica en el contenido scrapeado
 * @param {Object} scrapedData - Datos extraídos del sitio web
 * @param {string} query - Consulta del usuario
 * @returns {string} Respuesta relevante basada en la consulta
 */
export function searchInScrapedData(scrapedData, query) {
  const queryLower = query.toLowerCase();
  let response = '';

  // Buscar proyectos (nueva sección)
  if (queryLower.includes('proyecto') || queryLower.includes('portafolio') || queryLower.includes('trabajo')) {
    response += '💼 **Proyectos de INGE LEAN:**\n\n';
    response += 'Según la información de nuestra página web (https://ingelean.com/#Proyectos), estos son algunos de nuestros proyectos destacados:\n\n';
    response += '• **Domótica:** Tecnologías para el control inteligente de espacios.\n';
    response += '• **Máquina dosificadora de maní:** Soluciones para la industria alimentaria.\n';
    response += '• **Tarjetas NFC:** Herramientas para networking y eventos empresariales.\n';
    response += '• **DMP Lab IoT & Industry:** Equipos educativos para la industria 4.0.\n';
    response += '• **Automatización de parqueaderos:** Optimizando el proceso de parqueo con tecnología.\n';
    response += '• **Extrusora de Jabón:** Fabricación de barras de jabón a gran escala.\n\n';
    response += 'Te invitamos a visitar nuestra página web para conocer más detalles sobre estos y otros proyectos.';
    return response;
  }
  
  // Buscar en servicios
  if (queryLower.includes('servicio') || queryLower.includes('ofrecen') || queryLower.includes('hacen')) {
    response += '🛠️ **Servicios de INGE LEAN:**\n\n';
    if (scrapedData.servicios.length > 0) {
      scrapedData.servicios.forEach(servicio => {
        response += `• **${servicio.title}**: ${truncateResponse(servicio.description, 200)}\n`;
      });
    } else {
      response += extractRelevantInfo(scrapedData, 'servicios');
    }
  }
  
  // Buscar información de contacto
  else if (queryLower.includes('contacto') || queryLower.includes('email') || queryLower.includes('teléfono') || queryLower.includes('ubicación')) {
    response += '📞 **Información de Contacto:**\n\n';
    if (scrapedData.contacto.email) {
      response += `• **Email**: ${scrapedData.contacto.email}\n`;
    }
    if (scrapedData.contacto.telefono) {
      response += `• **Teléfono**: ${scrapedData.contacto.telefono}\n`;
    }
    if (scrapedData.contacto.direccion) {
      response += `• **Dirección**: ${scrapedData.contacto.direccion}\n`;
    }
    
    if (!response.includes('Email') && !response.includes('Teléfono') && !response.includes('Dirección')) {
      response += extractRelevantInfo(scrapedData, 'contacto');
    }
  }
  
  // Información sobre la empresa
  else if (queryLower.includes('empresa') || queryLower.includes('compañía') || queryLower.includes('ingelean') || queryLower.includes('sobre')) {
    response += '🏢 **Acerca de INGE LEAN:**\n\n';
    response += truncateResponse(scrapedData.aboutCompany || extractRelevantInfo(scrapedData, 'empresa'));
  }
  
  // Si no hay una consulta específica, devolver información general
  else {
    response += '🔍 **Información de INGE LEAN S.A.S:**\n\n';
    response += `${truncateResponse(scrapedData.description, 300)}\n\n`;
    
    if (scrapedData.servicios.length > 0) {
      response += '🛠️ **Servicios:**\n';
      scrapedData.servicios.slice(0, 3).forEach(servicio => {
        response += `• ${servicio.title}\n`;
      });
      response += '...y más servicios disponibles.\n\n';
    }
    
    if (scrapedData.contacto.email || scrapedData.contacto.telefono) {
      response += '📞 **Contacto:**\n';
      if (scrapedData.contacto.email) {
        response += `• Email: ${scrapedData.contacto.email}\n`;
      }
      if (scrapedData.contacto.telefono) {
        response += `• Teléfono: ${scrapedData.contacto.telefono}\n`;
      }
    }
  }
  
  // Asegurarnos de que la respuesta no exceda el límite de Telegram
  return truncateResponse(response);
}

/**
 * Extrae información relevante del contenido scrapeado cuando no se encuentra información específica
 * @param {Object} scrapedData - Datos extraídos del sitio web
 * @param {string} topic - Tema a buscar
 * @returns {string} Información relevante
 */
function extractRelevantInfo(scrapedData, topic) {
  // Buscar en todas las secciones
  for (const [id, section] of Object.entries(scrapedData.sections)) {
    const contentLower = section.content.toLowerCase();
    
    if (topic === 'servicios' && (contentLower.includes('servicio') || contentLower.includes('ofrecemos'))) {
      return truncateResponse(section.content);
    }
    
    if (topic === 'contacto' && (contentLower.includes('contacto') || contentLower.includes('email') || contentLower.includes('teléfono'))) {
      return truncateResponse(section.content);
    }
    
    if (topic === 'empresa' && (contentLower.includes('empresa') || contentLower.includes('nosotros') || contentLower.includes('about'))) {
      return truncateResponse(section.content);
    }
  }
  
  // Si no encontramos nada específico, devolver una respuesta genérica
  if (topic === 'servicios') {
    return 'INGE LEAN ofrece servicios de desarrollo de software a medida, automatización industrial, diseño de hardware, mantenimiento técnico e inteligencia artificial aplicada a procesos empresariales.';
  }
  
  if (topic === 'contacto') {
    return 'Puedes contactar con INGE LEAN a través de su página web https://ingelean.com/ o visitando sus oficinas en Pereira, Risaralda.';
  }
  
  if (topic === 'empresa') {
    return 'INGE LEAN S.A.S. es una empresa colombiana especializada en desarrollo de software a medida, automatización industrial, diseño de hardware, mantenimiento técnico e inteligencia artificial.';
  }
  
  return '';
}

/**
 * Trunca la respuesta para asegurar que no exceda el límite de Telegram (4096 caracteres)
 * @param {string} text - Texto a truncar 
 * @param {number} maxLength - Longitud máxima (por defecto 3000 para dejar margen)
 * @returns {string} Texto truncado
 */
function truncateResponse(text, maxLength = 3000) {
  if (!text) return '';
  
  // Limpiar el texto de código JavaScript y CSS que pueda estar en la página
  let cleanText = text
    .replace(/function\s*\(.*?\)\s*\{[\s\S]*?\}/g, '') // Eliminar funciones JS
    .replace(/\{[\s\S]*?\}/g, '') // Eliminar bloques CSS
    .replace(/var\s+.*?;/g, '') // Eliminar declaraciones de variables
    .replace(/if\s*\(.*?\)\s*\{[\s\S]*?\}/g, '') // Eliminar bloques if
    .replace(/for\s*\(.*?\)\s*\{[\s\S]*?\}/g, '') // Eliminar bloques for
    .replace(/\s{2,}/g, ' ') // Reducir espacios múltiples a uno solo
    .replace(/\t/g, ' ') // Reemplazar tabs por espacios
    .replace(/\n{2,}/g, '\n\n') // Reducir saltos de línea múltiples a dos
    .trim();
    
  // Si aún es demasiado largo, truncarlo
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength) + '...';
  }
  
  return cleanText;
}
