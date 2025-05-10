import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import BalanceFarmaciaLista from './BalanceFarmaciaLista';

const BalanceFarmacia: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Balance con Farmacia
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <BalanceFarmaciaLista />
      </Paper>
    </Box>
  );
};

export default BalanceFarmacia; 