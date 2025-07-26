import express from 'express';
import dotenv from 'dotenv';
import { askGemini } from './src/gemini.js';
import { fetchData } from './src/apiclient.js';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máx 10 peticiones por minuto
  message: 'Demasiadas solicitudes. Intenta más tarde.',
});
app.use(limiter);

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token !== process.env.API_SECRET_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: true });



bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  const data = await fetchData();
  if (!data) return bot.sendMessage(chatId, 'No se pudo obtener la data.');

  const productos = data.productos.data.products;

  const resumenProductos = productos.map((p) => ({
    nombre: p.title,
    descripcion: p.description,
    precio: p.price,
    stock: p.stock,
    categoria: p.category,
    rating: p.rating,
  }));

  const prompt = `
    Actúa como un asistente experto en productos. Responde con base en la siguiente lista:

    ${JSON.stringify(resumenProductos, null, 2)}

    Pregunta del usuario: "${userMessage}"

    Responde claro y específico. Si no tienes suficiente info, dilo.
  `;

  try {
    const answer = await askGemini(prompt);
    bot.sendMessage(chatId, answer);
  } catch (error) {
    bot.sendMessage(
      chatId,
      'Lo siento, hubo un error procesando tu solicitud.'
    );
  }
});

app.post('/webhook', async (req, res) => {
  const { message } = req.body;

  try {
    // const respuesta = await generarRespuestaIA(message);
    const respuesta = 'lorem';

    // Enviar la respuesta por UltraMsg
    const resp = await axios.get(
      `https://api.ultramsg.com/${process.env.ULTRA_INSTANCE_ID}/messages/chat`,
      {
        params: {
          token: process.env.ULTRA_TOKEN,
          to: '573008128303',
          body: respuesta,
        },
      }
    );

    // console.log(resp);

    res.sendStatus(200);
  } catch (e) {
    console.error('Error al responder:', e.message);
    res.sendStatus(500);
  }
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const answer = await generarRespuestaIA(userMessage);
    res.json({ reply: answer });
  } catch (e) {
    res.status(500).json({ error: 'Error al generar respuesta de IA' });
  }
});

app.get('/', (req, res) => {
  res.send('¡Hola! Soy un bot de IA. Envíame un mensaje para empezar.');
});

app.listen(process.env.PORT, () => {
  console.log(`Bot activo en http://localhost:${process.env.PORT}`);
});

async function generarRespuestaIA(userMessage) {
  const data = await fetchData();

  if (!data || !data.productos)
    throw new Error('No hay productos disponibles.');

  const productos = data.productos.data.products;

  const resumenProductos = productos.map((p) => ({
    nombre: p.title,
    descripcion: p.description,
    precio: p.price,
    stock: p.stock,
    categoria: p.category,
    rating: p.rating,
  }));

  const prompt = `
        Actúa como un asistente experto en productos. Responde solo con base en esta lista:

        ${JSON.stringify(resumenProductos, null, 2)}

        Pregunta del usuario: "${userMessage}"

        Responde claro y específico. Si no tienes suficiente información, dilo.
  `;

  return await askGemini(prompt);
}
