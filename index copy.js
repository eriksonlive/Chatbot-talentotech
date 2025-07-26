import express from 'express';
import dotenv from 'dotenv';
import { askGemini } from './src/gemini.js';
import { fetchData } from './src/apiclient.js';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db.json');

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

// Limitar la cantidad de peticiones por minuto para evitar abuso
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máximo 10 peticiones por minuto
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

const readExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return data;
};

// bot.on('message', async (msg) => {
//   const chatId = msg.chat.id;
//   const userMessage = msg.text;

//   if (!sesiones.has(chatId)) {
//     sesiones.set(chatId, {
//       profesional: null,
//       fecha: null,
//       hora: null,
//       paciente: null,
//       identificacion: null,
//       historial: [],
//     });
//   }

//   const sesion = sesiones.get(chatId);

//   if (userMessage.toLowerCase().includes('cambiar cita')) {
//     bot.sendMessage(chatId, '¿Deseas cambiar la fecha, hora o profesional?');
//     return;
//   }

//   // 🟨 Detectar intención de cambiar la hora
//   if (userMessage.toLowerCase().includes('cambiar mi hora')) {
//     sesion.estado = 'esperando_nueva_hora';
//     sesiones.set(chatId, sesion);

//     return bot.sendMessage(
//       chatId,
//       'Claro, ¿para qué nueva hora deseas cambiar tu cita?'
//     );
//   }

//   // 🟩 Manejar cuando el usuario responde con la nueva hora
//   if (sesion.estado === 'esperando_nueva_hora') {
//     const nuevaHora = userMessage.trim();

//     if (!/^\d{1,2}:\d{2}$/.test(nuevaHora)) {
//       bot.sendMessage(chatId, '⚠️ El formato de hora no es válido. Usa HH:mm.');
//       return;
//     }

//     const actualizado = actualizarCita({
//       chatId,
//       profesional: sesion.profesional,
//       fecha: sesion.fecha,
//       nuevaHora,
//     });

//     if (actualizado) {
//       bot.sendMessage(
//         chatId,
//         `✅ Tu cita ha sido actualizada para las ${nuevaHora}.`
//       );
//     } else {
//       bot.sendMessage(chatId, `❌ No se encontró una cita para actualizar.`);
//     }

//     // Limpiar estado
//     sesion.estado = null;
//     sesiones.set(chatId, sesion);
//     return;
//   }

//   sesion.historial.push({ rol: 'user', mensaje: userMessage });

//   if (userMessage.toLowerCase().includes('mi nombre es')) {
//     sesion.paciente = userMessage.split('mi nombre es')[1].trim();
//   }
//   if (userMessage.toLowerCase().includes('mi cédula es')) {
//     sesion.identificacion = userMessage.split('mi cédula es')[1].trim();
//   }

//   sesiones.set(chatId, sesion);

//   const data = await fetchData();
//   if (!data) return bot.sendMessage(chatId, 'No se pudo obtener la data.');

//   const productos = data.productos.data.products;

//   const resumenProductos = productos.map((p) => ({
//     nombre: p.title,
//     descripcion: p.description,
//     precio: p.price,
//     stock: p.stock,
//     categoria: p.category,
//     rating: p.rating,
//   }));

//   const dataxlsx = readExcel('./CitasDisponibles.xlsx');
//   const citas = procesarCitas(dataxlsx);

//   const resumenCitas = citas
//     .map((c) => `Fecha: ${c.fecha} - Profesional: ${c.profesional}`)
//     .join('\n');

//   // console.log(JSON.stringify(resumenProductos, null, 2));
//   // ${JSON.stringify(resumenProductos, null, 2)}

//   const historialTexto = sesion.historial
//     .map((m) => `${m.rol === 'user' ? 'Usuario' : 'Asistente'}: ${m.mensaje}`)
//     .join('\n');

//   const prompt = `
//     Actúa como un asistente experto en servicio al cliente y agendamiento de citas médicas.

//     Historial de conversación:
//     ${historialTexto}

//     Citas disponibles:
//     ${resumenCitas}

//     Responde claro y específico. Si no tienes suficiente info, dilo.

//     Si tienes suficiente información (nombre del profesional, fecha y hora), responde únicamente con el siguiente JSON sin ningún texto adicional:

//     {
//       "profesional": "...",
//       "fecha": "...",
//       "hora": "...",
//       "paciente": "...",
//       "identificacion": "..."
//     }
//   `;

//   try {
//     const answer = await askGemini(prompt);
//     sesion.historial.push({ rol: 'bot', mensaje: answer });

//     const jsonMatch = answer.match(/\{[\s\S]*\}/);

