import axios from 'axios';

// URL base de la API
const API_URL = 'http://localhost:3000/api';

export interface Pos {
  id: number;
  nombre: string;
  codigoBarras: string;
  cuentaBancariaId: number;
  cuentaBancaria?: {
    id: number;
    banco: string;
    numeroCuenta: string;
    moneda: string; // 'PYG' | 'BRL' | 'USD'
  };
  createdAt?: string;
  updatedAt?: string;
}

const posService = {
  // Obtener todos los POS
  getAllPos: async (): Promise<Pos[]> => {
    try {
      const response = await axios.get(`${API_URL}/pos`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener dispositivos POS:', error.message);
      throw error;
    }
  },

  // Obtener un POS por ID
  getPosById: async (id: number): Promise<Pos> => {
    try {
      const response = await axios.get(`${API_URL}/pos/id/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener dispositivo POS ${id}:`, error.message);
      throw error;
    }
  },

  // Obtener un POS por código de barras
  getPosByCodigoBarras: async (codigo: string): Promise<Pos | null> => {
    try {
      console.log(`Buscando POS con código de barras ${codigo}`);
      console.log('URL:', `${API_URL}/pos/codigo/${codigo}`);
      
      const response = await axios.get(`${API_URL}/pos/codigo/${codigo}`);
      console.log('Respuesta del servidor (buscar POS por código):', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al buscar POS con código ${codigo}:`, error.message);
      // Si el error es 404, devolver null en lugar de lanzar error
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Crear un nuevo POS
  createPos: async (data: Omit<Pos, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pos> => {
    try {
      const response = await axios.post(`${API_URL}/pos`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear dispositivo POS:', error.message);
      throw error;
    }
  },

  // Actualizar un POS existente
  updatePos: async (id: number, data: Partial<Omit<Pos, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Pos> => {
    try {
      const response = await axios.put(`${API_URL}/pos/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar dispositivo POS ${id}:`, error.message);
      throw error;
    }
  },

  // Eliminar un POS
  deletePos: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/pos/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar dispositivo POS ${id}:`, error.message);
      throw error;
    }
  }
};

export default posService; 