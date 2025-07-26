import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instanceId = process.env.ULTRA_INSTANCE_ID;
const token = process.env.ULTRA_TOKEN;

export async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.get(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      params: {
        token,
        to, // formato: +1234567890
        body: message
      }
    });

    console.log('Mensaje enviado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al enviar mensaje:', error.response?.data || error.message);
    throw error;
  }
}
