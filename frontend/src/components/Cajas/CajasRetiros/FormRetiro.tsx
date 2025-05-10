import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { useCajas } from '../CajasContext';
import { formatearIdCaja } from '../helpers';
import { handleInputClick } from '../../../utils/inputUtils';

interface FormRetiroProps {
  open: boolean;
  onClose: () => void;
}

const FormRetiro: React.FC<FormRetiroProps> = ({ open, onClose }) => {
  // Registro de referencias para campos y navegación
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLButtonElement }>({});
  
  // Obtener el contexto
  const {
    cajaSeleccionada,
    formRetiro,
    setFormRetiro,
    loading,
    busquedaPersona,
    setBusquedaPersona,
    personasBusqueda,
    buscandoPersonas,
    handleGuardarRetiro
  } = useCajas();
  
  // Efecto para limpiar el campo de búsqueda de persona cuando se abre el formulario
  useEffect(() => {
    if (open) {
      setBusquedaPersona('');
      
      // Establecer el foco en el campo de guaraníes después de un pequeño delay
      // para asegurar que el formulario esté completamente renderizado
      setTimeout(() => {
        if (inputRefs.current['montoPYG']) {
          inputRefs.current['montoPYG'].focus();
        }
      }, 100);
    }
  }, [open, setBusquedaPersona]);
  
  // Registrar referencia a un campo de entrada
  const registerInputRef = (id: string, ref: HTMLInputElement | HTMLButtonElement | null) => {
    if (ref) {
      inputRefs.current[id] = ref;
    }
  };
  
  // Modificar la función handleKeyDown para manejar la tecla Enter como Tab
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, nextFieldId: string) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevenir el comportamiento predeterminado de Enter
      }
      
      if (nextFieldId && inputRefs.current[nextFieldId]) {
        inputRefs.current[nextFieldId].focus();
      }
    }
  };
  
  // Función para manejar cambios en la búsqueda de personas
  const handleBusquedaPersonaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase();
    setBusquedaPersona(valor);
    
    // Si hay una persona seleccionada y modificamos el texto, debemos quitar la selección
    if (formRetiro.personaId && valor !== formRetiro.personaNombre) {
      setFormRetiro(prev => ({
        ...prev,
        personaId: '',
        personaNombre: ''
      }));
    }
    // La búsqueda se realiza en el contexto
  };
  
  // Función para seleccionar una persona
  const seleccionarPersona = (persona: {id: string; nombre: string; tipo: 'funcionario' | 'vip'}) => {
    setFormRetiro(prev => ({
      ...prev,
      personaId: persona.id,
      personaNombre: persona.nombre
    }));
    
    // En lugar de limpiar el campo, mostramos el nombre de la persona seleccionada
    setBusquedaPersona(persona.nombre);
    
    // Enfocar el siguiente campo después de seleccionar
    setTimeout(() => {
      if (inputRefs.current['observacion']) {
        inputRefs.current['observacion'].focus();
      }
    }, 100);
  };
  
  // Función para manejar cambios en el formulario
  const handleRetiroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'observacion') {
      // Convertir a mayúsculas
      setFormRetiro(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormRetiro(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ 
        '& .MuiDialog-paper': { 
          bgcolor: '#333', 
          color: 'white',
          minHeight: 'calc(80% - 128px)', // Reducido un 20% respecto al original
          maxHeight: 'calc(80% - 64px)' // Reducido un 20% respecto al original
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box>
          <Typography variant="h6" component="span">Registrar Retiro de Caja</Typography>
          {cajaSeleccionada && (
            <Typography variant="subtitle2" component="div" color="text.secondary">
              Caja ID: {cajaSeleccionada.cajaEnteroId}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, height: '100%' }}>
        <form autoComplete="off" style={{ height: '100%' }}>
          <Box sx={{ pt: 1, height: '100%' }}>
            <Grid container spacing={1.5}>
              {/* Montos por moneda */}
              <Grid item xs={12} sx={{ pb: 0.5, pt: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0 }}>
                  Montos a retirar
                </Typography>
              </Grid>
              
              {/* Montos alineados horizontalmente */}
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Guaraníes"
                  name="montoPYG"
                  inputRef={(ref) => registerInputRef('montoPYG', ref)}
                  value={formRetiro.montoPYG}
                  autoComplete="off"
                  onChange={(e) => {
                    // Solo aceptar números
                    const value = e.target.value.replace(/[^\d]/g, '');
                    // Formatear con separadores de miles
                    const formattedValue = value ? Number(value).toLocaleString('es-PY') : '';
                    setFormRetiro(prev => ({
                      ...prev,
                      montoPYG: formattedValue
                    }));
                  }}
                  onClick={handleInputClick}
                  onKeyDown={(e) => handleKeyDown(e, 'montoBRL')}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₲</Typography>,
                  }}
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-root': { bgcolor: '#444' },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: '#ccc' },
                    '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 }
                  }}
                />
              </Grid>
              
              {/* Reales */}
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Reales"
                  name="montoBRL"
                  inputRef={(ref) => registerInputRef('montoBRL', ref)}
                  value={formRetiro.montoBRL}
                  autoComplete="off"
                  onChange={(e) => {
                    let input = e.target.value;
                    
                    // Permitir solo números, puntos y una coma
                    input = input.replace(/[^\d.,]/g, '');
                    
                    // Manejar el caso donde el usuario ingresa una coma
                    if (input.includes(',')) {
                      const parts = input.split(',');
                      if (parts.length > 2) {
                        // Si hay más de una coma, nos quedamos con la primera
                        input = parts[0] + ',' + parts.slice(1).join('');
                      }
                      
                      // Limitar a 2 decimales
                      if (parts[1] && parts[1].length > 2) {
                        parts[1] = parts[1].substring(0, 2);
                        input = parts[0] + ',' + parts[1];
                      }
                      
                      // Quitar todos los puntos de separador de miles de la parte entera
                      const entero = parts[0].replace(/\./g, '');
                      
                      // Formatear la parte entera con separador de miles
                      let enteroFormateado = '';
                      if (entero) {
                        enteroFormateado = Number(entero).toLocaleString('es-PY').split(',')[0];
                      }
                      
                      // Reconstruir con la parte decimal
                      input = enteroFormateado + ',' + parts[1];
                    } else {
                      // Si no hay coma, es solo parte entera
                      // Quitar todos los puntos y formatear
                      const entero = input.replace(/\./g, '');
                      if (entero) {
                        input = Number(entero).toLocaleString('es-PY');
                      }
                    }
                    
                    setFormRetiro(prev => ({
                      ...prev,
                      montoBRL: input
                    }));
                  }}
                  onClick={handleInputClick}
                  onKeyDown={(e) => handleKeyDown(e, 'montoUSD')}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>R$</Typography>,
                  }}
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-root': { bgcolor: '#444' },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: '#ccc' },
                    '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 }
                  }}
                />
              </Grid>
              
              {/* Dólares */}
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Dólares"
                  name="montoUSD"
                  inputRef={(ref) => registerInputRef('montoUSD', ref)}
                  value={formRetiro.montoUSD}
                  autoComplete="off"
                  onChange={(e) => {
                    let input = e.target.value;
                    
                    // Permitir solo números, puntos y una coma
                    input = input.replace(/[^\d.,]/g, '');
                    
                    // Manejar el caso donde el usuario ingresa una coma
                    if (input.includes(',')) {
                      const parts = input.split(',');
                      if (parts.length > 2) {
                        // Si hay más de una coma, nos quedamos con la primera
                        input = parts[0] + ',' + parts.slice(1).join('');
                      }
                      
                      // Limitar a 2 decimales
                      if (parts[1] && parts[1].length > 2) {
                        parts[1] = parts[1].substring(0, 2);
                        input = parts[0] + ',' + parts[1];
                      }
                      
                      // Quitar todos los puntos de separador de miles de la parte entera
                      const entero = parts[0].replace(/\./g, '');
                      
                      // Formatear la parte entera con separador de miles
                      let enteroFormateado = '';
                      if (entero) {
                        enteroFormateado = Number(entero).toLocaleString('es-PY').split(',')[0];
                      }
                      
                      // Reconstruir con la parte decimal
                      input = enteroFormateado + ',' + parts[1];
                    } else {
                      // Si no hay coma, es solo parte entera
                      // Quitar todos los puntos y formatear
                      const entero = input.replace(/\./g, '');
                      if (entero) {
                        input = Number(entero).toLocaleString('es-PY');
                      }
                    }
                    
                    setFormRetiro(prev => ({
                      ...prev,
                      montoUSD: input
                    }));
                  }}
                  onClick={handleInputClick}
                  onKeyDown={(e) => handleKeyDown(e, 'busquedaPersona')}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>US$</Typography>,
                  }}
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-root': { bgcolor: '#444' },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: '#ccc' },
                    '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 }
                  }}
                />
              </Grid>
              
              {/* Persona que recibe */}
              <Grid item xs={12} sx={{ pt: 1.5, pb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0 }}>
                  Persona que recibe
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  label="Buscar por nombre o documento"
                  inputRef={(ref) => registerInputRef('busquedaPersona', ref)}
                  value={busquedaPersona}
                  autoComplete="off"
                  onChange={handleBusquedaPersonaChange}
                  onClick={(e) => {
                    handleInputClick(e);
                    // Si ya hay una persona seleccionada, limpiamos el campo para permitir nueva búsqueda
                    if (formRetiro.personaId && busquedaPersona === formRetiro.personaNombre) {
                      setBusquedaPersona('');
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'observacion')}
                  placeholder="Escriba para buscar..."
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-root': { bgcolor: '#444' },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: '#ccc' }
                  }}
                />
                
                {/* Lista de resultados de búsqueda - mostrar solo si hay búsqueda activa y no es una persona ya seleccionada */}
                {busquedaPersona !== '' && 
                  busquedaPersona !== formRetiro.personaNombre &&
                  personasBusqueda.length > 0 && (
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      position: 'absolute', 
                      width: '100%', 
                      maxHeight: 200, 
                      overflow: 'auto',
                      bgcolor: '#444',
                      zIndex: 1000 
                    }}
                  >
                    <List dense sx={{ p: 0 }}>
                      {personasBusqueda.map(persona => (
                        <ListItem 
                          key={persona.id} 
                          button 
                          onClick={() => seleccionarPersona(persona)}
                          sx={{ 
                            borderBottom: '1px solid #555',
                            '&:hover': { bgcolor: '#555' }
                          }}
                        >
                          <ListItemText 
                            primary={persona.nombre} 
                            secondary={`${persona.tipo === 'funcionario' ? 'Funcionario' : 'VIP'}`}
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#ccc' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
                
                {buscandoPersonas && (
                  <CircularProgress 
                    size={20} 
                    sx={{ 
                      position: 'absolute', 
                      right: 10, 
                      top: 10, 
                      color: 'white' 
                    }} 
                  />
                )}
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12} sx={{ pt: 1.5 }}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observacion"
                  inputRef={(ref) => registerInputRef('observacion', ref)}
                  value={formRetiro.observacion}
                  onChange={(e) => {
                    const upperCaseValue = e.target.value.toUpperCase();
                    setFormRetiro(prev => ({
                      ...prev,
                      observacion: upperCaseValue
                    }));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'guardarRetiro')}
                  multiline
                  rows={2} // Reducir de 3 a 2 filas
                  placeholder="Detalles adicionales o motivo del retiro"
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-root': { bgcolor: '#444' },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: '#ccc' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </form>
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#333', pb: 2, px: 3 }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleGuardarRetiro}
          ref={(ref) => registerInputRef('guardarRetiro', ref)}
          disabled={(!formRetiro.montoPYG && !formRetiro.montoBRL && !formRetiro.montoUSD) || 
                  !formRetiro.personaId || loading}
          sx={{ 
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#388e3c' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar Retiro'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormRetiro; 