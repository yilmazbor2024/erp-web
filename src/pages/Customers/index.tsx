import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { CustomerList } from '../../components/customers/CustomerList';

const CustomersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return <CustomerList isMobile={isMobile} />;
};

export default CustomersPage; 