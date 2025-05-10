import React from 'react';
import { 
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  MonetizationOn as MonetizationOnIcon,
  PointOfSale as PointOfSaleIcon,
  People as PeopleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AdminViewProps {
  hasPermission: (modulo: string, pantalla?: string) => boolean;
}

const AdminView: React.FC<AdminViewProps> = ({ hasPermission }) => {
  const navigate = useNavigate();

  // Funciones auxiliares para formatear montos
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-PY', {
      maximumFractionDigits: 0
    });
  };

  // Datos de ejemplo para el dashboard
  const estadisticas = {
    totalCajas: 12,
    cajasActivas: 8,
    saldoTotal: 45750000,
    movimientosDiarios: 145,
    pendientesConciliacion: 3
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Administración
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Resumen del sistema de servicios
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Cajas Activas
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {estadisticas.cajasActivas}/{estadisticas.totalCajas}
            </Typography>
            <Typography variant="body2">
              {Math.round((estadisticas.cajasActivas / estadisticas.totalCajas) * 100)}% del total
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: 'secondary.light',
              color: 'secondary.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Saldo Total
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              Gs. {formatCurrency(estadisticas.saldoTotal)}
            </Typography>
            <Typography variant="body2">
              En todas las cajas del sistema
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: 'success.light',
              color: 'success.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Movimientos
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {estadisticas.movimientosDiarios}
            </Typography>
            <Typography variant="body2">
              Operaciones registradas hoy
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: 'warning.light',
              color: 'warning.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pendientes
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {estadisticas.pendientesConciliacion}
            </Typography>
            <Typography variant="body2">
              Cajas pendientes de conciliación
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Módulos Principales
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {hasPermission('CAJA_MAYOR', 'BALANCE') && (
                <ListItem button onClick={() => navigate('/caja-mayor/balance')}>
                  <ListItemIcon>
                    <AccountBalanceIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Caja Mayor" secondary="Balance y movimientos" />
                </ListItem>
              )}
              {hasPermission('SALDOS_MONETARIOS', 'VER') && (
                <ListItem button onClick={() => navigate('/saldos-monetarios')}>
                  <ListItemIcon>
                    <MonetizationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Saldos Monetarios" secondary="Control de pagos y servicios" />
                </ListItem>
              )}
              {hasPermission('PDV', 'CAJAS') && (
                <ListItem button onClick={() => navigate('/pdv/cajas')}>
                  <ListItemIcon>
                    <PointOfSaleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Control de Cajas" secondary="Supervisión y diferencias" />
                </ListItem>
              )}
              {hasPermission('RECURSOS_HUMANOS', 'PERSONAS') && (
                <ListItem button onClick={() => navigate('/recursos-humanos')}>
                  <ListItemIcon>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Recursos Humanos" secondary="Gestión de personas" />
                </ListItem>
              )}
              {hasPermission('CONFIGURACION', 'USUARIOS') && (
                <ListItem button onClick={() => navigate('/usuarios')}>
                  <ListItemIcon>
                    <SettingsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Configuración" secondary="Usuarios, roles y parámetros" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Acciones rápidas para administradores
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              sx={{ mb: 2 }}
              onClick={() => navigate('/caja-mayor/balance')}
            >
              Ver Balance de Caja Mayor
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary" 
              sx={{ mb: 2 }}
              onClick={() => navigate('/diferencias')}
            >
              Revisar Diferencias
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              color="secondary"
              onClick={() => navigate('/cotizaciones')}
            >
              Actualizar Cotizaciones
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminView; 