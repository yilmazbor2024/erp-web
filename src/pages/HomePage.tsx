import React, { useState, useEffect } from 'react';
import { Card, Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { CustomerList } from '../components/customers/CustomerList';
import useViewModeStore from '../stores/viewModeStore';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { mode } = useViewModeStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768 || mode === 'mobile');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || mode === 'mobile');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode]);

  useEffect(() => {
    setIsMobile(mode === 'mobile');
  }, [mode]);

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Müşteriler
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/new')}
        >
          Yeni Müşteri
        </Button>
      </Box>
      
      <CustomerList isMobile={isMobile} />
    </Box>
  );
};

export default HomePage;
