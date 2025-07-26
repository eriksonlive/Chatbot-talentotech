import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔍 Verificando bot de Telegram...');
console.log('Token:', token ? `${token.substring(0, 10)}...` : 'NO ENCONTRADO');

const bot = new TelegramBot(token, { polling: false });

// Verificar información del bot
bot.getMe()
  .then((botInfo) => {
   // console.log('✅ Bot verificado exitosamente:');
   // console.log('📛 Nombre:', botInfo.first_name);
   // console.log('👤 Username:', botInfo.username);
   // console.log('🆔 ID:', botInfo.id);
   // console.log('');
   // console.log('🔗 Para usar el bot, busca en Telegram: @' + botInfo.username);
   // console.log('💡 Envía /start para iniciar la conversación');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error verificando el bot:');
    console.error(error.message);
    
    if (error.message.includes('401')) {
     // console.log('');
     // console.log('🔧 Solución: El token parece ser inválido');
     // console.log('1. Ve a @BotFather en Telegram');
     // console.log('2. Envía /mybots');
     // console.log('3. Selecciona tu bot');
     // console.log('4. Ve a "API Token" y copia el nuevo token');
     // console.log('5. Actualiza el archivo .env con el nuevo token');
    }
    process.exit(1);
  });
