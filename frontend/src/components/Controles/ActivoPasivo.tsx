import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory2 as Inventory2Icon,
  LocalAtm as LocalAtmIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { obtenerPersonasConSaldo, SaldoPersona } from '../../services/usoDevolucionService';
import { useCotizacion } from '../../contexts/CotizacionContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Interfaz para las cotizaciones
interface Cotizaciones {
  USD: number;
  BRL: number;
}

interface BalanceItem {
  id: string;
  titulo: string;
  monto: number;
  moneda: string;
  icon: React.ReactNode;
  color: string;
}

const ActivoPasivo: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { cotizacionVigente, convertirDolaresAGuaranies, convertirRealesAGuaranies, refrescarCotizacion } = useCotizacion();
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [mensajeSnackbar, setMensajeSnackbar] = useState('');
  const [severidadSnackbar, setSeveridadSnackbar] = useState<'success' | 'error'>('success');
  const [balances, setBalances] = useState<BalanceItem[]>([
    {
      id: 'balance-farmacia',
      titulo: 'Balance con Farmacia',
      monto: 0,
      moneda: 'GS',
      icon: <StoreIcon />,
      color: theme.palette.primary.main
    },
    {
      id: 'balance-personas',
      titulo: 'Balance con Personas',
      monto: 0,
      moneda: 'GS',
      icon: <PeopleIcon />,
      color: theme.palette.secondary.main
    },
    {
      id: 'balance-aquipago',
      titulo: 'Balance Aqui Pago',
      monto: 0,
      moneda: 'GS',
      icon: <CreditCardIcon />,
      color: theme.palette.success.main
    },
    {
      id: 'balance-wepa-gs',
      titulo: 'Balance Wepa Gs',
      monto: 0,
      moneda: 'GS',
      icon: <CreditCardIcon />,
      color: theme.palette.warning.main
    },
    {
      id: 'balance-wepa-usd',
      titulo: 'Balance Wepa USD',
      monto: 0,
      moneda: 'USD',
      icon: <AttachMoneyIcon />,
      color: theme.palette.info.main
    },
    {
      id: 'efectivo-cajas',
      titulo: 'Efectivo en Cajas',
      monto: 0,
      moneda: 'GS',
      icon: <LocalAtmIcon />,
      color: theme.palette.error.main
    },
    {
      id: 'saldos-servicios',
      titulo: 'Saldos en Servicios',
      monto: 0,
      moneda: 'GS',
      icon: <Inventory2Icon />,
      color: theme.palette.grey[700]
    }
  ]);
  
  const [totalActivos, setTotalActivos] = useState(0);
  const [totalPasivos, setTotalPasivos] = useState(0);
  const [balanceGeneral, setBalanceGeneral] = useState(0);

  // Efectos
  useEffect(() => {
    cargarBalances();
  }, [cotizacionVigente]);

  // Función para cargar el balance de farmacia
  const cargarBalanceFarmacia = async () => {
    try {
      // Verificar si tenemos la cotización vigente
      if (!cotizacionVigente) {
        console.log('Cotización no disponible, esperando que se cargue...');
        await refrescarCotizacion();
        if (!cotizacionVigente) {
          console.error('No se pudo obtener la cotización vigente');
          throw new Error('No se pudo obtener la cotización vigente');
        }
      }

      console.log('Usando cotización vigente:', cotizacionVigente);

      // Realizar la misma llamada que hace BalanceFarmaciaLista
      const response = await axios.get(`${API_URL}/movimientos-farmacia`, {
        params: {
          page: 1,
          limit: 1 // Solo necesitamos obtener el total, no los movimientos
        }
      });

      // Obtener los balances exactos de cada moneda
      const guaraniesResponse = await axios.get(`${API_URL}/movimientos-farmacia`, {
        params: {
          monedaCodigo: 'PYG',
          soloTotal: true
        }
      });
      
      const dolaresResponse = await axios.get(`${API_URL}/movimientos-farmacia`, {
        params: {
          monedaCodigo: 'USD',
          soloTotal: true
        }
      });
      
      const realesResponse = await axios.get(`${API_URL}/movimientos-farmacia`, {
        params: {
          monedaCodigo: 'BRL',
          soloTotal: true
        }
      });

      // Obtener los saldos de cada moneda (respetando el signo)
      const saldoGuaranies = parseFloat(guaraniesResponse.data.totalBalancePYG || '0');
      const saldoDolares = parseFloat(dolaresResponse.data.totalBalanceUSD || '0');
      const saldoReales = parseFloat(realesResponse.data.totalBalanceBRL || '0');
      
      // Convertir dólares y reales a guaraníes usando el contexto de cotización
      // IMPORTANTE: Mantenemos el signo original (+ debemos, - nos deben)
      const saldoDolaresEnGs = saldoDolares * cotizacionVigente.valorDolar;
      const saldoRealesEnGs = saldoReales * cotizacionVigente.valorReal;
      
      // Calcular el balance total sumando algebraicamente (respetando signos)
      // En el contexto de farmacia:
      // - Un saldo positivo significa que debemos a farmacia
      // - Un saldo negativo significa que farmacia nos debe
      const balanceTotal = saldoGuaranies + saldoDolaresEnGs + saldoRealesEnGs;
      
      console.log('Balance Farmacia - Detalle:', {
        guaranies: saldoGuaranies,
        dolares: saldoDolares,
        cotizacionDolar: cotizacionVigente.valorDolar,
        dolaresEnGs: saldoDolaresEnGs,
        reales: saldoReales,
        cotizacionReal: cotizacionVigente.valorReal,
        realesEnGs: saldoRealesEnGs,
        balanceTotal: balanceTotal
      });
      
      // Actualizar el balance de farmacia en el estado
      setBalances(balancesPrevios => {
        const nuevosBalances = [...balancesPrevios];
        const indexFarmacia = nuevosBalances.findIndex(b => b.id === 'balance-farmacia');
        
        if (indexFarmacia !== -1) {
          // Si el balance es negativo, farmacia nos debe
          // Si es positivo, nosotros debemos a farmacia
          nuevosBalances[indexFarmacia] = {
            ...nuevosBalances[indexFarmacia],
            monto: Math.abs(balanceTotal),
            titulo: balanceTotal < 0 ? 'Farmacia nos debe' : 'Debemos a Farmacia'
          };
        }
        
        return nuevosBalances;
      });

      return Math.abs(balanceTotal);
    } catch (error) {
      console.error('Error al cargar el balance de farmacia:', error);
      throw error;
    }
  };

  // Función para cargar el balance de personas
  const cargarBalancePersonas = async () => {
    try {
      // Obtener todas las personas con saldo
      const personas = await obtenerPersonasConSaldo();
      
      // Verificar si tenemos la cotización vigente
      if (!cotizacionVigente) {
        console.error('No hay cotización vigente disponible');
        throw new Error('No hay cotización vigente disponible');
      }
      
      // Calcular saldo total sumando en guaraníes
      let balanceTotal = 0;
      let nosDebenTotal = 0;
      let debemosTotal = 0;
      
      personas.forEach(persona => {
        // Sumar guaraníes directamente
        const saldoGs = persona.guaranies || 0;
        
        // Convertir dólares a guaraníes usando el contexto
        const saldoDolaresEnGs = (persona.dolares || 0) * cotizacionVigente.valorDolar;
        
        // Convertir reales a guaraníes usando el contexto
        const saldoRealesEnGs = (persona.reales || 0) * cotizacionVigente.valorReal;
        
        // Calcular saldo total de esta persona en guaraníes
        const saldoTotalPersona = saldoGs + saldoDolaresEnGs + saldoRealesEnGs;
        
        // Agregar al total según sea positivo o negativo
        balanceTotal += saldoTotalPersona;
        
        // Si el saldo es negativo, nos deben (pasivo)
        if (saldoTotalPersona < 0) {
          nosDebenTotal += Math.abs(saldoTotalPersona);
        } 
        // Si el saldo es positivo, debemos (activo)
        else if (saldoTotalPersona > 0) {
          debemosTotal += saldoTotalPersona;
        }
      });
      
      // Actualizar el balance de personas en el estado
      setBalances(balancesPrevios => {
        const nuevosBalances = [...balancesPrevios];
        const indexPersonas = nuevosBalances.findIndex(b => b.id === 'balance-personas');
        
        if (indexPersonas !== -1) {
          // Mostrar el valor predominante (nosDebenTotal o debemosTotal)
          // Si nosDebenTotal > debemosTotal, entonces en total nos deben
          const mostrarValorNosDeben = nosDebenTotal > debemosTotal;
          
          nuevosBalances[indexPersonas] = {
            ...nuevosBalances[indexPersonas],
            monto: mostrarValorNosDeben ? nosDebenTotal : debemosTotal,
            titulo: mostrarValorNosDeben ? 'Personas nos deben' : 'Debemos a Personas'
          };
        }
        
        return nuevosBalances;
      });

      // Retornamos el balance neto (puede ser negativo o positivo)
      return balanceTotal;
    } catch (error) {
      console.error('Error al cargar el balance de personas:', error);
      throw error;
    }
  };

  // Función para cargar el balance de Aqui Pago
  const cargarBalanceAquipago = async () => {
    try {
      // Obtener fecha actual para usar como inicio y fin
      const hoy = new Date();
      const fechaFormateada = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Hacer la llamada a la API con la misma fecha como inicio y fin
      const response = await axios.get(`${API_URL}/aquipago/movimientos`, {
        params: {
          fechaInicio: fechaFormateada,
          fechaFin: fechaFormateada
        }
      });

      // Verificar si la respuesta contiene el valor totalADepositar
      const totalADepositar = response.data.totalADepositar || 0;
      
      // Actualizar el balance de Aqui Pago en el estado
      setBalances(balancesPrevios => {
        const nuevosBalances = [...balancesPrevios];
        const indexAquipago = nuevosBalances.findIndex(b => b.id === 'balance-aquipago');
        
        if (indexAquipago !== -1) {
          nuevosBalances[indexAquipago] = {
            ...nuevosBalances[indexAquipago],
            monto: Math.abs(totalADepositar),
            titulo: totalADepositar > 0 ? 'Aqui Pago - Por Depositar' : 'Aqui Pago - En Haber'
          };
        }
        
        return nuevosBalances;
      });

      return Math.abs(totalADepositar);
    } catch (error) {
      console.error('Error al cargar el balance de Aqui Pago:', error);
      throw error;
    }
  };

  // Función para cargar el balance de Wepa Gs
  const cargarBalanceWepaGs = async () => {
    try {
      // Usar el nuevo endpoint de balance global
      const response = await axios.get(`${API_URL}/weno-gs/balance-global`);

      // Verificar si la respuesta contiene el valor totalADepositar
      const totalADepositar = response.data.totalADepositar || 0;
      
      // Actualizar el balance de Wepa Gs en el estado
      setBalances(balancesPrevios => {
        const nuevosBalances = [...balancesPrevios];
        const indexWepaGs = nuevosBalances.findIndex(b => b.id === 'balance-wepa-gs');
        
        if (indexWepaGs !== -1) {
          nuevosBalances[indexWepaGs] = {
            ...nuevosBalances[indexWepaGs],
            monto: Math.abs(totalADepositar),
            titulo: totalADepositar > 0 ? 'Wepa Gs - Por Depositar' : 'Wepa Gs - En Haber'
          };
        }
        
        return nuevosBalances;
      });

      return Math.abs(totalADepositar);
    } catch (error) {
      console.error('Error al cargar el balance de Wepa Gs:', error);
      throw error;
    }
  };

  // Función para cargar el balance de Wepa USD
  const cargarBalanceWepaUsd = async () => {
    try {
      // Usar el nuevo endpoint de balance global en lugar de filtrar por fecha
      const response = await axios.get(`${API_URL}/wepa-usd/balance-global`);

      // Verificar si la respuesta contiene el valor totalADepositar
      const totalADepositar = response.data.totalADepositar || 0;
      
      // Actualizar el balance de Wepa USD en el estado
      setBalances(balancesPrevios => {
        const nuevosBalances = [...balancesPrevios];
        const indexWepaUsd = nuevosBalances.findIndex(b => b.id === 'balance-wepa-usd');
        
        if (indexWepaUsd !== -1) {
          nuevosBalances[indexWepaUsd] = {
            ...nuevosBalances[indexWepaUsd],
            monto: Math.abs(totalADepositar),
            titulo: totalADepositar > 0 ? 'Wepa USD - Por Depositar' : 'Wepa USD - En Haber'
          };
        }
        
        return nuevosBalances;
      });

      return Math.abs(totalADepositar);
    } catch (error) {
      console.error('Error al cargar el balance de Wepa USD:', error);
      throw error;
    }
  };

  // Función para cargar todos los balances
  const cargarBalances = async () => {
    setLoading(true);
    try {
      // Verificar si tenemos cotización vigente
      if (!cotizacionVigente) {
        console.log('Cotización no disponible al iniciar cargarBalances, refrescando...');
        await refrescarCotizacion();
      }
      
      // Verificar nuevamente después de intentar cargarla
      if (!cotizacionVigente) {
        console.error('No se pudo obtener la cotización vigente para los cálculos');
        setMensajeSnackbar('No se pudo obtener la cotización vigente');
        setSeveridadSnackbar('error');
        setOpenSnackbar(true);
      } else {
        console.log('Cotización vigente lista para cálculos:', cotizacionVigente);
      }
      
      // Obtener balance de farmacia real desde la API
      const balanceFarmaciaReal = await cargarBalanceFarmacia();
      
      // Obtener balance de personas real desde la API
      const balancePersonasReal = await cargarBalancePersonas();
      
      // Obtener balance de Aqui Pago real desde la API
      const balanceAquipagoReal = await cargarBalanceAquipago();
      
      // Obtener balance de Wepa Gs real desde la API
      const balanceWepaGsReal = await cargarBalanceWepaGs();
      
      // Obtener balance de Wepa USD real desde la API
      const balanceWepaUsdReal = await cargarBalanceWepaUsd();
      
      // Obtener el efectivo en cajas desde el nuevo endpoint
      const efectivoEnCajas = await obtenerEfectivoEnCajas();
      
      setTimeout(() => {
        setBalances(prevBalances => {
          const nuevosBalances = [...prevBalances];
          // Los balances de farmacia, personas, aquipago, wepa gs y wepa usd ya fueron actualizados
          nuevosBalances[5].monto = efectivoEnCajas; // Efectivo en Cajas con valor real
          nuevosBalances[6].monto = 6500000; // Saldos en Servicios
          
          return nuevosBalances;
        });
        
        // Calcular totales para el balance general
        calcularTotales();
        
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al cargar balances:', error);
      setMensajeSnackbar('Error al cargar los balances');
      setSeveridadSnackbar('error');
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  // Función para obtener el efectivo en cajas desde el nuevo endpoint
  const obtenerEfectivoEnCajas = async (): Promise<number> => {
    try {
      console.log('Obteniendo efectivo en cajas desde el nuevo endpoint...');
      const response = await axios.get(`${API_URL}/activo-pasivo/efectivo-en-cajas`);
      
      if (!response.data || typeof response.data.totalEfectivoEnCajas !== 'number') {
        console.error('Respuesta inválida del endpoint de efectivo en cajas:', response.data);
        return 0;
      }
      
      const totalEfectivo = response.data.totalEfectivoEnCajas;
      console.log(`Total efectivo en cajas: ${totalEfectivo}`);
      
      // Actualizar el ítem en el estado de balances
      setBalances(balancesPrevios => {
        const nuevosBalances = [...balancesPrevios];
        const index = nuevosBalances.findIndex(b => b.id === 'efectivo-cajas');
        
        if (index !== -1) {
          nuevosBalances[index] = {
            ...nuevosBalances[index],
            monto: totalEfectivo
          };
        }
        
        return nuevosBalances;
      });
      
      return totalEfectivo;
    } catch (error) {
      console.error('Error al obtener efectivo en cajas:', error);
      
      // Si ocurre un error con el nuevo endpoint, intentar con el método antiguo
      console.log('Intentando método alternativo para obtener efectivo en cajas...');
      return obtenerEfectivoEnCajasAntiguo();
    }
  };

  // Renombrar la implementación antigua como método de respaldo
  const obtenerEfectivoEnCajasAntiguo = async (): Promise<number> => {
    if (!cotizacionVigente) {
      console.error('No hay cotización vigente disponible para convertir monedas');
      return 0;
    }

    try {
      // Mapa para almacenar el último estado de cada maletín - La clave es el maletinId
      const estadoMaletines = new Map();
      
      // 1. Obtener TODAS las cajas cerradas directamente (para asegurar tener las más recientes)
      console.log('Obteniendo todas las cajas cerradas...');
      const respCajasCerradas = await axios.get(`${API_URL}/cajas?estado=cerrada`);
      const cajasCerradas = respCajasCerradas.data || [];
      console.log(`Encontradas ${cajasCerradas.length} cajas cerradas`);
      
      // Procesar cada caja cerrada (esto nos dará todas, no solo las que aparecen en comparaciones)
      cajasCerradas.forEach((caja: any) => {
        if (caja.saldoFinal && caja.saldoFinal.total) {
          const maletinId = caja.maletinId;
          const cajaId = caja.cajaEnteroId;
          
          // Convertir la fecha a objeto Date para comparación correcta
          let fechaCierre = new Date(0); // Inicializar con fecha mínima
          if (caja.fechaCierre) {
            fechaCierre = new Date(caja.fechaCierre);
          }
          
          // Obtener los valores del saldo final
          const saldoPYG = caja.saldoFinal.total.PYG || 0;
          const saldoUSD = caja.saldoFinal.total.USD || 0;
          const saldoBRL = caja.saldoFinal.total.BRL || 0;
          
          console.log(`Maletín ${maletinId} - Caja cerrada ${cajaId}: PYG=${saldoPYG}, USD=${saldoUSD}, BRL=${saldoBRL}, Fecha=${fechaCierre.toISOString()}`);
          
          // Si el maletín no está registrado, agregarlo directamente
          if (!estadoMaletines.has(maletinId)) {
            estadoMaletines.set(maletinId, {
              tipo: 'cierre',
              cajaId,
              fecha: fechaCierre,
              fechaString: caja.fechaCierre,
              PYG: saldoPYG,
              USD: saldoUSD,
              BRL: saldoBRL
            });
            console.log(`✅ Registrado maletín ${maletinId} con saldo de cierre de caja ${cajaId}`);
          } else {
            // El maletín ya existe, verificar si este cierre es más reciente
            const maletinExistente = estadoMaletines.get(maletinId);
            
            // Solo comparamos con otros cierres (las aperturas siempre tienen prioridad)
            if (maletinExistente.tipo === 'cierre') {
              const fechaExistente = new Date(maletinExistente.fecha);
              
              console.log(`Comparando fechas para maletín ${maletinId}:`);
              console.log(`- Existente: ${fechaExistente.toISOString()} (${maletinExistente.cajaId})`);
              console.log(`- Nueva: ${fechaCierre.toISOString()} (${cajaId})`);
              
              // Si la fecha nueva es más reciente, actualizar
              if (fechaCierre > fechaExistente) {
                estadoMaletines.set(maletinId, {
                  tipo: 'cierre',
                  cajaId,
                  fecha: fechaCierre,
                  fechaString: caja.fechaCierre,
                  PYG: saldoPYG,
                  USD: saldoUSD,
                  BRL: saldoBRL
                });
                console.log(`🔄 Actualizado maletín ${maletinId} con cierre más reciente (caja ${cajaId})`);
              } else {
                console.log(`❌ Descartado cierre del maletín ${maletinId} (caja ${cajaId}) por ser más antiguo`);
              }
            } else {
              console.log(`⏩ Ignorando cierre del maletín ${maletinId} porque ya tiene un registro de apertura`);
            }
          }
        }
      });
      
      // 2. Obtener datos de comparaciones como respaldo (por si acaso)
      console.log('Obteniendo comparaciones de maletines (verificación adicional)...');
      const respComparaciones = await axios.get(`${API_URL}/diferencias/maletines/comparaciones`);
      const comparaciones = respComparaciones.data.comparaciones || [];
      console.log(`Encontradas ${comparaciones.length} comparaciones de maletines`);
      
      // Solo procesar los que no tenemos o si tienen datos más recientes
      comparaciones.forEach((comp: any) => {
        if (comp.cajaAnterior && comp.cajaAnterior.saldoFinal) {
          const maletinId = comp.cajaAnterior.maletinId;
          const cajaId = comp.cajaAnterior.cajaEnteroId;
          
          // Convertir la fecha a objeto Date para comparación correcta
          let fechaCierre = new Date(0); // Inicializar con fecha mínima
          if (comp.cajaAnterior.fechaCierre) {
            fechaCierre = new Date(comp.cajaAnterior.fechaCierre);
          }
          
          // Verificar si ya tenemos este maletín o si tenemos un dato más reciente
          if (estadoMaletines.has(maletinId)) {
            const maletinExistente = estadoMaletines.get(maletinId);
            
            // Solo comparar con otros cierres y si es más reciente
            if (maletinExistente.tipo === 'cierre') {
              const fechaExistente = new Date(maletinExistente.fecha);
              
              // Si la fecha actual es más antigua, ignoramos
              if (fechaCierre <= fechaExistente) {
                console.log(`⏩ Ignorando comparación de maletín ${maletinId} (caja ${cajaId}) porque ya tenemos un cierre más reciente`);
                return; // Saltar a la siguiente iteración
              }
            } else {
              // Si ya tenemos una apertura, ignoramos los cierres
              console.log(`⏩ Ignorando comparación de maletín ${maletinId} porque ya tiene un registro de apertura`);
              return; // Saltar a la siguiente iteración
            }
          }
          
          // Llegados a este punto, o no tenemos el maletín o tenemos uno más antiguo
          const saldoPYG = comp.cajaAnterior.saldoFinal.total.PYG || 0;
          const saldoUSD = comp.cajaAnterior.saldoFinal.total.USD || 0;
          const saldoBRL = comp.cajaAnterior.saldoFinal.total.BRL || 0;
          
          console.log(`Maletín ${maletinId} - Comparación caja ${cajaId}: PYG=${saldoPYG}, USD=${saldoUSD}, BRL=${saldoBRL}, Fecha=${fechaCierre.toISOString()}`);
          
          estadoMaletines.set(maletinId, {
            tipo: 'cierre',
            cajaId,
            fecha: fechaCierre,
            fechaString: comp.cajaAnterior.fechaCierre,
            PYG: saldoPYG,
            USD: saldoUSD,
            BRL: saldoBRL
          });
          
          console.log(`✅ Actualizado maletín ${maletinId} con saldo de comparación (caja ${cajaId})`);
        }
      });
      
      // 3. Obtener cajas abiertas (estas tienen prioridad sobre todo lo demás)
      console.log('Obteniendo cajas abiertas...');
      const respCajas = await axios.get(`${API_URL}/cajas?estado=abierta`);
      const cajasAbiertas = respCajas.data || [];
      console.log(`Encontradas ${cajasAbiertas.length} cajas abiertas`);
      
      // Ordenar cajas abiertas por fecha (de más reciente a más antigua)
      cajasAbiertas.sort((a: any, b: any) => {
        const fechaA = a.fechaApertura ? new Date(a.fechaApertura).getTime() : 0;
        const fechaB = b.fechaApertura ? new Date(b.fechaApertura).getTime() : 0;
        return fechaB - fechaA; // Orden descendente (más reciente primero)
      });
      
      // Procesar cajas abiertas, que tienen prioridad sobre las cerradas
      cajasAbiertas.forEach((caja: any) => {
        if (caja.saldoInicial && caja.saldoInicial.total) {
          const maletinId = caja.maletinId;
          const cajaId = caja.cajaEnteroId;
          
          // Convertir la fecha a objeto Date para registro consistente
          let fechaApertura = new Date(0);
          if (caja.fechaApertura) {
            fechaApertura = new Date(caja.fechaApertura);
          }
          
          // Obtener saldos iniciales
          const saldoPYG = caja.saldoInicial.total.PYG || 0;
          const saldoUSD = caja.saldoInicial.total.USD || 0;
          const saldoBRL = caja.saldoInicial.total.BRL || 0;
          
          console.log(`Maletín ${maletinId} - Caja abierta ${cajaId}: PYG=${saldoPYG}, USD=${saldoUSD}, BRL=${saldoBRL}, Fecha=${fechaApertura.toISOString()}`);
          
          // Si el maletín ya tiene una entrada de apertura, verificar cuál es más reciente
          if (estadoMaletines.has(maletinId) && estadoMaletines.get(maletinId).tipo === 'apertura') {
            const maletinExistente = estadoMaletines.get(maletinId);
            const fechaExistente = new Date(maletinExistente.fecha);
            
            // Si la apertura actual es más antigua, no actualizamos
            if (fechaApertura <= fechaExistente) {
              console.log(`❌ Ignorando apertura más antigua del maletín ${maletinId} (caja ${cajaId})`);
              return; // Saltar a la siguiente iteración
            }
          }
          
          // Las cajas abiertas tienen prioridad o esta es más reciente que la existente
          estadoMaletines.set(maletinId, {
            tipo: 'apertura',
            cajaId,
            fecha: fechaApertura,
            fechaString: caja.fechaApertura,
            PYG: saldoPYG,
            USD: saldoUSD,
            BRL: saldoBRL
          });
          
          console.log(`✅ Maletín ${maletinId} actualizado con saldo de apertura de caja ${cajaId}`);
        }
      });
      
      // 4. Calcular el total en guaraníes
      let totalEnGs = 0;
      
      // Limpiar el mapa para eliminar duplicados por maletinId
      const maletinesUnicos = new Map();
      estadoMaletines.forEach((maletin, maletinId) => {
        // Si ya existe un maletín con este ID, solo mantener el más reciente
        if (maletinesUnicos.has(maletinId)) {
          const maletinExistente = maletinesUnicos.get(maletinId);
          
          // Comparar fechas y tipos
          // Si el existente es apertura y el nuevo es cierre, mantener apertura
          if (maletinExistente.tipo === 'apertura' && maletin.tipo === 'cierre') {
            console.log(`⚠️ Manteniendo apertura sobre cierre para maletín ${maletinId}`);
            return; // Saltamos esta iteración
          }
          
          // Si ambos son del mismo tipo, comparar fechas
          if (maletinExistente.tipo === maletin.tipo) {
            const fechaExistente = new Date(maletinExistente.fecha);
            const fechaNueva = new Date(maletin.fecha);
            
            // Si la fecha existente es más reciente, mantenemos esa
            if (fechaExistente >= fechaNueva) {
              console.log(`⚠️ Manteniendo registro más reciente para maletín ${maletinId}`);
              return; // Saltamos esta iteración
            }
          }
        }
        
        // Si llegamos aquí, o no existe el maletín o este es más reciente/prioritario
        maletinesUnicos.set(maletinId, maletin);
      });
      
      console.log('===== RESUMEN DE MALETINES DESPUÉS DE LIMPIEZA =====');
      console.log(`Total maletines: ${maletinesUnicos.size}`);
      
      // Ahora calcular con el mapa limpio
      maletinesUnicos.forEach((maletin, maletinId) => {
        let subtotal = 0;
        
        // Sumar guaraníes directamente
        subtotal += maletin.PYG || 0;
        
        // Convertir USD a guaraníes
        let usdEnGs = 0;
        if (maletin.USD && maletin.USD > 0) {
          usdEnGs = maletin.USD * cotizacionVigente.valorDolar;
          subtotal += usdEnGs;
        }
        
        // Convertir BRL a guaraníes
        let brlEnGs = 0;
        if (maletin.BRL && maletin.BRL > 0) {
          brlEnGs = maletin.BRL * cotizacionVigente.valorReal;
          subtotal += brlEnGs;
        }
        
        totalEnGs += subtotal;
        
        console.log(`Maletín ${maletinId}, Tipo: ${maletin.tipo}, Caja: ${maletin.cajaId}, Fecha: ${new Date(maletin.fecha).toISOString()}`);
        console.log(`PYG: ${maletin.PYG}, USD: ${maletin.USD} (${usdEnGs} Gs), BRL: ${maletin.BRL} (${brlEnGs} Gs), Subtotal: ${subtotal} Gs`);
      });
      
      console.log('===== TOTAL =====');
      console.log(`Total efectivo en cajas: ${totalEnGs} Gs (${maletinesUnicos.size} maletines)`);
      
      return totalEnGs;
    } catch (error) {
      console.error('Error al obtener efectivo en cajas:', error);
      return 0;
    }
  };

  // Calcular totales basados en los balances actuales
  const calcularTotales = () => {
    // Verificar si tenemos cotización vigente para los cálculos
    if (!cotizacionVigente) {
      console.error('Sin cotización vigente para cálculo de totales');
      return;
    }
    
    const activos = balances.reduce((acc, item) => 
      acc + (item.moneda === 'GS' ? item.monto : item.monto * cotizacionVigente.valorDolar), 0);
    const pasivos = 0; // Aquí se sumarían los pasivos si los hubiera
    
    setTotalActivos(activos);
    setTotalPasivos(pasivos);
    setBalanceGeneral(activos - pasivos);
  };

  // Función para formatear valores monetarios
  const formatearMonto = (monto: number, moneda: string) => {
    if (moneda === 'GS') {
      return new Intl.NumberFormat('es-PY').format(monto);
    } else {
      return new Intl.NumberFormat('es-PY', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(monto);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h5" component="h2" gutterBottom>
              <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Activos y Pasivos
            </Typography>
          </Grid>
          <Grid item>
            <Tooltip title="Actualizar balances">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={cargarBalances}
                disabled={loading}
              >
                Actualizar
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Cargando balances...
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {balances.map((balance) => (
                <Grid item xs={12} sm={6} md={4} key={balance.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderLeft: `4px solid ${balance.color}`,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${balance.color}20`,
                            color: balance.color,
                            borderRadius: '50%',
                            p: 1,
                            mr: 2
                          }}
                        >
                          {balance.icon}
                        </Box>
                        <Typography variant="h6" component="div">
                          {balance.titulo}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="h5" component="div" sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {balance.moneda === 'GS' ? (
                          `${formatearMonto(balance.monto, balance.moneda)} Gs`
                        ) : (
                          `US$ ${formatearMonto(balance.monto, balance.moneda)}`
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.default }}>
              <Typography variant="h6" gutterBottom>
                Balance General
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.success.light,
                    borderRadius: 1,
                    color: theme.palette.success.contrastText
                  }}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon fontSize="small" sx={{ mr: 1 }} />
                      Total Activos
                    </Typography>
                    <Typography variant="h5">{formatearMonto(totalActivos, 'GS')} Gs</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.error.light,
                    borderRadius: 1,
                    color: theme.palette.error.contrastText
                  }}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingDownIcon fontSize="small" sx={{ mr: 1 }} />
                      Total Pasivos
                    </Typography>
                    <Typography variant="h5">{formatearMonto(totalPasivos, 'GS')} Gs</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: balanceGeneral >= 0 ? theme.palette.info.light : theme.palette.warning.light,
                    borderRadius: 1,
                    color: balanceGeneral >= 0 ? theme.palette.info.contrastText : theme.palette.warning.contrastText
                  }}>
                    <Typography variant="subtitle1">Balance Neto</Typography>
                    <Typography variant="h5">
                      {balanceGeneral >= 0 ? '+' : ''}{formatearMonto(balanceGeneral, 'GS')} Gs
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Paper>

      {/* Snackbar para mensajes */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={severidadSnackbar} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {mensajeSnackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ActivoPasivo; 