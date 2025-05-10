"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const operacion_bancaria_controller_1 = require("../controllers/operacion-bancaria.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// Configurar multer para la carga de archivos en memoria
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: (_req, file, cb) => {
        // Aceptar solo imágenes y PDF
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes y archivos PDF'));
        }
    }
});
const router = express_1.default.Router();
// Ruta de prueba para verificar que el router funciona
router.get('/status', (_req, res) => {
    res.status(200).json({ message: 'API de operaciones bancarias funcionando correctamente' });
});
// Obtener todas las operaciones bancarias
router.get('/', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getAllOperacionesBancarias);
// Obtener operaciones bancarias por ID de caja
router.get('/caja/:cajaId', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionesBancariasByCajaId);
// Obtener una operación bancaria por ID
router.get('/:id', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.getOperacionBancariaById);
// Crear una nueva operación bancaria
router.post('/', auth_middleware_1.isAuthenticated, upload.single('comprobante'), operacion_bancaria_controller_1.createOperacionBancaria);
// Actualizar una operación bancaria
router.put('/:id', auth_middleware_1.isAuthenticated, upload.single('comprobante'), operacion_bancaria_controller_1.updateOperacionBancaria);
// Eliminar una operación bancaria
router.delete('/:id', auth_middleware_1.isAuthenticated, operacion_bancaria_controller_1.deleteOperacionBancaria);
// Manejador de errores de multer
router.use((err, _req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        // Error de Multer
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB permitido.' });
        }
        return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
    }
    else if (err) {
        // Otro tipo de error
        return res.status(500).json({ error: err.message });
    }
    // Si no hay error, continuar
    return next();
});
exports.default = router;
//# sourceMappingURL=operacion-bancaria.routes.js.map