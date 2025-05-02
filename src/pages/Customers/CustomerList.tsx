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
  isMobile?: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ isMobile = false }) => {
  const [page, setPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [inputValue, setInputValue] = React.useState('');
  const { data, isLoading, error } = useCustomerList({ page, searchTerm: debouncedSearchTerm });
  const navigate = useNavigate();

  // Arama terimini debounce et (en az 3 karakter ve 500ms bekleme süresi)
  React.useEffect(() => {
    if (inputValue.length >= 3) {
      const handler = setTimeout(() => {
        setDebouncedSearchTerm(inputValue);
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    } else if (inputValue.length === 0) {
      // Arama alanı boşsa, aramanın temizlenmesi için
      setDebouncedSearchTerm('');
    }
  }, [inputValue]);

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        {error instanceof Error ? `Hata: ${error.message}` : `Hata: ${error}`}
      </Alert>
    </Box>
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSearchSubmit = () => {
    setDebouncedSearchTerm(inputValue);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
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

  const renderMobileView = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder="Müşteri Ara..."
            value={inputValue}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              ),
              endAdornment: (
                <IconButton 
                  size="small" 
                  onClick={handleSearchSubmit}
                  disabled={inputValue.length < 3 && inputValue.length > 0}
                >
                  <SearchIcon />
                </IconButton>
              )
            }}
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Yeni
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
          {data?.customers?.map((customer) => (
            <Card key={customer.customerCode} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div">
                    {customer.customerName}
                  </Typography>
                  <Box>
                    <Tooltip title="Görüntüle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewCustomer(customer.customerCode)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzenle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditCustomer(customer.customerCode)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  Kod: {customer.customerCode}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PlaceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">{customer.cityDescription || '-'}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">-</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">-</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={data?.totalPages || 1} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      </Box>
    );
  };

  const renderDesktopView = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder="Müşteri Ara..."
            value={inputValue}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              ),
              endAdornment: (
                <IconButton 
                  size="small" 
                  onClick={handleSearchSubmit}
                  disabled={inputValue.length < 3 && inputValue.length > 0}
                >
                  <SearchIcon />
                </IconButton>
              )
            }}
            sx={{ width: '300px' }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Yeni Müşteri
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Müşteri Kodu</TableCell>
                <TableCell>Müşteri Adı</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Müşteri Tipi</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.customers?.map((customer) => (
                <TableRow key={customer.customerCode}>
                  <TableCell>{customer.customerCode}</TableCell>
                  <TableCell>{customer.customerName}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{customer.customerTypeDescription}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Görüntüle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewCustomer(customer.customerCode)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzenle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditCustomer(customer.customerCode)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={data?.totalPages || 1} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      </Box>
    );
  };

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default CustomerList;