//     if (jsonMatch) {
//       const jsonText = jsonMatch[0];
//       console.log('[BOT] JSON recibido:', jsonText);

//       let datos;
//       try {
//         datos = JSON.parse(jsonText);
//       } catch (e) {
//         console.error('[BOT] JSON malformado:', e.message);
//         bot.sendMessage(
//           chatId,
//           '⚠️ No pude procesar los datos de la cita. Intenta de nuevo.'
//         );
//         return;
//       }

//       if (!datos.profesional || !datos.fecha || !datos.hora) {
//         console.log('[BOT] Datos incompletos:', datos);
//         bot.sendMessage(chatId, '⚠️ Faltan datos para agendar tu cita.');
//         return;
//       }

//       Object.assign(sesion, datos);
//       sesiones.set(chatId, sesion);

//       bot.sendMessage(chatId, '🧠 He guardado tu información de la cita exitosamente.');

//       console.log('[BOT] Intentando agendar cita:', sesion);

//       const exito = agendarCita({ ...sesion, chatId });

//       console.log('[BOT] Resultado de agendar cita:', exito);

//       bot.sendMessage(
//         chatId,
//         exito
//           ? '✅ Cita agendada exitosamente.'
//           : '❗ Ya existe una cita igual agendada.'
//       );

//       sesiones.delete(chatId);
//     } else {
//       bot.sendMessage(chatId, answer); // Si no es JSON válido, responde normal
//     }
//   } catch (error) {
//     bot.sendMessage(chatId, '⚠️ Error procesando tu solicitud.');
//     console.error(error);
//   }
// });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (!sesiones.has(chatId)) {
    sesiones.set(chatId, {
      profesional: null,
      fecha: null,
      hora: null,
      paciente: null,
      identificacion: null,
      historial: [],
    });
  }

  const sesion = sesiones.get(chatId);

  if (userMessage.toLowerCase().includes('cambiar cita')) {
    bot.sendMessage(chatId, '¿Deseas cambiar la fecha, hora o profesional?');
    return;
  }

  // 🟨 Detectar intención de cambiar la hora
  if (userMessage.toLowerCase().includes('cambiar mi hora')) {
    sesion.estado = 'esperando_nueva_hora';
    sesiones.set(chatId, sesion);

    return bot.sendMessage(
      chatId,
      'Claro, ¿para qué nueva hora deseas cambiar tu cita?'
    );
  }

  // 🟩 Manejar cuando el usuario responde con la nueva hora
  if (sesion.estado === 'esperando_nueva_hora') {
    const nuevaHora = userMessage.trim();

    if (!/^\d{1,2}:\d{2}$/.test(nuevaHora)) {
      bot.sendMessage(chatId, '⚠️ El formato de hora no es válido. Usa HH:mm.');
      return;
    }

    const actualizado = actualizarCita({
      chatId,
      profesional: sesion.profesional,
      fecha: sesion.fecha,
      nuevaHora,
    });

    if (actualizado) {
      bot.sendMessage(
        chatId,
        `✅ Tu cita ha sido actualizada para las ${nuevaHora}.`
      );
    } else {
      bot.sendMessage(chatId, `❌ No se encontró una cita para actualizar.`);
    }

    // Limpiar estado
    sesion.estado = null;
    sesiones.set(chatId, sesion);
    return;
  }

  sesion.historial.push({ rol: 'user', mensaje: userMessage });

  if (userMessage.toLowerCase().includes('mi nombre es')) {
    sesion.paciente = userMessage.split('mi nombre es')[1].trim();
  }
  if (userMessage.toLowerCase().includes('mi cédula es')) {
    sesion.identificacion = userMessage.split('mi cédula es')[1].trim();
  }

  sesiones.set(chatId, sesion);

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

  const dataxlsx = readExcel('./CitasDisponibles.xlsx');
  const citas = procesarCitas(dataxlsx);

  const resumenCitas = citas
    .map((c) => `Fecha: ${c.fecha} - Profesional: ${c.profesional}`)
    .join('\n');

  // console.log(JSON.stringify(resumenProductos, null, 2));
  // ${JSON.stringify(resumenProductos, null, 2)}

  const historialTexto = sesion.historial
    .map((m) => `${m.rol === 'user' ? 'Usuario' : 'Asistente'}: ${m.mensaje}`)
    .join('\n');

  const prompt = `
    Actúa como un asistente experto en servicio al cliente y agendamiento de citas médicas.

    Historial de conversación:
    ${historialTexto}

    Citas disponibles:
    ${resumenCitas}

    Responde claro y específico. Si no tienes suficiente info, dilo.

    Si tienes suficiente información (nombre del profesional, fecha y hora), responde únicamente con el siguiente JSON sin ningún texto adicional:

    {
      "profesional": "...",
      "fecha": "...",
      "hora": "...",
      "paciente": "...",
      "identificacion": "..."
    }
  `;

  try {
    const answer = await askGemini(prompt);
    sesion.historial.push({ rol: 'bot', mensaje: answer });

    const jsonMatch = answer.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonText = jsonMatch[0];
      console.log('[BOT] JSON recibido:', jsonText);

      let datos;
      try {
        datos = JSON.parse(jsonText);
      } catch (e) {
        console.error('[BOT] JSON malformado:', e.message);
        bot.sendMessage(
          chatId,
          '⚠️ No pude procesar los datos de la cita. Intenta de nuevo.'
        );
        return;
      }

      if (!datos.profesional || !datos.fecha || !datos.hora) {
        console.log('[BOT] Datos incompletos:', datos);
        bot.sendMessage(chatId, '⚠️ Faltan datos para agendar tu cita.');
        return;
      }

      Object.assign(sesion, datos);
      sesiones.set(chatId, sesion);

      bot.sendMessage(chatId, '🧠 He guardado tu información de la cita exitosamente.');

      console.log('[BOT] Intentando agendar cita:', sesion);

      const exito = agendarCita({ ...sesion, chatId });

      console.log('[BOT] Resultado de agendar cita:', exito);

      bot.sendMessage(
        chatId,
        exito
          ? '✅ Cita agendada exitosamente.'
          : '❗ Ya existe una cita igual agendada.'
      );

      sesiones.delete(chatId);
    } else {
      bot.sendMessage(chatId, answer); // Si no es JSON válido, responde normal
    }
  } catch (error) {
    bot.sendMessage(chatId, '⚠️ Error procesando tu solicitud.');
    console.error(error);
  }
});

