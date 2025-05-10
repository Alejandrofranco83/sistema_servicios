import express from 'express';
import multer from 'multer';
import { 
  getAllOperacionesBancarias, 
  getOperacionesBancariasByCajaId, 
  getOperacionBancariaById, 
  createOperacionBancaria, 
  updateOperacionBancaria, 
  deleteOperacionBancaria 
} from '../controllers/operacion-bancaria.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

// Configurar multer para la carga de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (_req, file, cb) => {
    // Aceptar solo imágenes y PDF
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y archivos PDF'));
    }
  }
});

const router = express.Router();

// Ruta de prueba para verificar que el router funciona
router.get('/status', (_req, res) => {
  res.status(200).json({ message: 'API de operaciones bancarias funcionando correctamente' });
});

// Obtener todas las operaciones bancarias
router.get('/', isAuthenticated, getAllOperacionesBancarias);

// Obtener operaciones bancarias por ID de caja
router.get('/caja/:cajaId', isAuthenticated, getOperacionesBancariasByCajaId);

// Obtener una operación bancaria por ID
router.get('/:id', isAuthenticated, getOperacionBancariaById);

// Crear una nueva operación bancaria
router.post('/', isAuthenticated, upload.single('comprobante'), createOperacionBancaria);

// Actualizar una operación bancaria
router.put('/:id', isAuthenticated, upload.single('comprobante'), updateOperacionBancaria);

// Eliminar una operación bancaria
router.delete('/:id', isAuthenticated, deleteOperacionBancaria);

// Manejador de errores de multer
router.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Error de Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB permitido.' });
    }
    return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
  } else if (err) {
    // Otro tipo de error
    return res.status(500).json({ error: err.message });
  }
  // Si no hay error, continuar
  return next();
});

export default router; 