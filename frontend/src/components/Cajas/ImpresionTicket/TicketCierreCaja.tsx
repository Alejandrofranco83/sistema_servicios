import React, { useRef, useState, useEffect } from 'react';
import { Button, Box, Dialog, DialogContent, DialogActions, IconButton } from '@mui/material';
import { Print as PrintIcon, Visibility as VisibilityIcon, Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearIdCaja, formatearMontoConSeparadores } from '../helpers';
import './TicketStyles.css';
import axios from 'axios';

interface TicketProps {
  cajaSeleccionada: any;
  diferenciasEfectivo?: {
    PYG: number;
    BRL: number;
    USD: number;
  };
  diferenciasServicios?: Array<{
    servicio: string;
    montoInicial: number;
    montoFinal: number;
    diferencia: number;
  }>;
  diferenciaTotal?: number;
}

// Componente para el contenido del ticket
const TicketContenido: React.FC<TicketProps> = (
  { cajaSeleccionada, diferenciasEfectivo, diferenciasServicios, diferenciaTotal }
) => {
  // Verificar si la caja está cerrada
  const estaAbierta = cajaSeleccionada.estado === 'abierta';
  
  // Estado para almacenar los retiros de la caja
  const [retiros, setRetiros] = useState<{
    montoPYG: number;
    montoBRL: number;
    montoUSD: number;
  }[]>([]);

  // Cargar los retiros cuando se monta el componente
  useEffect(() => {
    if (cajaSeleccionada && cajaSeleccionada.id) {
      cargarRetiros();
    }
  }, [cajaSeleccionada]);

  // Función para cargar los retiros de la caja
  const cargarRetiros = async () => {
    if (!cajaSeleccionada || !cajaSeleccionada.id) return;
    
    try {
      console.log(`Cargando retiros para caja ID: ${cajaSeleccionada.id}`);
      const resRetiros = await axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/retiros`);
      
      if (resRetiros.data && Array.isArray(resRetiros.data)) {
        setRetiros(resRetiros.data);
        console.log("Retiros cargados:", resRetiros.data);
      } else {
        console.warn("No se recibieron datos de retiros válidos");
        setRetiros([]);
      }
    } catch (error) {
      console.error('Error al cargar retiros:', error);
      setRetiros([]);
    }
  };

  // Calcular totales de retiros por moneda
  const totalRetirosPYG = retiros.reduce((sum, retiro) => sum + (Number(retiro.montoPYG) || 0), 0);
  const totalRetirosBRL = retiros.reduce((sum, retiro) => sum + (Number(retiro.montoBRL) || 0), 0);
  const totalRetirosUSD = retiros.reduce((sum, retiro) => sum + (Number(retiro.montoUSD) || 0), 0);
  
  // Verificar que los saldos iniciales existan
  const saldoInicialPYG = cajaSeleccionada.saldoInicial?.total?.PYG || 0;
  const saldoInicialBRL = cajaSeleccionada.saldoInicial?.total?.BRL || 0;
  const saldoInicialUSD = cajaSeleccionada.saldoInicial?.total?.USD || 0;
  
  return (
    <div id="ticket-imprimir" className="ticket-impresion">
      {/* Encabezado */}
      <div className="ticket-header">
        <h3 className="ticket-titulo">COMPROBANTE DE CIERRE</h3>
        <p className="ticket-sucursal">{cajaSeleccionada.sucursal?.nombre || 'N/A'}</p>
        <p className="ticket-fecha">
          Fecha: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        </p>
      </div>
      
      <div className="ticket-linea-divisoria">--------------------------------</div>
      
      {/* Información de la caja */}
      <div className="ticket-info">
        <p className="ticket-info-item">Caja #{cajaSeleccionada.cajaEnteroId}</p>
        <p className="ticket-info-item">Usuario: {cajaSeleccionada.usuario}</p>
        <p className="ticket-info-item">
          Apertura: {format(new Date(cajaSeleccionada.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}
        </p>
        {cajaSeleccionada.fechaCierre && (
          <p className="ticket-info-item">
            Cierre: {format(new Date(cajaSeleccionada.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
        )}
      </div>
      
      <div className="ticket-linea-divisoria">--------------------------------</div>
      
      {/* Saldos de apertura */}
      <h4 className="ticket-subtitulo">SALDOS DE APERTURA</h4>
      
      <div className="ticket-saldos">
        <div className="ticket-linea">
          <span className="ticket-concepto">Guaraníes:</span>
          <span className="ticket-monto">
            {formatearMontoConSeparadores(saldoInicialPYG)}
          </span>
        </div>
        <div className="ticket-linea">
          <span className="ticket-concepto">Reales:</span>
          <span className="ticket-monto">
            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              .format(saldoInicialBRL)}
          </span>
        </div>
        <div className="ticket-linea">
          <span className="ticket-concepto">Dólares:</span>
          <span className="ticket-monto">
            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              .format(saldoInicialUSD)}
          </span>
        </div>
      </div>
      
      <div className="ticket-linea-divisoria">--------------------------------</div>
      
      {/* Saldos de cierre */}
      <h4 className="ticket-subtitulo">SALDOS DE CIERRE</h4>
      
      {/* Efectivo */}
      <div className="ticket-saldos">
        <div className="ticket-linea">
          <span className="ticket-concepto">Guaraníes:</span>
          <span className="ticket-monto">
            {!estaAbierta ? formatearMontoConSeparadores(cajaSeleccionada.saldoFinal?.total?.PYG || 0) : '-'}
          </span>
        </div>
        <div className="ticket-linea">
          <span className="ticket-concepto">Reales:</span>
          <span className="ticket-monto">
            {!estaAbierta ? 
              new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                .format(cajaSeleccionada.saldoFinal?.total?.BRL || 0) : '-'}
          </span>
        </div>
        <div className="ticket-linea">
          <span className="ticket-concepto">Dólares:</span>
          <span className="ticket-monto">
            {!estaAbierta ? 
              new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                .format(cajaSeleccionada.saldoFinal?.total?.USD || 0) : '-'}
          </span>
        </div>
      </div>
      
      {/* Retiros */}
      {!estaAbierta && (
        <>
          <div className="ticket-linea-divisoria">--------------------------------</div>
          <h4 className="ticket-subtitulo">RETIROS</h4>
          
          <div className="ticket-saldos">
            <div className="ticket-linea">
              <span className="ticket-concepto">Guaraníes:</span>
              <span className="ticket-monto">
                {formatearMontoConSeparadores(totalRetirosPYG)}
              </span>
            </div>
            <div className="ticket-linea">
              <span className="ticket-concepto">Reales:</span>
              <span className="ticket-monto">
                {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  .format(totalRetirosBRL)}
              </span>
            </div>
            <div className="ticket-linea">
              <span className="ticket-concepto">Dólares:</span>
              <span className="ticket-monto">
                {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  .format(totalRetirosUSD)}
              </span>
            </div>
          </div>
        </>
      )}
      
      {/* Diferencias */}
      {!estaAbierta && diferenciasEfectivo && (
        <>
          <div className="ticket-linea-divisoria">--------------------------------</div>
          <h4 className="ticket-subtitulo">DIFERENCIAS</h4>
          
          <div className="ticket-saldos">
            {/* Mostrar diferencia total si existe */}
            {diferenciaTotal !== undefined && (
              <div className="ticket-linea">
                <span className="ticket-concepto">Diferencia Total:</span>
                <span className={`ticket-monto ${diferenciaTotal !== 0 ? (diferenciaTotal > 0 ? 'ticket-positivo' : 'ticket-negativo') : ''}`}>
                  {formatearMontoConSeparadores(diferenciaTotal)}
                </span>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Diferencias en servicios */}
      {!estaAbierta && diferenciasServicios && diferenciasServicios.length > 0 && (
        <>
          <h4 className="ticket-subtitulo">DIFERENCIAS SERVICIOS</h4>
          <div className="ticket-saldos">
            {diferenciasServicios
              .filter(servicio => servicio.servicio !== 'Efectivo')
              .map((servicio, index) => (
              <div key={`dif-servicio-${index}`} className="ticket-linea">
                <span className="ticket-concepto">{servicio.servicio}:</span>
                <span className={`ticket-monto ${servicio.diferencia !== 0 ? (servicio.diferencia > 0 ? 'ticket-positivo' : 'ticket-negativo') : ''}`}>
                  {formatearMontoConSeparadores(servicio.diferencia)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      
      <div className="ticket-linea-divisoria">--------------------------------</div>
      
      {/* Firma */}
      <div className="ticket-firmas">
        <div className="ticket-firma">
          <div className="ticket-linea-firma">_______________</div>
          <p>Firma Cajero</p>
        </div>
        
        <div className="ticket-firma">
          <div className="ticket-linea-firma">_______________</div>
          <p>Firma Supervisor</p>
        </div>
      </div>
      
      {/* Pie de página */}
      <div className="ticket-footer">
        <p>Impreso el: {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</p>
      </div>
    </div>
  );
};

// Componente principal que maneja la impresión
const TicketCierreCaja: React.FC<TicketProps> = (props) => {
  const [vistaPrevia, setVistaPrevia] = useState(false);
  
  // Función para abrir la vista previa
  const abrirVistaPrevia = () => {
    setVistaPrevia(true);
  };
  
  // Función para cerrar la vista previa
  const cerrarVistaPrevia = () => {
    setVistaPrevia(false);
  };
  
  // Función para manejar la impresión usando window.print
  const handlePrint = () => {
    // Obtener referencia a la caja seleccionada desde props
    const cajaSeleccionada = props.cajaSeleccionada;
    
    // Verificar si la caja está cerrada
    const estaAbierta = cajaSeleccionada.estado === 'abierta';
    
    // Variables para retiros
    let totalRetirosPYG = 0;
    let totalRetirosBRL = 0;
    let totalRetirosUSD = 0;
    
    // Función interna para imprimir
    const imprimirTicket = () => {
      // Acceder a las diferencias desde props
      const { diferenciasEfectivo, diferenciasServicios, diferenciaTotal } = props;
      
      // Crear un iframe oculto para la impresión
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'absolute';
      printIframe.style.top = '-9999px';
      printIframe.style.left = '-9999px';
      document.body.appendChild(printIframe);
      
      // Obtener el documento del iframe
      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      
      if (iframeDoc) {
        // Agregar estilos necesarios
        iframeDoc.write(`
          <html>
            <head>
              <title>Ticket de Cierre</title>
              <style>
                @page { 
                  size: 58mm auto; 
                  margin: 0mm; 
                }
                body { 
                  margin: 0;
                  padding: 0;
                  font-family: Arial, sans-serif;
                }
                .ticket-impresion {
                  width: 58mm;
                  padding: 5px;
                }
                /* Otros estilos necesarios */
                .ticket-header { text-align: center; }
                .ticket-titulo { margin: 0; font-size: 14px; }
                .ticket-sucursal { margin: 2px 0; font-size: 12px; }
                .ticket-fecha { margin: 2px 0; font-size: 10px; }
                .ticket-info { font-size: 10px; }
                .ticket-info-item { margin: 2px 0; }
                .ticket-linea-divisoria { border-top: 1px dashed #000; margin: 5px 0; font-size: 10px; }
                .ticket-subtitulo { margin: 5px 0; font-size: 12px; text-align: center; }
                .ticket-saldos { font-size: 10px; }
                .ticket-linea { display: flex; justify-content: space-between; margin: 2px 0; }
                .ticket-concepto { flex: 1; }
                .ticket-monto { text-align: right; }
                .ticket-positivo { color: green; }
                .ticket-negativo { color: red; }
                .ticket-firmas { display: flex; justify-content: space-between; margin-top: 20px; }
                .ticket-firma { text-align: center; flex: 1; }
                .ticket-linea-firma { border-top: 1px solid #000; margin: 0 10px; }
                .ticket-footer { text-align: center; font-size: 9px; margin-top: 10px; }
              </style>
            </head>
            <body>
            </body>
          </html>
        `);
        
        // Cerrar el documento para terminar de escribir
        iframeDoc.close();
        
        // Crear el contenido del ticket
        const ticketHTML = `
          <div class="ticket-header">
            <h3 class="ticket-titulo">COMPROBANTE DE CIERRE</h3>
            <p class="ticket-sucursal">${cajaSeleccionada.sucursal?.nombre || 'N/A'}</p>
            <p class="ticket-fecha">Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          </div>
          
          <div class="ticket-linea-divisoria">--------------------------------</div>
          
          <div class="ticket-info">
            <p class="ticket-info-item">Caja #${cajaSeleccionada.cajaEnteroId}</p>
            <p class="ticket-info-item">Usuario: ${cajaSeleccionada.usuario}</p>
            <p class="ticket-info-item">Apertura: ${format(new Date(cajaSeleccionada.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            ${cajaSeleccionada.fechaCierre ? 
              `<p class="ticket-info-item">Cierre: ${format(new Date(cajaSeleccionada.fechaCierre), 'dd/MM/yyyy HH:mm', { locale: es })}</p>` : 
              ''}
          </div>
          
          <div class="ticket-linea-divisoria">--------------------------------</div>
          
          <h4 class="ticket-subtitulo">SALDOS DE APERTURA</h4>
          <div class="ticket-saldos">
            <div class="ticket-linea">
              <span class="ticket-concepto">Guaraníes:</span>
              <span class="ticket-monto">${formatearMontoConSeparadores(cajaSeleccionada.saldoInicial?.total?.PYG || 0)}</span>
            </div>
            <div class="ticket-linea">
              <span class="ticket-concepto">Reales:</span>
              <span class="ticket-monto">${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoInicial?.total?.BRL || 0)}</span>
            </div>
            <div class="ticket-linea">
              <span class="ticket-concepto">Dólares:</span>
              <span class="ticket-monto">${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoInicial?.total?.USD || 0)}</span>
            </div>
          </div>
          
          <div class="ticket-linea-divisoria">--------------------------------</div>
          
          <h4 class="ticket-subtitulo">SALDOS DE CIERRE</h4>
          <div class="ticket-saldos">
            <div class="ticket-linea">
              <span class="ticket-concepto">Guaraníes:</span>
              <span class="ticket-monto">${!estaAbierta ? formatearMontoConSeparadores(cajaSeleccionada.saldoFinal?.total?.PYG || 0) : '-'}</span>
            </div>
            <div class="ticket-linea">
              <span class="ticket-concepto">Reales:</span>
              <span class="ticket-monto">${!estaAbierta ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoFinal?.total?.BRL || 0) : '-'}</span>
            </div>
            <div class="ticket-linea">
              <span class="ticket-concepto">Dólares:</span>
              <span class="ticket-monto">${!estaAbierta ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cajaSeleccionada.saldoFinal?.total?.USD || 0) : '-'}</span>
            </div>
          </div>
          
          ${!estaAbierta ? `
            <div class="ticket-linea-divisoria">--------------------------------</div>
            <h4 class="ticket-subtitulo">RETIROS</h4>
            <div class="ticket-saldos">
              <div class="ticket-linea">
                <span class="ticket-concepto">Guaraníes:</span>
                <span class="ticket-monto">${formatearMontoConSeparadores(totalRetirosPYG)}</span>
              </div>
              <div class="ticket-linea">
                <span class="ticket-concepto">Reales:</span>
                <span class="ticket-monto">${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalRetirosBRL)}</span>
              </div>
              <div class="ticket-linea">
                <span class="ticket-concepto">Dólares:</span>
                <span class="ticket-monto">${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalRetirosUSD)}</span>
              </div>
            </div>
          ` : ''}
          
          ${!estaAbierta && diferenciasEfectivo ? `
            <div class="ticket-linea-divisoria">--------------------------------</div>
            <h4 class="ticket-subtitulo">DIFERENCIAS</h4>
            <div class="ticket-saldos">
              ${diferenciaTotal !== undefined ? `
                <div class="ticket-linea">
                  <span class="ticket-concepto">Diferencia Total:</span>
                  <span class="ticket-monto ${diferenciaTotal !== 0 ? (diferenciaTotal > 0 ? 'ticket-positivo' : 'ticket-negativo') : ''}">${formatearMontoConSeparadores(diferenciaTotal)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${!estaAbierta && diferenciasServicios && diferenciasServicios.length > 0 ? `
            <h4 class="ticket-subtitulo">DIFERENCIAS SERVICIOS</h4>
            <div class="ticket-saldos">
              ${diferenciasServicios
                .filter((servicio: any) => servicio.servicio !== 'Efectivo')
                .map((servicio: any) => `
                  <div class="ticket-linea">
                    <span class="ticket-concepto">${servicio.servicio}:</span>
                    <span class="ticket-monto ${servicio.diferencia !== 0 ? (servicio.diferencia > 0 ? 'ticket-positivo' : 'ticket-negativo') : ''}">${formatearMontoConSeparadores(servicio.diferencia)}</span>
                  </div>
                `).join('')}
            </div>
          ` : ''}
          
          <div class="ticket-linea-divisoria">--------------------------------</div>
          
          <div class="ticket-firmas">
            <div class="ticket-firma">
              <div class="ticket-linea-firma">_______________</div>
              <p>Firma Cajero</p>
            </div>
            
            <div class="ticket-firma">
              <div class="ticket-linea-firma">_______________</div>
              <p>Firma Supervisor</p>
            </div>
          </div>
          
          <div class="ticket-footer">
            <p>Impreso el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</p>
          </div>
        `;
        
        // Renderizar el contenido del ticket directamente al body del iframe
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-impresion';
        ticketElement.innerHTML = ticketHTML;
        
        iframeDoc.body.appendChild(ticketElement);
        
        // Imprimir y luego eliminar el iframe
        setTimeout(() => {
          try {
            printIframe.focus();
            printIframe.contentWindow?.print();
            
            // Eliminar el iframe después de imprimir
            setTimeout(() => {
              document.body.removeChild(printIframe);
            }, 500);
          } catch (error) {
            console.error('Error al imprimir:', error);
            document.body.removeChild(printIframe);
          }
        }, 500);
      } else {
        console.error('No se pudo obtener el documento del iframe');
      }
    };
    
    // Cargar los datos de retiros si es necesario
    (async () => {
      try {
        if (cajaSeleccionada && cajaSeleccionada.id) {
          const resRetiros = await axios.get(`${process.env.REACT_APP_API_URL}/cajas/${cajaSeleccionada.id}/retiros`);
          
          if (resRetiros.data && Array.isArray(resRetiros.data)) {
            // Calcular totales de retiros por moneda
            totalRetirosPYG = resRetiros.data.reduce((sum, retiro) => sum + (Number(retiro.montoPYG) || 0), 0);
            totalRetirosBRL = resRetiros.data.reduce((sum, retiro) => sum + (Number(retiro.montoBRL) || 0), 0);
            totalRetirosUSD = resRetiros.data.reduce((sum, retiro) => sum + (Number(retiro.montoUSD) || 0), 0);
          }
        }
      } catch (error) {
        console.error('Error al cargar retiros para impresión:', error);
      }
      
      // Continuar con la impresión
      imprimirTicket();
    })();
  };
  
  return (
    <>
      <Box display="flex" gap={1}>
        <Button 
          variant="contained" 
          color="primary"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={abrirVistaPrevia}
        >
          Vista Previa
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          size="small"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Imprimir Ticket
        </Button>
      </Box>
      
      {/* Modal para vista previa */}
      <Dialog 
        open={vistaPrevia} 
        onClose={cerrarVistaPrevia}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#f5f5f5',
            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          }
        }}
      >
        <DialogContent>
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <IconButton onClick={cerrarVistaPrevia} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box 
            sx={{ 
              backgroundColor: 'white', 
              p: 1, 
              border: '1px solid #ddd',
              borderRadius: '4px',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
          >
            <TicketContenido 
              cajaSeleccionada={props.cajaSeleccionada}
              diferenciasEfectivo={props.diferenciasEfectivo}
              diferenciasServicios={props.diferenciasServicios}
              diferenciaTotal={props.diferenciaTotal}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarVistaPrevia} color="primary">
            Cerrar
          </Button>
          <Button 
            onClick={() => {
              cerrarVistaPrevia();
              handlePrint();
            }} 
            color="secondary" 
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketCierreCaja; 