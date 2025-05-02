import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Pagination,
  Box,
  Button,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon, 
  Visibility as VisibilityIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useCustomerList } from '../../hooks/useCustomerList';
import { Customer } from '../../types/customer';
import { useNavigate } from 'react-router-dom';

interface CustomerListProps {
  isMobile: boolean;
}

export const CustomerList: React.FC<CustomerListProps> = ({ isMobile }) => {
  const [page, setPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data, isLoading, error } = useCustomerList({ page, searchTerm });
  const navigate = useNavigate();

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        {error instanceof Error ? `Hata: ${error.message}` : `Hata: ${error}`}
      </Alert>
    </Box>
  );
  if (!data) return null;

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleViewCustomer = (customerCode: string) => {
    navigate(`/customers/${customerCode}`);
  };

  const handleEditCustomer = (customerCode: string) => {
    navigate(`/customers/edit/${customerCode}`);
  };

  const handleAddCustomer = () => {
    navigate('/customers/new');
  };

  const handleAddressesClick = (customerCode: string) => {
    navigate(`/customers/${customerCode}/addresses`);
  };

  const handleContactsClick = (customerCode: string) => {
    navigate(`/customers/${customerCode}/contacts`);
  };

  const handleEmailsClick = (customerCode: string) => {
    navigate(`/customers/${customerCode}/emails`);
  };

  const renderPagination = () => {
    const totalPages = data ? Math.ceil(data.totalCount / 10) : 0;
    
    return (
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange} 
          color="primary"
          size={isMobile ? "small" : "medium"}
        />
      </Box>
    );
  };

  if (isMobile) {
    return (
      <Box p={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Müşteriler</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Yeni
          </Button>
        </Box>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Müşteri Ara..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            endAdornment: <SearchIcon />
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'grid', gap: 2 }}>
          {data.customers.map((customer) => (
            <Card key={customer.customerCode}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {customer.customerName}
                  {customer.isBlocked && <span style={{ color: 'red', marginLeft: 8 }}>Bloke</span>}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Müşteri Kodu: {customer.customerCode}
                </Typography>
                <Typography variant="body2">
                  {customer.cityDescription} / {customer.districtDescription}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Detay Görüntüle">
                    <IconButton size="small" color="primary" onClick={() => handleViewCustomer(customer.customerCode)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Düzenle">
                    <IconButton size="small" color="primary" onClick={() => handleEditCustomer(customer.customerCode)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        {renderPagination()}
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Müşteriler</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Yeni Müşteri
        </Button>
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Müşteri Ara..."
        value={searchTerm}
        onChange={handleSearch}
        InputProps={{
          endAdornment: <SearchIcon />
        }}
        sx={{ mb: 2 }}
      />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Müşteri Kodu</TableCell>
              <TableCell>Müşteri Adı</TableCell>
              <TableCell>Şehir</TableCell>
              <TableCell>İlçe</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.customers.map((customer) => (
              <TableRow key={customer.customerCode}>
                <TableCell>{customer.customerCode}</TableCell>
                <TableCell>
                  {customer.customerName}
                </TableCell>
                <TableCell>{customer.cityDescription}</TableCell>
                <TableCell>{customer.districtDescription}</TableCell>
                <TableCell>
                  {customer.isBlocked ? 
                    <span style={{ color: 'red' }}>Bloke</span> : 
                    <span style={{ color: 'green' }}>Aktif</span>
                  }
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Detay Görüntüle">
                      <IconButton size="small" color="info" onClick={() => handleViewCustomer(customer.customerCode)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzenle">
                      <IconButton size="small" color="primary" onClick={() => handleEditCustomer(customer.customerCode)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Adresler">
                      <IconButton size="small" color="secondary" onClick={() => handleAddressesClick(customer.customerCode)}>
                        <PlaceIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="İletişim">
                      <IconButton size="small" color="success" onClick={() => handleContactsClick(customer.customerCode)}>
                        <PhoneIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="E-posta">
                      <IconButton size="small" color="warning" onClick={() => handleEmailsClick(customer.customerCode)}>
                        <MailIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {renderPagination()}
    </Box>
  );
}; 