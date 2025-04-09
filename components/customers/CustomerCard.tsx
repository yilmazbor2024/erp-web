import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  CardActions,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface CustomerCardProps {
  customer: {
    customerCode: string;
    customerName: string;
    cityDescription?: string;
    officeDescription: string;
    currencyCode: string;
    createdDate: string;
    isVIP: boolean;
    isBlocked: boolean;
  };
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  return (
    <Card sx={{ width: '100%', mb: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div">
              {customer.customerName}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              {customer.customerCode}
            </Typography>
          </Box>
          <Box>
            {customer.isVIP && (
              <Chip
                label="VIP"
                color="primary"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {customer.isBlocked && (
              <Chip
                label="Bloke"
                color="error"
                size="small"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {customer.cityDescription || 'Belirtilmemiş'} - {customer.officeDescription}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Para Birimi: {customer.currencyCode}
          </Typography>
        </Box>

        <Typography variant="body2" color="textSecondary">
          Kayıt: {new Date(customer.createdDate).toLocaleDateString('tr-TR')}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton size="small" color="primary">
          <EditIcon />
        </IconButton>
        <IconButton size="small" color="error">
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default CustomerCard; 