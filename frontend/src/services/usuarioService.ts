import axios from 'axios';
import { Persona } from './personaService';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Usuario {
  id: number;
  username: string;
  personaId: number;
  nombre: string;
  tipo: string;
  persona: Persona;
  rol?: {
    id: number;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioInput {
  username: string;
  personaId: number;
  nombre: string;
  tipo: string;
  rolId?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export const usuarioService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log('Service - Intentando login con:', {
        username: credentials.username.toUpperCase(),
        password: credentials.password,
      });
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: credentials.username.toUpperCase(),
        password: credentials.password,
      });
      
      console.log('Service - Respuesta del servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Service - Error al iniciar sesión:', error.message);
      if (error.response) {
        console.error('Service - Respuesta del servidor:', error.response.data);
      }
      throw error;
    }
  },

  // Obtener todos los usuarios
  getUsuarios: async (): Promise<Usuario[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error.message);
      throw error;
    }
  },

  // Obtener un usuario por ID
  getUsuarioById: async (id: number): Promise<Usuario> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener usuario ${id}:`, error.message);
      throw error;
    }
  },

  // Crear un nuevo usuario
  createUsuario: async (usuario: UsuarioInput): Promise<Usuario> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/usuarios`, usuario);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear usuario:', error.message);
      throw error;
    }
  },

  // Actualizar un usuario existente
  updateUsuario: async (id: number, usuario: Partial<UsuarioInput>): Promise<Usuario> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/usuarios/${id}`, usuario);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar usuario ${id}:`, error.message);
      throw error;
    }
  },

  // Eliminar un usuario
  deleteUsuario: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/usuarios/${id}`);
    } catch (error: any) {
      console.error(`Error al eliminar usuario ${id}:`, error.message);
      throw error;
    }
  },

  // Resetear contraseña de usuario
  resetPassword: async (id: number): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/usuarios/${id}/reset-password`);
    } catch (error: any) {
      console.error(`Error al resetear contraseña del usuario ${id}:`, error.message);
      throw error;
    }
  }
}; 