/**
 * Simulador de API de Electron para entorno de navegador
 * Este script proporciona implementaciones de fallback para las APIs de Electron
 * cuando la aplicación se ejecuta en un navegador web en lugar de en Electron.
 */

// Lista de impresoras simuladas
const MOCK_PRINTERS = [
  { name: 'Microsoft Print to PDF', isDefault: false },
  { name: 'Microsoft XPS Document Writer', isDefault: false },
  { name: 'Ticket (Simulada)', isDefault: true }
];

// Configuración simulada
const MOCK_CONFIG = {
  printer: { name: 'Ticket (Simulada)', isDefault: true }
};

// Guardar configuración en localStorage
function saveLocalConfig(config) {
  try {
    localStorage.setItem('electron-printer-config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error al guardar configuración en localStorage:', error);
    return false;
  }
}

// Cargar configuración desde localStorage
function getLocalConfig() {
  try {
    const config = localStorage.getItem('electron-printer-config');
    return config ? JSON.parse(config) : MOCK_CONFIG;
  } catch (error) {
    console.error('Error al cargar configuración desde localStorage:', error);
    return MOCK_CONFIG;
  }
}

// Inicializar la API simulada de Electron
if (typeof window !== 'undefined' && !window.electronAPI) {
  console.log('Electron no detectado. Usando API simulada para desarrollo web.');
  window.electronAPI = {
    // Función para obtener impresoras simuladas
    getPrinters: async () => {
      console.log('Simulando getPrinters en navegador');
      return {
        success: true,
        printers: MOCK_PRINTERS
      };
    },
    
    // Función para obtener configuración simulada
    getPrinterConfig: async () => {
      console.log('Simulando getPrinterConfig en navegador');
      return {
        success: true,
        config: getLocalConfig().printer
      };
    },
    
    // Función para guardar configuración simulada
    savePrinterConfig: async (printerConfig) => {
      console.log('Simulando savePrinterConfig en navegador', printerConfig);
      const config = getLocalConfig();
      config.printer = printerConfig;
      return {
        success: saveLocalConfig(config)
      };
    },
    
    // Función para imprimir simulada
    printSilent: async (htmlContent) => {
      console.log('Simulando impresión en navegador');
      
      // Abrir una nueva ventana con el contenido del ticket
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Mensaje para el usuario
        alert('Simulación de impresión. En un entorno Electron, esto se enviaría directamente a la impresora.');
        
        // Opcional: mostrar diálogo de impresión del navegador
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (error) {
            console.error('Error al imprimir desde navegador:', error);
          }
        }, 500);
        
        return { success: true };
      } else {
        console.error('No se pudo abrir ventana de impresión');
        return { 
          success: false, 
          error: 'El navegador bloqueó la ventana emergente'
        };
      }
    }
  };
}

console.log('API de Electron simulada cargada correctamente.'); 