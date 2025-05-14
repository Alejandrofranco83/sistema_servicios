import { App } from 'electron';

declare module 'electron' {
  interface App {
    getPrinters(): Electron.PrinterInfo[];
  }
  
  namespace Electron {
    interface PrinterInfo {
      name: string;
      description: string;
      status: number;
      isDefault: boolean;
      options?: any;
    }
  }
}

declare module '@plick/electron-pos-printer' {
  export interface PosPrintOptions {
    printerName: string;
    width: string;
    margin?: string;
    copies?: number;
    preview?: boolean;
    silent?: boolean;
    timeOutPerLine?: number;
    pageSize?: string;
  }
  
  export interface PosPrintData {
    type: string;
    value?: string;
    style?: string;
    height?: number;
    width?: number;
    displayValue?: boolean;
  }
  
  export class PosPrinter {
    static print(data: PosPrintData[], options: PosPrintOptions): Promise<void>;
  }
}

declare global {
  interface Window {
    printerAPI: {
      printReceipt: (ticket: any) => Promise<{success: boolean, error?: string}>;
      getPrinters: () => Promise<{success: boolean, printers: {name: string, isDefault: boolean}[], error?: string}>;
      getPrinterConfig: () => Promise<{success: boolean, config?: any, error?: string}>;
      savePrinterConfig: (config: any) => Promise<{success: boolean, error?: string}>;
    }
  }
} 