function procesarCitas(dataxlsx) {
  const citas = [];

  for (const fila of dataxlsx) {
    for (const key in fila) {
      const valor = fila[key];
      if (valor && typeof valor === 'string' && valor.includes('El')) {
        const [fecha, profesional] = valor.trim().split('\n');
        if (fecha && profesional) {
          citas.push({
            fecha: fecha.trim(), // Ej: "El 24 a las 12:30"
            profesional: profesional.trim(), // Ej: "DAVES ROLENZO LAM LEUNG"
          });
        }
      }
    }
  }

  return citas;
}

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
  res.send('El chatbot está activo.');
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

const sesiones = new Map();

// Leer base de datos simulada
const cargarDB = () => {
  if (!fs.existsSync(dbPath)) return { citas: [] };
  const data = fs.readFileSync(dbPath);
  return JSON.parse(data);
};

// Guardar en la base de datos simulada
const guardarDB = (db) => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

const agendarCita = ({
  chatId,
  profesional,
  fecha,
  hora,
  paciente,
  identificacion,
}) => {
  const db = cargarDB();

  const fechaLimpia = normalizarFecha(fecha);
  if (!fechaLimpia) return false;

  // Verificar si ya hay una cita igual
  const existe = db.citas.find(
    (c) =>
      c.chatId == chatId &&
      c.fecha?.trim() === fecha?.trim() &&
      c.hora?.trim() === hora?.trim() &&
      c.profesional?.trim().toLowerCase() ===
        profesional?.trim().toLowerCase() &&
      c.paciente?.trim() === paciente?.trim() &&
      c.identificacion?.trim() === identificacion?.trim()
  );

  if (existe) return false;

  db.citas.push({
    chatId,
    profesional: profesional.trim(),
    fecha: fechaLimpia,
    hora: hora.trim(),
    paciente: paciente?.trim() || '',
    identificacion: identificacion?.trim() || '',
    creada: new Date(),
  });
  guardarDB(db);
  return true;
};

const actualizarCita = ({ chatId, profesional, fecha, nuevaHora }) => {
  const db = cargarDB();

  const fechaLimpia = normalizarFecha(fecha);
  if (!fechaLimpia) return false;

  const cita = db.citas.find(
    (c) =>
      c.chatId == chatId &&
      c.profesional.trim().toLowerCase() === profesional.trim().toLowerCase() &&
      normalizarFecha(c.fecha) === fechaLimpia
  );

  if (!cita) return false;

  cita.hora = nuevaHora;
  cita.creada = new Date();

  guardarDB(db);
  return true;
};

const normalizarFecha = (fechaTexto) => {
  const limpio = fechaTexto.replace(/El\s*/i, '').trim();

  if (/^\d{1,2}$/.test(limpio)) {
    const day = limpio.padStart(2, '0');
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    return limpio;
  }

  return null;
};
