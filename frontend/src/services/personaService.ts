import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta esto según tu configuración

// Configuración global de axios
axios.defaults.timeout = 10000; // 10 segundos de timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

export interface Persona {
  id: number;
  nombreCompleto: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  tipo: 'Cliente' | 'Funcionario' | 'Conveniado' | 'Vip';
  fechaNacimiento: string | null;
}

export const personaService = {
  // Obtener todas las personas
  getPersonas: async (): Promise<Persona[]> => {
    try {
      console.log('Obteniendo personas desde:', `${API_BASE_URL}/personas`);
      const response = await axios.get(`${API_BASE_URL}/personas`);
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener personas:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Obtener una persona por ID
  getPersonaById: async (id: number): Promise<Persona> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/personas/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener persona ${id}:`, error.message);
      throw error;
    }
  },

  // Crear una nueva persona
  createPersona: async (persona: Omit<Persona, 'id'>): Promise<Persona> => {
    try {
      console.log('Creando persona con datos:', persona);
      console.log('URL:', `${API_BASE_URL}/personas`);
      
      // Asegurarse de que la fecha se envíe en formato ISO
      const personaData = {
        ...persona,
        fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString() : null
      };
      
      const response = await axios.post(`${API_BASE_URL}/personas`, personaData);
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear persona:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
      }
      throw error;
    }
  },

  // Actualizar una persona existente
  updatePersona: async (id: number, persona: Partial<Persona>): Promise<Persona> => {
    try {
      // Asegurarse de que la fecha se envíe en formato ISO
      const personaData = {
        ...persona,
        fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString() : null
      };
      
      const response = await axios.put(`${API_BASE_URL}/personas/${id}`, personaData);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar persona ${id}:`, error.message);
      throw error;
    }
  },

  // Eliminar una persona
  deletePersona: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/personas/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar persona ${id}:`, error.message);
      throw error;
    }
  },

  // Buscar personas por texto
  searchPersonas: async (query: string): Promise<Persona[]> => {
    const response = await axios.get(`${API_BASE_URL}/personas/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }
}; 