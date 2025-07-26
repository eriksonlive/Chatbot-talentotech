import { Router } from 'express';
import { cargarDB } from '../Database/db.js';
import analyticsRouter from './analyticsRoutes.js';

const router = Router();

router.get('/', (req, res) => {
    res.json('El chatbot está activo.');
});

router.get('/citas', (req, res) => {
  const db = cargarDB();
  res.json(db.citas);
});

// Rutas de analytics
router.use('/analytics', analyticsRouter);

export default router;
