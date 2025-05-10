"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cambio_moneda_controller_1 = require("../controllers/cambio-moneda.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Rutas protegidas con token de autenticación
router.get('/', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambiosMoneda);
router.get('/:id', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambioMonedaById);
router.post('/', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.createCambioMoneda);
router.get('/caja/:cajaId', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambiosMonedaByCaja);
router.get('/usuario/:usuarioId', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.getCambiosMonedaByUsuario);
// Ruta para cancelar un cambio de moneda (IMPORTANTE: esta ruta debe ir DESPUÉS de /usuario/:usuarioId pero ANTES de /:id)
router.post('/cancelar/:id', authMiddleware_1.authenticateToken, cambio_moneda_controller_1.cancelarCambioMoneda);
exports.default = router;
//# sourceMappingURL=cambio-moneda.routes.js.map