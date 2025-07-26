import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { normalizarFecha } from "../utils/fechas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../db.json');

// Leer base de datos simulada
export const cargarDB = () => {
  if (!fs.existsSync(dbPath)) return { citas: [] };
  const data = fs.readFileSync(dbPath);
  return JSON.parse(data);
};

// Guardar en la base de datos simulada
export const guardarDB = (db) => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const agendarCita = ({
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

export const actualizarCita = ({ chatId, profesional, fecha, nuevaHora }) => {
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
