import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Función para obtener los updates recientes
async function getUpdates() {
  try {
    const updates = await bot.getUpdates();
   // console.log('📨 Updates recientes:', JSON.stringify(updates, null, 2));
  } catch (error) {
   // console.error('❌ Error obteniendo updates:', error);
  }
}

getUpdates();
