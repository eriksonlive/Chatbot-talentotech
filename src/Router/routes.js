import { Router } from 'express';
import { cargarDB } from '../Database/db.js';

const router = Router();

router.get('/', (req, res) => {
    res.json('El chatbot está activo.');
});

router.get('/citas', (req, res) => {
  const db = cargarDB();
  res.json(db.citas);
});

export default router;
