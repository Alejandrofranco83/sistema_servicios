// Archivo preload.js
// Este archivo se ejecuta en el proceso de renderizado antes de que se cargue la página web
// y tiene acceso al contexto de Node.js
const { contextBridge } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const remote = require('@electron/remote');

// Función para obtener la ruta del archivo de configuración
const getConfigPath = () => {
  const userDataPath = path.join(os.homedir(), 'SistemaServiciosData');
  
  // Crear directorio si no existe
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  return path.join(userDataPath, 'printer-config.json');
};

// Exponer API segura para el renderer process
contextBridge.exposeInMainWorld('printerAPI', {
  getPrinters: async () => {
    try {
      const { getPrinters } = require('pdf-to-printer');
      const printers = await getPrinters();
      return {
        success: true,
        printers: printers.map(p => ({ 
          name: p.name, 
          isDefault: p.isDefault || false 
        }))
      };
    } catch (error) {
      console.error('Error al obtener impresoras:', error);
      return {
        success: false,
        printers: [],
        error: error.message
      };
    }
  },
  
  getPrinterConfig: async () => {
    try {
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: true, config: null };
      }
      
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      return { success: true, config };
    } catch (error) {
      console.error('Error al leer configuración de impresora:', error);
      return { success: false, error: error.message };
    }
  },
  
  savePrinterConfig: async (config) => {
    try {
      const configPath = getConfigPath();
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error al guardar configuración de impresora:', error);
      return { success: false, error: error.message };
    }
  },
  
  printReceipt: async (ticket) => {
    try {
      // Obtener la configuración de la impresora
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'No hay configuración de impresora guardada' };
      }
      
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.printerName) {
        return { success: false, error: 'No hay impresora seleccionada' };
      }
      
      // Usar remote.require para acceder a electron-pos-printer
      const PosPrinter = remote.require('electron-pos-printer').PosPrinter;
      
      // Preparar el contenido HTML para la impresión
      const htmlContent = [];
      
      // Agregar encabezado
      if (ticket.header) {
        htmlContent.push({
          type: 'text',
          value: ticket.header,
          style: { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }
        });
      }
      
      // Agregar líneas
      for (const line of ticket.lines) {
        htmlContent.push({
          type: 'text',
          value: line,
          style: { fontSize: '14px', marginTop: '5px' }
        });
      }
      
      // Agregar código de barras si existe
      if (ticket.barcode) {
        htmlContent.push({
          type: 'barCode',
          value: ticket.barcode,
          height: 40,
          width: 2,
          displayValue: true,
          position: 'center'
        });
      }
      
      // Agregar código QR si existe
      if (ticket.qr) {
        htmlContent.push({
          type: 'qrCode',
          value: ticket.qr,
          height: 80,
          width: 80,
          position: 'center'
        });
      }
      
      // Agregar total si existe
      if (ticket.total) {
        htmlContent.push({
          type: 'text',
          value: `TOTAL: ${ticket.total}`,
          style: { fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }
        });
      }
      
      // Agregar pie de página
      if (ticket.footer) {
        htmlContent.push({
          type: 'text',
          value: ticket.footer,
          style: { fontSize: '14px', fontWeight: 'normal', textAlign: 'center', marginTop: '10px' }
        });
      }
      
      // Configurar opciones de impresión
      const options = {
        preview: config.preview || false,
        width: config.width || '58mm',
        margin: config.margin || '0 0 0 0',
        copies: config.copies || 1,
        printerName: config.printerName,
        timeOutPerLine: config.timeOutPerLine || 400,
        silent: config.silent || true
      };
      
      // Enviar a imprimir
      await PosPrinter.print(htmlContent, options);
      return { success: true };
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: error.message };
    }
  }
});

// Para información de versiones de Electron
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
}) 