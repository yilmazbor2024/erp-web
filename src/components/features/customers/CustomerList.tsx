import React, { useState } from 'react';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Pagination,
  Stack,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Place as PlaceIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Customer {
  customerCode: string;
  customerName: string;
  taxNumber?: string;
  taxOffice?: string;
  isActive: boolean;
  isBlocked: boolean;
  creditLimit?: number;
  openRisk?: number;
  totalRisk?: number;
  debit?: number;
  credit?: number;
  communications?: {
    communicationTypeCode: string;
    communication: string;
    isDefault: boolean;
  }[];
  addresses?: {
    addressTypeCode: string;
    address: string;
    city: string;
    district: string;
    isDefault: boolean;
  }[];
}

interface CustomerListProps {
  isMobile: boolean;
}

const mockCustomers: Customer[] = [
  {
    customerCode: 'CUS001',
    customerName: 'ABC Şirketi',
    taxNumber: '1234567890',
    taxOffice: 'İstanbul VD',
    isActive: true,
    isBlocked: false,
    creditLimit: 50000,
    openRisk: 15000,
    totalRisk: 25000,
    debit: 10000,
    credit: 5000,
    communications: [
      { communicationTypeCode: 'PHONE', communication: '0212 123 45 67', isDefault: true },
      { communicationTypeCode: 'EMAIL', communication: 'info@abccompany.com', isDefault: true }
    ],
    addresses: [
      {
        addressTypeCode: 'MAIN',
        address: 'Atatürk Cad. No:123',
        city: 'İstanbul',
        district: 'Şişli',
        isDefault: true
      }
    ]
  },
  {
    customerCode: 'CUS002',
    customerName: 'XYZ Ltd. Şti.',
    taxNumber: '9876543210',
    taxOffice: 'Ankara VD',
    isActive: true,
    isBlocked: false,
    creditLimit: 75000,
    openRisk: 30000,
    totalRisk: 40000,
    debit: 20000,
    credit: 10000,
    communications: [
      { communicationTypeCode: 'PHONE', communication: '0312 987 65 43', isDefault: true },
      { communicationTypeCode: 'EMAIL', communication: 'contact@xyzltd.com', isDefault: true }
    ],
    addresses: [
      {
        addressTypeCode: 'MAIN',
        address: 'Cumhuriyet Mah. 1923 Sok. No:45',
        city: 'Ankara',
        district: 'Çankaya',
        isDefault: true
      }
    ]
  }
];

export const CustomerList: React.FC<CustomerListProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const data = {
    customers: mockCustomers,
    totalCount: mockCustomers.length
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
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); 
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (isMobile) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Müşteriler</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Yeni Müşteri
          </Button>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Müşteri Ara..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'grid', gap: 2 }}>
          {data.customers.map((customer: Customer) => (
            <Card key={customer.customerCode}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {customer.customerName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {customer.customerCode}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {customer.addresses && customer.addresses.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PlaceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2">{customer.addresses[0].address}</Typography>
                    </Box>
                  )}
                  
                  {customer.communications && customer.communications.some(c => c.communicationTypeCode === 'PHONE') && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {customer.communications.find(c => c.communicationTypeCode === 'PHONE')?.communication}
                      </Typography>
                    </Box>
                  )}
                  
                  {customer.communications && customer.communications.some(c => c.communicationTypeCode === 'EMAIL') && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {customer.communications.find(c => c.communicationTypeCode === 'EMAIL')?.communication}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton 
                    color="primary"
                    onClick={() => handleViewCustomer(customer.customerCode)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton 
                    color="secondary"
                    onClick={() => handleEditCustomer(customer.customerCode)}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={Math.ceil(data.totalCount / 10)} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Müşteriler</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Yeni Müşteri
        </Button>
      </Box>
      
      <TextField
        placeholder="Müşteri Ara..."
        value={searchTerm}
        onChange={handleSearch}
        sx={{ mb: 2, width: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Müşteri Kodu</TableCell>
              <TableCell>Müşteri Adı</TableCell>
              <TableCell>Vergi No</TableCell>
              <TableCell>Vergi Dairesi</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.customers.map((customer: Customer) => (
              <TableRow key={customer.customerCode}>
                <TableCell>{customer.customerCode}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {customer.customerName}
                  </Typography>
                </TableCell>
                <TableCell>{customer.taxNumber}</TableCell>
                <TableCell>{customer.taxOffice}</TableCell>
                <TableCell>
                  {customer.isActive ? (
                    <Chip label="Aktif" color="success" size="small" />
                  ) : (
                    <Chip label="Pasif" color="default" size="small" />
                  )}
                  {customer.isBlocked && (
                    <Chip label="Bloke" color="error" size="small" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewCustomer(customer.customerCode)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="secondary"
                      onClick={() => handleEditCustomer(customer.customerCode)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination 
          count={Math.ceil(data.totalCount / 10)} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};