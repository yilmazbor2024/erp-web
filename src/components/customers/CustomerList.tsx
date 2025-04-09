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
  Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useCustomerList } from '../../hooks/useCustomerList';
import { Customer } from '../../types/customer';

interface CustomerListProps {
  isMobile: boolean;
}

export const CustomerList: React.FC<CustomerListProps> = ({ isMobile }) => {
  const [page, setPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data, isLoading, error } = useCustomerList({ page, searchTerm });

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata oluştu: {error.message}</div>;
  if (!data) return null;

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  if (isMobile) {
    return (
      <Box p={2}>
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
                  {customer.isVIP && <span style={{ color: 'gold', marginLeft: 8 }}>VIP</span>}
                  {customer.isBlocked && <span style={{ color: 'red', marginLeft: 8 }}>Bloke</span>}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Müşteri Kodu: {customer.customerCode}
                </Typography>
                <Typography variant="body2">
                  {customer.cityDescription} / {customer.districtDescription}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={Math.ceil(data.totalCount / 10)} 
            page={page} 
            onChange={handlePageChange} 
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box p={2}>
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
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.customers.map((customer) => (
              <TableRow key={customer.customerCode}>
                <TableCell>{customer.customerCode}</TableCell>
                <TableCell>
                  {customer.customerName}
                  {customer.isVIP && <span style={{ color: 'gold', marginLeft: 8 }}>VIP</span>}
                </TableCell>
                <TableCell>{customer.cityDescription}</TableCell>
                <TableCell>{customer.districtDescription}</TableCell>
                <TableCell>
                  {customer.isBlocked ? 
                    <span style={{ color: 'red' }}>Bloke</span> : 
                    <span style={{ color: 'green' }}>Aktif</span>
                  }
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={Math.ceil(data.totalCount / 10)} 
          page={page} 
          onChange={handlePageChange} 
        />
      </Box>
    </Box>
  );
}; 