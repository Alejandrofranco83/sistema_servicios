import { app, BrowserWindow, ipcMain } from 'electron';
import { PosPrinter } from '@plick/electron-pos-printer';
import * as path from 'path';
import * as fs from 'fs';
import * as remoteMain from '@electron/remote/main';
import '../types/electron';

// Interfaces para tipado
interface PrinterConfig {
  width: string;
  margin: string;
  printerName: string;
  preview: boolean;
  silent: boolean;
  copies: number;
  timeOutPerLine: number;
}

interface TicketContent {
  header?: string;
  lines: string[];
  qr?: string;
  barcode?: string;
  total?: string;
  footer?: string;
}

// Inicializar remote
remoteMain.initialize();

let mainWindow: BrowserWindow | null = null;

// Configuración por defecto para la impresora
const defaultPrinterConfig: PrinterConfig = {
  width: '58mm',
  margin: '0 0 0 0',
  printerName: '', // Se establecerá al inicio tomando la impresora predeterminada
  preview: false,
  silent: true,
  copies: 1,
  timeOutPerLine: 400
};

// Ruta para guardar la configuración
const configPath = path.join(app.getPath('userData'), 'printer-config.json');

/**
 * Crea la ventana principal de la aplicación
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Habilitar remote para esta ventana
  if (mainWindow) {
    remoteMain.enable(mainWindow.webContents);
  }

  // Cargar la URL principal de la aplicación
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Establecer la impresora predeterminada al inicio
app.whenReady().then(async () => {
  try {
    const printers = await app.getPrinters();
    const defaultPrinter = printers.find((p: Electron.PrinterInfo) => p.isDefault);
    
    // Si hay una configuración guardada, leerla
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        const savedConfig = JSON.parse(configData);
        defaultPrinterConfig.printerName = savedConfig.printerName || 
                                         (defaultPrinter ? defaultPrinter.name : '');
      } catch (error) {
        console.error('Error al leer configuración de impresora:', error);
        // Si hay un error al leer, establecer la impresora predeterminada del sistema
        defaultPrinterConfig.printerName = defaultPrinter ? defaultPrinter.name : '';
      }
    } else {
      // Si no hay configuración guardada, usar la impresora predeterminada
      defaultPrinterConfig.printerName = defaultPrinter ? defaultPrinter.name : '';
    }
    
    console.log('Impresora predeterminada establecida:', defaultPrinterConfig.printerName);
    
    // Crear ventana después de establecer la impresora
    createWindow();
  } catch (error) {
    console.error('Error al obtener impresoras:', error);
    defaultPrinterConfig.printerName = '';
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Obtiene la lista de impresoras del sistema
 */
ipcMain.handle('get-printers', async () => {
  try {
    const printers = await app.getPrinters();
    return {
      success: true,
      printers: printers.map((p: Electron.PrinterInfo) => ({
        name: p.name,
        isDefault: p.isDefault
      }))
    };
  } catch (error) {
    console.error('Error obteniendo impresoras:', error);
    return {
      success: false,
      printers: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
});

/**
 * Lee la configuración guardada de la impresora
 */
ipcMain.handle('get-printer-config', async () => {
  try {
    let config = { ...defaultPrinterConfig };
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
    }
    
    // Si no hay impresora definida, intentar obtener la predeterminada del sistema
    if (!config.printerName) {
      try {
        const printers = await app.getPrinters();
        const defaultPrinter = printers.find((p: Electron.PrinterInfo) => p.isDefault);
        if (defaultPrinter) {
          config.printerName = defaultPrinter.name;
        }
      } catch (err) {
        console.error('Error al obtener impresora predeterminada:', err);
      }
    }
    
    return {
      success: true,
      config
    };
  } catch (error) {
    console.error('Error leyendo configuración de impresora:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
});

/**
 * Guarda la configuración de la impresora
 */
ipcMain.handle('save-printer-config', async (_event: Electron.IpcMainInvokeEvent, config: PrinterConfig) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error guardando configuración de impresora:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
});

/**
 * Construye el contenido para la impresión
 */
function buildContent({ header, lines, qr, barcode, total, footer }: TicketContent) {
  const content: any[] = []; // Usar any[] para evitar errores de tipado
  
  // Agregar header si existe
  if (header) {
    content.push({ type: 'text', value: header, style: 'text-align:center;font-weight:700;' });
  }
  
  // Separador
  content.push({ type: 'text', value: '--------------------------------' });
  
  // Agregar las líneas
  if (lines && lines.length > 0) {
    lines.forEach((line: string) => {
      content.push({ type: 'text', value: line });
    });
  }
  
  // Agregar total
  if (total) {
    content.push({ type: 'text', value: '--------------------------------' });
    content.push({ type: 'text', value: `TOTAL: ${total}`, style: 'text-align:right;font-weight:700;' });
  }
  
  // Agregar código de barras si existe
  if (barcode) {
    content.push({ type: 'barcode', value: barcode, height: 40, width: 2, displayValue: false });
  }
  
  // Agregar código QR si existe
  if (qr) {
    content.push({ type: 'qrcode', value: qr, height: 150, width: 150, style: 'margin: 5 auto;' });
  }
  
  // Agregar footer si existe
  if (footer) {
    content.push({ type: 'text', value: '--------------------------------' });
    content.push({ type: 'text', value: footer, style: 'text-align:center;font-size:10px;' });
  }
  
  // Comando para cortar el papel
  content.push({ type: 'cut' });
  
  return content;
}

/**
 * Imprime un ticket
 */
ipcMain.handle('print-receipt', async (_event: Electron.IpcMainInvokeEvent, ticket: TicketContent) => {
  try {
    // Obtener la configuración
    let config = { ...defaultPrinterConfig };
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
    }
    
    // Si no hay impresora configurada, mostrar un error
    if (!config.printerName) {
      return {
        success: false,
        error: 'No se ha configurado ninguna impresora. Por favor, configure una impresora en las opciones.'
      };
    }
    
    // Construir el contenido para imprimir
    const content = buildContent(ticket);
    
    // Verificar si la impresora existe en el sistema
    const printers = await app.getPrinters();
    const printerExists = printers.some((p: Electron.PrinterInfo) => p.name === config.printerName);
    
    if (!printerExists) {
      return {
        success: false,
        error: `La impresora "${config.printerName}" no está disponible en el sistema. Por favor, seleccione otra impresora.`
      };
    }
    
    // Imprimir
    await PosPrinter.print(content, {
      printerName: config.printerName,
      width: config.width,
      margin: config.margin,
      copies: config.copies,
      preview: config.preview,
      silent: config.silent,
      timeOutPerLine: config.timeOutPerLine
    } as any); // Forzar tipo para evitar el error
    
    return { success: true };
  } catch (error) {
    console.error('Error en la impresión:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}); 