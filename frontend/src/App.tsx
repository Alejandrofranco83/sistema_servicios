import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/Login';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CotizacionProvider } from './contexts/CotizacionContext';
import { SucursalProvider } from './contexts/SucursalContext';
import { ServerStatusProvider } from './contexts/ServerStatusContext';
import Cajas from './components/Cajas';

// Configuración global para axios
axios.defaults.baseURL = 'http://localhost:3000';

// Al iniciar la aplicación, verificar si hay un token guardado
const token = localStorage.getItem('token');
if (token) {
  // Configurar el token para todas las solicitudes
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor para manejar respuestas de error de autenticación
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Log detallado antes de desloguear
      console.error(
        `%c[Interceptor Auth Error] ${error.response.status} en ${error.config.method?.toUpperCase()} ${error.config.url}`,
        'color: red; font-weight: bold;'
      );
      console.error('[Interceptor Auth Error] Respuesta del servidor:', error.response.data);
      console.error('[Interceptor Auth Error] Configuración de la petición:', error.config);
      
      // Verificar si la URL contiene "/api/rrhh/" (modificación temporal)
      if (error.config.url && error.config.url.includes('/api/rrhh/')) {
        console.warn('[Interceptor] Ignorando error de autenticación en módulo RRHH para debugging');
        // No cerrar sesión en este caso específico (debugging)
      } else {
        // Si recibimos un error de autenticación, limpiar el token y redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Componente para proteger rutas
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Mostrar nada mientras se verifica la autenticación
  if (loading) {
    return null;
  }
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si hay usuario, renderizar los componentes hijos
  return <Outlet />;
};

const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(
    localStorage.getItem('themeMode') === 'dark' ? 'dark' : 'light'
  );

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Crear tema basado en la preferencia
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <CotizacionProvider>
            <SucursalProvider>
              <ServerStatusProvider>
                <Routes>
                  <Route path="/login" element={<Login onToggleTheme={toggleTheme} isDarkMode={mode === 'dark'} />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/*" element={<Dashboard onToggleTheme={toggleTheme} isDarkMode={mode === 'dark'} />} />
                  </Route>
                </Routes>
              </ServerStatusProvider>
            </SucursalProvider>
          </CotizacionProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App; 