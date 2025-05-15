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
  htmlContent?: any[]; // Permite pasar contenido HTML personalizado directamente
}

interface PrintResult {
  success: boolean;
  error?: string;
}

class ElectronPrinterService {
  private defaultConfig: PrinterConfig = {
    width: '58mm',
    margin: '0 0 0 0',
    printerName: '', // Se establecerá dinámicamente según la impresora seleccionada
    preview: false,
    silent: true,
    copies: 1,
    timeOutPerLine: 400
  };

  private isElectron(): boolean {
    return !!(window as any).printerAPI;
  }
  
  /**
   * Obtiene la lista de impresoras disponibles en el sistema
   * @returns Promise con el resultado de la operación
   */
  async getPrinters(): Promise<{success: boolean, printers: {name: string, isDefault: boolean}[], error?: string}> {
    try {
      if (!this.isElectron()) {
        return { 
          success: false, 
          printers: [], 
          error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio' 
        };
      }
      
      const result = await window.printerAPI.getPrinters();
      return result;
    } catch (error) {
      console.error('Error al obtener impresoras:', error);
      return { 
        success: false, 
        printers: [], 
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
      };
    }
  }
  
  /**
   * Obtiene la configuración de impresora guardada
   * @returns Promise con el resultado de la operación
   */
  async getPrinterConfig(): Promise<{success: boolean, config?: PrinterConfig, error?: string}> {
    try {
      if (!this.isElectron()) {
        return { 
          success: false, 
          error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio' 
        };
      }
      
      const result = await window.printerAPI.getPrinterConfig();
      if (result.success && !result.config) {
        // Si no hay configuración guardada, usar la configuración predeterminada
        result.config = this.defaultConfig;
      }
      return result;
    } catch (error) {
      console.error('Error al obtener configuración de impresora:', error);
      return { 
        success: false, 
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
      };
    }
  }
  
  /**
   * Guarda la configuración de impresora
   * @param config Configuración de impresora a guardar
   * @returns Promise con el resultado de la operación
   */
  async savePrinterConfig(config: PrinterConfig): Promise<{success: boolean, error?: string}> {
    try {
      if (!this.isElectron()) {
        return { 
          success: false, 
          error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio' 
        };
      }
      
      const result = await window.printerAPI.savePrinterConfig(config);
      return result;
    } catch (error) {
      console.error('Error al guardar configuración de impresora:', error);
      return { 
        success: false, 
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
      };
    }
  }
  
  /**
   * Ejecuta una prueba de impresión
   * @returns Promise con el resultado de la operación
   */
  async printTest(): Promise<PrintResult> {
    try {
      if (!this.isElectron()) {
        return { 
          success: false, 
          error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio' 
        };
      }

      // Obtener la configuración actual
      const configResult = await this.getPrinterConfig();
      if (!configResult.success || !configResult.config) {
        return {
          success: false,
          error: 'No hay configuración de impresora disponible'
        };
      }
      
      const config = configResult.config;
      
      // Verificar que se haya seleccionado una impresora
      if (!config.printerName) {
        return {
          success: false,
          error: 'No se ha seleccionado ninguna impresora'
        };
      }
      
      // Crear ticket de prueba
      const now = new Date();
      const testTicket: TicketContent = {
        header: 'PRUEBA DE IMPRESIÓN',
        lines: [
          'Sistema de Servicios',
          '-'.repeat(32),
          `Impresora: ${config.printerName}`,
          `Fecha: ${now.toLocaleDateString()}`,
          `Hora: ${now.toLocaleTimeString()}`,
          '-'.repeat(32),
          'Esta es una prueba de impresión',
          'utilizando electron-pos-printer'
        ],
        total: '0 Gs.',
        barcode: '12345678',
        qr: 'https://sistemaservicios.com',
        footer: 'Fin de la prueba'
      };
      
      // Enviar a imprimir
      const result = await this.printTicket(testTicket);
      return result;
    } catch (error) {
      console.error('Error al realizar prueba de impresión:', error);
      return { 
        success: false, 
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
      };
    }
  }
  
  /**
   * Imprime un ticket
   * @param ticket Contenido del ticket a imprimir
   * @returns Promise con el resultado de la operación
   */
  async printTicket(ticket: TicketContent): Promise<PrintResult> {
    try {
      if (!this.isElectron()) {
        return { 
          success: false, 
          error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio' 
        };
      }
      
      // Enviar el ticket para imprimir
      const result = await window.printerAPI.printReceipt(ticket);
      return result;
    } catch (error) {
      console.error('Error al imprimir ticket:', error);
      return { 
        success: false, 
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
      };
    }
  }
  
  /**
   * Imprime contenido HTML (método para compatibilidad con versiones anteriores)
   * @param htmlContent Contenido HTML a imprimir
   * @returns Promise con el resultado de la operación
   */
  async printHTML(htmlContent: string): Promise<PrintResult> {
    try {
      if (!this.isElectron()) {
        return { 
          success: false, 
          error: 'Esta funcionalidad solo está disponible en la aplicación de escritorio' 
        };
      }
      
      // En este enfoque nuevo, convertimos el HTML a líneas de texto simples
      // Esta es una simplificación y podría necesitar una implementación más robusta
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const textContent = doc.body.textContent || '';
      const lines = textContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      // Crear un ticket simple
      const ticket: TicketContent = {
        header: lines[0] || 'Ticket',
        lines: lines.slice(1, -1),
        footer: lines[lines.length - 1]
      };
      
      return await this.printTicket(ticket);
    } catch (error) {
      console.error('Error al imprimir HTML:', error);
      return { 
        success: false, 
        error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
      };
    }
  }
}

const electronPrinterService = new ElectronPrinterService();
export default electronPrinterService; 