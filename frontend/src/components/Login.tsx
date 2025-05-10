import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  useTheme,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = 'http://localhost:3000/api';

interface LoginProps {
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const Login: React.FC<LoginProps> = ({ onToggleTheme, isDarkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login, loading: authLoading, error: authError } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Usar el método login del contexto de autenticación
      await login(credentials.username, credentials.password);
      // La redirección se maneja automáticamente en el contexto
    } catch (err: any) {
      // Mostrar errores del contexto si es necesario
      setError(authError || 'Error al iniciar sesión. Verifique sus credenciales.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: name === 'username' ? value.toUpperCase() : value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: name === 'username' ? value.toUpperCase() : value
    }));
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!passwordData.username || !passwordData.oldPassword || !passwordData.newPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/auth/cambiar-password`, {
        username: passwordData.username.toUpperCase(),
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      
      setResetSuccess(true);
      
      // Limpiar el formulario
      setPasswordData({
        username: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Cerrar el diálogo después de un tiempo
      setTimeout(() => {
        setShowChangePassword(false);
        setResetSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      setError(err.response?.data?.message || 'Error al cambiar la contraseña. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            component="img"
            src="/logo-farmacia.png.png"
            alt="Farmacia Franco Logo"
            sx={{
              width: '100%',
              maxWidth: '280px',
              height: 'auto',
              marginBottom: 1,
              objectFit: 'contain',
            }}
          />
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4, 
              color: '#808080',
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}
          >
            SERVICIOS
          </Typography>
          
          {(error || authError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error || authError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Usuario"
              name="username"
              autoComplete="username"
              autoFocus
              value={credentials.username}
              onChange={handleInputChange}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange}
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setShowChangePassword(true)}
                sx={{ textDecoration: 'none' }}
              >
                Cambiar Contraseña
              </Link>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={onToggleTheme}
                sx={{ textDecoration: 'none' }}
              >
                Modo {isDarkMode ? 'Claro' : 'Oscuro'}
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
              disabled={authLoading}
            >
              {authLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Diálogo para cambiar contraseña */}
      <Dialog open={showChangePassword} onClose={() => setShowChangePassword(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Contraseña actualizada con éxito
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                autoFocus
                margin="dense"
                id="username"
                name="username"
                label="Usuario"
                type="text"
                fullWidth
                variant="outlined"
                value={passwordData.username}
                onChange={handlePasswordChange}
              />
              <TextField
                margin="dense"
                id="oldPassword"
                name="oldPassword"
                label="Contraseña Actual"
                type="password"
                fullWidth
                variant="outlined"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
              />
              <TextField
                margin="dense"
                id="newPassword"
                name="newPassword"
                label="Nueva Contraseña"
                type="password"
                fullWidth
                variant="outlined"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
              <TextField
                margin="dense"
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                type="password"
                fullWidth
                variant="outlined"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangePassword(false)} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary" 
            disabled={loading || resetSuccess}
          >
            {loading ? <CircularProgress size={24} /> : 'Cambiar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login; 