import { Router } from 'express';
import {
  getCambiosMoneda,
  getCambioMonedaById,
  createCambioMoneda,
  getCambiosMonedaByCaja,
  getCambiosMonedaByUsuario,
  cancelarCambioMoneda
} from '../controllers/cambio-moneda.controller';
import { authenticateToken as verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// Rutas protegidas con token de autenticación
router.get('/', verificarToken, getCambiosMoneda);
router.get('/:id', verificarToken, getCambioMonedaById);
router.post('/', verificarToken, createCambioMoneda);
router.get('/caja/:cajaId', verificarToken, getCambiosMonedaByCaja);
router.get('/usuario/:usuarioId', verificarToken, getCambiosMonedaByUsuario);

// Ruta para cancelar un cambio de moneda (IMPORTANTE: esta ruta debe ir DESPUÉS de /usuario/:usuarioId pero ANTES de /:id)
router.post('/cancelar/:id', verificarToken, cancelarCambioMoneda);

export default router; 