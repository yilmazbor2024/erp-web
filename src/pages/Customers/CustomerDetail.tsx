import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const CustomerDetail: React.FC = () => {
  const { customerCode } = useParams<{ customerCode: string }>();
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/customers');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mr: 2 }}>
          Geri
        </Button>
        <Typography variant="h5">
          Müşteri Detay: {customerCode}
        </Typography>
      </Box>
      
      <Typography>
        Bu sayfa henüz yapım aşamasındadır. Müşteri kodu: {customerCode}
      </Typography>
    </Box>
  );
};

export default CustomerDetail; 