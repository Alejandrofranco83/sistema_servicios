import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CotizacionModel } from '../models/cotizacion.model';

const prisma = new PrismaClient();

class ResumenActivoPasivoController {
  /**
   * Obtiene el efectivo total en cajas, calculado a partir de las cajas abiertas y cerradas
   */
  async getEfectivoEnCajas(req: Request, res: Response): Promise<void> {
    try {
      // 1. Obtener la cotización vigente para hacer conversiones
      const cotizacion = await CotizacionModel.findVigente();
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
      const cajasCerradas = await prisma.caja.findMany({
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
          } catch (e) {
            console.error('Error al parsear detallesDenominacionFinal:', e);
          }
          
          // Si no hay detalles, usamos los valores individuales
          const totalPYG = caja.saldoFinalPYG?.toNumber() || 0;
          const totalUSD = caja.saldoFinalUSD?.toNumber() || 0;
          const totalBRL = caja.saldoFinalBRL?.toNumber() || 0;
          
          // Si el maletín no está registrado o esta caja es más reciente, actualizamos
          if (!estadoMaletines.has(maletinId) || 
              (estadoMaletines.get(maletinId).tipo === 'cierre' && 
               new Date(caja.fechaCierre) > new Date(estadoMaletines.get(maletinId).fecha))) {
            
            estadoMaletines.set(maletinId, {
              tipo: 'cierre',
              cajaId: caja.cajaEnteroId,
              fecha: caja.fechaCierre,
              PYG: detalles?.total?.PYG || totalPYG,
              USD: detalles?.total?.USD || totalUSD,
              BRL: detalles?.total?.BRL || totalBRL
            });
          }
        }
      }

      // 3. Obtener cajas abiertas (estas tienen prioridad)
      const cajasAbiertas = await prisma.caja.findMany({
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
        } catch (e) {
          console.error('Error al parsear detallesDenominacion:', e);
        }
        
        // Si no hay detalles, usamos los valores individuales
        const totalPYG = caja.saldoInicialPYG?.toNumber() || 0;
        const totalUSD = caja.saldoInicialUSD?.toNumber() || 0;
        const totalBRL = caja.saldoInicialBRL?.toNumber() || 0;
        
        // Si el maletín no está registrado o no tiene una apertura o esta caja es más reciente
        if (!estadoMaletines.has(maletinId) || 
            estadoMaletines.get(maletinId).tipo === 'cierre' ||
            (estadoMaletines.get(maletinId).tipo === 'apertura' && 
             new Date(caja.fechaApertura) > new Date(estadoMaletines.get(maletinId).fecha))) {
          
          estadoMaletines.set(maletinId, {
            tipo: 'apertura',
            cajaId: caja.cajaEnteroId,
            fecha: caja.fechaApertura,
            PYG: detalles?.total?.PYG || totalPYG,
            USD: detalles?.total?.USD || totalUSD,
            BRL: detalles?.total?.BRL || totalBRL
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

    } catch (error) {
      console.error('Error al obtener efectivo en cajas:', error);
      res.status(500).json({ 
        error: 'Error al calcular el efectivo en cajas' 
      });
    }
  }

  /**
   * Obtiene un resumen completo para el componente ActivoPasivo
   */
  async getResumenCompleto(req: Request, res: Response): Promise<void> {
    try {
      // Aquí podemos implementar posteriormente la funcionalidad para obtener
      // todos los datos necesarios para el componente ActivoPasivo en una sola llamada
      
      res.status(501).json({ 
        message: 'Funcionalidad aún no implementada' 
      });
    } catch (error) {
      console.error('Error al obtener resumen completo:', error);
      res.status(500).json({ 
        error: 'Error al obtener el resumen completo' 
      });
    }
  }
}

export default new ResumenActivoPasivoController(); 