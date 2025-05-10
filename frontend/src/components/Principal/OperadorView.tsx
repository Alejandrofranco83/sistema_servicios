import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Slide,
  Fade
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  ArrowForward as ArrowForwardIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Interfaces para los datos del carrusel y panel informativo
interface CarouselSlide {
  id: number;
  title: string;
  content: string;
  bgColor: string;
  imageUrl?: string;
  orden: number;
  activo: boolean;
}

interface InfoPanel {
  id: number;
  title: string;
  content: string;
  notaImportante: string;
}

interface OperadorViewProps {
  username: string;
}

const OperadorView: React.FC<OperadorViewProps> = ({ username }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [infoPanel, setInfoPanel] = useState<InfoPanel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [slideIn, setSlideIn] = useState(true);

  // Cargar los datos desde la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Obteniendo datos del carrusel y panel informativo...');
        
        // Obtener slides activos del carrusel
        const slidesResponse = await axios.get('/api/carousel/slides/active');
        console.log('Respuesta de slides:', slidesResponse.data);
        
        if (slidesResponse.data && slidesResponse.data.length > 0) {
          setSlides(slidesResponse.data);
        } else {
          console.warn('No se encontraron slides, usando datos de respaldo');
          // Datos de respaldo solo si no hay slides en la BD
          setSlides([
            {
              id: 1,
              title: 'Promociones especiales',
              content: 'Aproveche nuestras promociones del mes',
              bgColor: '#bbdefb',
              orden: 1,
              activo: true
            }
          ]);
        }
        
        // Obtener información del panel
        const infoPanelResponse = await axios.get('/api/carousel/info-panel');
        console.log('Respuesta del panel informativo:', infoPanelResponse.data);
        
        if (infoPanelResponse.data) {
          setInfoPanel(infoPanelResponse.data);
        } else {
          console.warn('No se encontró información del panel, usando datos de respaldo');
          // Datos de respaldo solo si no hay panel en la BD
          setInfoPanel({
            id: 1,
            title: 'Información importante',
            content: 'Bienvenido al sistema de servicios de nuestra empresa.',
            notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos desde el servidor');
        setLoading(false);
        
        // Cargar datos de respaldo en caso de error
        setSlides([
          {
            id: 1,
            title: 'Promociones especiales',
            content: 'Aproveche nuestras promociones del mes',
            bgColor: '#bbdefb',
            orden: 1,
            activo: true
          }
        ]);
        
        setInfoPanel({
          id: 1,
          title: 'Información importante',
          content: 'Bienvenido al sistema de servicios de nuestra empresa.',
          notaImportante: 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'
        });
      }
    };
    
    fetchData();
  }, []);

  const maxSteps = slides.length;

  // Efecto para el cambio automático de imágenes cada 6 segundos
  useEffect(() => {
    if (slides.length <= 1) return; // No activar el temporizador si solo hay una o ninguna diapositiva
    
    const timer = setInterval(() => {
      // Usamos siempre la dirección left para el cambio automático
      setSlideDirection('left');
      setSlideIn(false);
      
      setTimeout(() => {
        setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
        setSlideIn(true);
      }, 300);
    }, 6000); // 6 segundos = 6000 ms
    
    // Limpiar el temporizador cuando el componente se desmonte o cuando activeStep cambie
    return () => {
      clearInterval(timer);
    };
  }, [activeStep, slides.length, maxSteps]); // Dependencias: activeStep, slides.length y maxSteps

  const handleNext = () => {
    setSlideDirection('left');
    setSlideIn(false);
    
    // Esperar a que termine la animación de salida antes de cambiar la diapositiva
    setTimeout(() => {
      setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
      setSlideIn(true);
    }, 300); // Este tiempo debe ser menor que la duración de la transición
  };

  const handleBack = () => {
    setSlideDirection('right');
    setSlideIn(false);
    
    // Esperar a que termine la animación de salida antes de cambiar la diapositiva
    setTimeout(() => {
      setActiveStep((prevActiveStep) => (prevActiveStep - 1 + maxSteps) % maxSteps);
      setSlideIn(true);
    }, 300); // Este tiempo debe ser menor que la duración de la transición
  };

  // Funciones auxiliares para formatear montos
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-PY', {
      maximumFractionDigits: 0
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido, {username}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Panel de operaciones del sistema de servicios
      </Typography>

      <Grid container spacing={3}>
        {/* Columna izquierda: Operaciones de Caja */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <PointOfSaleIcon fontSize="large" color="primary" />
              </Box>
              <Typography variant="h5" component="div" align="center">
                Operaciones de Caja
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Registrar ingresos, egresos y movimientos
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" paragraph>
                  Desde aquí podrás:
                </Typography>
                <ul>
                  <li>Registrar ingresos de efectivo</li>
                  <li>Procesar pagos de servicios</li>
                  <li>Realizar cierres de caja</li>
                  <li>Consultar movimientos</li>
                </ul>
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/cajas')}
                endIcon={<ArrowForwardIcon />}
              >
                Acceder
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Columna central: Carrusel de imágenes simplificado */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div" align="center" gutterBottom>
                Novedades
              </Typography>
              
              {slides.length > 0 ? (
                <Box sx={{ position: 'relative', height: 375, overflow: 'hidden' }}>
                  {/* Paper como contenedor base del carrusel */}
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: slides[activeStep].bgColor,
                      overflow: 'hidden',
                      padding: 0
                    }}
                  >
                    {/* Efecto de slide para la transición */}
                    <Slide direction={slideDirection} in={slideIn} timeout={500}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        {/* Contenido con Fade para suavizar la transición */}
                        <Fade in={slideIn} timeout={{ enter: 500, exit: 200 }}>
                          <Box sx={{ width: '100%', height: '100%' }}>
                            {slides[activeStep].imageUrl ? (
                              <Box
                                component="img"
                                src={slides[activeStep].imageUrl}
                                alt={slides[activeStep].title}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  margin: 0,
                                  padding: 0
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  height: '100%',
                                  p: 2
                                }}
                              >
                                <Typography variant="h6" gutterBottom>
                                  {slides[activeStep].title}
                                </Typography>
                                <Typography variant="body1">
                                  {slides[activeStep].content}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Fade>
                      </Box>
                    </Slide>
                  </Paper>
                  
                  {/* Botones de navegación sobre la imagen */}
                  <IconButton 
                    onClick={handleBack} 
                    size="small"
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    <KeyboardArrowLeft />
                  </IconButton>
                  
                  <IconButton 
                    onClick={handleNext} 
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    <KeyboardArrowRight />
                  </IconButton>
                  
                  {/* Indicadores en la parte inferior */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 16, 
                      left: 0, 
                      right: 0, 
                      display: 'flex', 
                      justifyContent: 'center',
                      zIndex: 2
                    }}
                  >
                    {slides.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          mx: 0.5,
                          bgcolor: index === activeStep ? 'primary.main' : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveStep(index)}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" align="center">
                  No hay novedades para mostrar
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Columna derecha: Panel informativo */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div" align="center" gutterBottom>
                {infoPanel?.title || 'Información importante'}
              </Typography>
              
              {/* Contenido principal aumentado en un 30% de altura */}
              <Box sx={{ minHeight: '390px' }}> {/* 300px * 1.3 = 390px */}
                <Typography variant="body1" paragraph>
                  {infoPanel?.content || 'Bienvenido al sistema de servicios de nuestra empresa.'}
                </Typography>
                
                {/* Si no hay panel informativo específico, mostramos contenido por defecto */}
                {!infoPanel && (
                  <>
                    <Typography variant="body1" paragraph>
                      <strong>Horario de atención:</strong><br />
                      Lunes a Viernes: 07:00 - 17:00<br />
                      Sábados: 07:00 - 12:00
                    </Typography>

                    <Typography variant="body1" paragraph>
                      <strong>Contacto de soporte:</strong><br />
                      soporte@empresa.com<br />
                      Tel: (021) 555-123
                    </Typography>
                  </>
                )}
              </Box>

              {/* Nota importante */}
              <Typography variant="body1" paragraph sx={{ color: 'error.main', fontWeight: 'bold', mt: 2 }}>
                {infoPanel?.notaImportante || 'Recuerde realizar su cierre de caja diario antes de finalizar su turno.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperadorView; 