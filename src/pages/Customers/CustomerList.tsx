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
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon, 
  Visibility as VisibilityIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Add as AddIcon,
  SentimentVeryDissatisfied as SadIcon
} from '@mui/icons-material';
import { useCustomerList } from '../../hooks/useCustomerList';
import { Customer } from '../../types/customer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerListProps {
  isMobile?: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ isMobile = false }) => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [inputValue, setInputValue] = React.useState('');
  const { data, isLoading, error, refetch } = useCustomerList({ page, searchTerm: debouncedSearchTerm });
  const navigate = useNavigate();

  // Sayfa yüklendiğinde verileri yeniden çek
  React.useEffect(() => {
    console.log('CustomerList: Component mounted, fetching data...');
    refetch();
  }, [refetch]);

  // Arama terimini debounce et (en az 3 karakter ve 500ms bekleme süresi)
  React.useEffect(() => {
    if (inputValue.length >= 3) {
      const handler = setTimeout(() => {
        console.log('CustomerList: Search term debounced:', inputValue);
        setDebouncedSearchTerm(inputValue);
      }, 500);
      
      return () => {
        clearTimeout(handler);
      };
    } else if (inputValue.length === 0 && searchTerm !== '') {
      // Arama kutusu temizlendiğinde tüm listeyi göster
      console.log('CustomerList: Search term cleared');
      setDebouncedSearchTerm('');
      setSearchTerm('');
    }
  }, [inputValue, searchTerm]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="warning">
          Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/login')}
        >
          Giriş Yap
        </Button>
      </Box>
    );
  }

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ ml: 2 }}>
        Müşteri listesi yükleniyor...
      </Typography>
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        <Typography variant="body1">Müşteri listesi yüklenirken bir hata oluştu:</Typography>
        <Typography variant="body2">{error instanceof Error ? error.message : 'Bilinmeyen hata'}</Typography>
      </Alert>
      <Button 
        variant="outlined" 
        color="primary" 
        sx={{ mt: 2 }}
        onClick={() => refetch()}
      >
        Yeniden Dene
      </Button>
    </Box>
  );

  if (!data || !data.customers || data.customers.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <SadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Müşteri bulunamadı
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/customers/create')}
          startIcon={<AddIcon />}
        >
          Yeni Müşteri Ekle
        </Button>
      </Box>
    );
  }

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
