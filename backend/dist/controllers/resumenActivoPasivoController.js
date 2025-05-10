"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const cotizacion_model_1 = require("../models/cotizacion.model");
const prisma = new client_1.PrismaClient();
class ResumenActivoPasivoController {
    /**
     * Obtiene el efectivo total en cajas, calculado a partir de las cajas abiertas y cerradas
     */
    getEfectivoEnCajas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            try {
                // 1. Obtener la cotización vigente para hacer conversiones
                const cotizacion = yield cotizacion_model_1.CotizacionModel.findVigente();
                if (!cotizacion) {
                    res.status(400).json({
                        error: 'No hay cotización vigente disponible para realizar los cálculos'
                    });
                    return;
                }
                // Valores de conversión
                const valorDolar = parseFloat(cotizacion.valorDolar.toString());
                const valorReal = parseFloat(cotizacion.valorReal.toString());
                // Mapa para almacenar el último estado de cada maletín - La clave es el maletinId
                const estadoMaletines = new Map();
                // 2. Obtener todas las cajas cerradas
                const cajasCerradas = yield prisma.caja.findMany({
                    where: { estado: 'cerrada' },
                    select: {
                        id: true,
                        cajaEnteroId: true,
                        maletinId: true,
                        fechaCierre: true,
                        saldoFinalPYG: true,
                        saldoFinalUSD: true,
                        saldoFinalBRL: true,
                        detallesDenominacionFinal: true
                    },
                    orderBy: { fechaCierre: 'desc' }
                });
                // Procesar cajas cerradas
                for (const caja of cajasCerradas) {
                    if (caja.fechaCierre) {
                        const maletinId = caja.maletinId;
                        // Parsear los detalles de denominación
                        let detalles = null;
                        try {
                            if (caja.detallesDenominacionFinal) {
                                detalles = JSON.parse(caja.detallesDenominacionFinal.toString());
                            }
                        }
                        catch (e) {
                            console.error('Error al parsear detallesDenominacionFinal:', e);
                        }
                        // Si no hay detalles, usamos los valores individuales
                        const totalPYG = ((_a = caja.saldoFinalPYG) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0;
                        const totalUSD = ((_b = caja.saldoFinalUSD) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0;
                        const totalBRL = ((_c = caja.saldoFinalBRL) === null || _c === void 0 ? void 0 : _c.toNumber()) || 0;
                        // Si el maletín no está registrado o esta caja es más reciente, actualizamos
                        if (!estadoMaletines.has(maletinId) ||
                            (estadoMaletines.get(maletinId).tipo === 'cierre' &&
                                new Date(caja.fechaCierre) > new Date(estadoMaletines.get(maletinId).fecha))) {
                            estadoMaletines.set(maletinId, {
                                tipo: 'cierre',
                                cajaId: caja.cajaEnteroId,
                                fecha: caja.fechaCierre,
                                PYG: ((_d = detalles === null || detalles === void 0 ? void 0 : detalles.total) === null || _d === void 0 ? void 0 : _d.PYG) || totalPYG,
                                USD: ((_e = detalles === null || detalles === void 0 ? void 0 : detalles.total) === null || _e === void 0 ? void 0 : _e.USD) || totalUSD,
                                BRL: ((_f = detalles === null || detalles === void 0 ? void 0 : detalles.total) === null || _f === void 0 ? void 0 : _f.BRL) || totalBRL
                            });
                        }
                    }
                }
                // 3. Obtener cajas abiertas (estas tienen prioridad)
                const cajasAbiertas = yield prisma.caja.findMany({
                    where: { estado: 'abierta' },
                    select: {
                        id: true,
                        cajaEnteroId: true,
                        maletinId: true,
                        fechaApertura: true,
                        saldoInicialPYG: true,
                        saldoInicialUSD: true,
                        saldoInicialBRL: true,
                        detallesDenominacion: true
                    },
                    orderBy: { fechaApertura: 'desc' }
                });
                // Procesar cajas abiertas
                for (const caja of cajasAbiertas) {
                    const maletinId = caja.maletinId;
                    // Parsear los detalles de denominación
                    let detalles = null;
                    try {
                        if (caja.detallesDenominacion) {
                            detalles = JSON.parse(caja.detallesDenominacion.toString());
                        }
                    }
                    catch (e) {
                        console.error('Error al parsear detallesDenominacion:', e);
                    }
                    // Si no hay detalles, usamos los valores individuales
                    const totalPYG = ((_g = caja.saldoInicialPYG) === null || _g === void 0 ? void 0 : _g.toNumber()) || 0;
                    const totalUSD = ((_h = caja.saldoInicialUSD) === null || _h === void 0 ? void 0 : _h.toNumber()) || 0;
                    const totalBRL = ((_j = caja.saldoInicialBRL) === null || _j === void 0 ? void 0 : _j.toNumber()) || 0;
                    // Si el maletín no está registrado o no tiene una apertura o esta caja es más reciente
                    if (!estadoMaletines.has(maletinId) ||
                        estadoMaletines.get(maletinId).tipo === 'cierre' ||
                        (estadoMaletines.get(maletinId).tipo === 'apertura' &&
                            new Date(caja.fechaApertura) > new Date(estadoMaletines.get(maletinId).fecha))) {
                        estadoMaletines.set(maletinId, {
                            tipo: 'apertura',
                            cajaId: caja.cajaEnteroId,
                            fecha: caja.fechaApertura,
                            PYG: ((_k = detalles === null || detalles === void 0 ? void 0 : detalles.total) === null || _k === void 0 ? void 0 : _k.PYG) || totalPYG,
                            USD: ((_l = detalles === null || detalles === void 0 ? void 0 : detalles.total) === null || _l === void 0 ? void 0 : _l.USD) || totalUSD,
                            BRL: ((_m = detalles === null || detalles === void 0 ? void 0 : detalles.total) === null || _m === void 0 ? void 0 : _m.BRL) || totalBRL
                        });
                    }
                }
                // 4. Calcular el total en guaraníes
                let totalEnGs = 0;
                const detalles = [];
                // Calcular para cada maletín
                for (const [maletinId, maletin] of estadoMaletines.entries()) {
                    let subtotal = 0;
                    // Sumar guaraníes directamente
                    subtotal += maletin.PYG || 0;
                    // Convertir USD a guaraníes
                    const usdEnGs = (maletin.USD || 0) * valorDolar;
                    subtotal += usdEnGs;
                    // Convertir BRL a guaraníes
                    const brlEnGs = (maletin.BRL || 0) * valorReal;
                    subtotal += brlEnGs;
                    totalEnGs += subtotal;
                    // Guardar detalles para el cliente
                    detalles.push({
                        maletinId,
                        tipo: maletin.tipo,
                        cajaId: maletin.cajaId,
                        fecha: maletin.fecha,
                        PYG: maletin.PYG || 0,
                        USD: maletin.USD || 0,
                        BRL: maletin.BRL || 0,
                        usdEnGs,
                        brlEnGs,
                        subtotal
                    });
                }
                // 5. Enviar respuesta
                res.json({
                    totalEfectivoEnCajas: totalEnGs,
                    cantidadMaletines: estadoMaletines.size,
                    cotizacion: {
                        valorDolar,
                        valorReal,
                        fecha: cotizacion.fecha
                    },
                    detalles
                });
            }
            catch (error) {
                console.error('Error al obtener efectivo en cajas:', error);
                res.status(500).json({
                    error: 'Error al calcular el efectivo en cajas'
                });
            }
        });
    }
    /**
     * Obtiene un resumen completo para el componente ActivoPasivo
     */
    getResumenCompleto(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Aquí podemos implementar posteriormente la funcionalidad para obtener
                // todos los datos necesarios para el componente ActivoPasivo en una sola llamada
                res.status(501).json({
                    message: 'Funcionalidad aún no implementada'
                });
            }
            catch (error) {
                console.error('Error al obtener resumen completo:', error);
                res.status(500).json({
                    error: 'Error al obtener el resumen completo'
                });
            }
        });
    }
}
exports.default = new ResumenActivoPasivoController();
//# sourceMappingURL=resumenActivoPasivoController.js.map