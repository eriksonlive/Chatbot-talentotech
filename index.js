import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import rateLimit from 'express-rate-limit';
import cors from 'cors';
import routes from './src/Router/routes.js';
import { IniciarChatbot } from './src/Telegram/Bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', 1);

app.use(
  cors({
    origin: [
      'https://chatbot.sgmsalud.com.co',
      'https://www.chatbot.sgmsalud.com.co',
      'http://chatbot.sgmsalud.com.co',
      'http://www.chatbot.sgmsalud.com.co',
    ],
  })
);

app.use(express.json());

// Servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Limitar la cantidad de peticiones por minuto para evitar abuso
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 peticiones por minuto
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

app.use('/', routes);

// Ruta específica para el dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(process.env.PORT, () => {
  //console.log(`Bot activo en http://localhost:${process.env.PORT}`);
  //console.log(`Dashboard disponible en http://localhost:${process.env.PORT}/dashboard`);
});

IniciarChatbot(telegramToken);
