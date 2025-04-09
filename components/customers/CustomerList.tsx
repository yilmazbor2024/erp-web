import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import CustomerCard from './CustomerCard';
import CustomerListSkeleton from './CustomerListSkeleton';
import { useCustomerList } from '../../hooks/useCustomerList';

interface CustomerListProps {
  isMobile: boolean;
}

export const CustomerList: React.FC<CustomerListProps> = ({ isMobile }) => {
  const theme = useTheme();
  const isLaptop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('customerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useCustomerList({
    page,
    pageSize: rowsPerPage,
    searchTerm,
    sortField,
    sortDirection
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) return <CustomerListSkeleton />;
  if (error) return <div>Error loading customers: {error.message}</div>;

  const desktopColumns = [
    { field: 'customerCode', label: 'Müşteri Kodu' },
    { field: 'customerName', label: 'Müşteri Adı' },
    { field: 'cityDescription', label: 'Şehir' },
    { field: 'officeDescription', label: 'Ofis' },
    { field: 'currencyCode', label: 'Para Birimi' },
    { field: 'createdDate', label: 'Kayıt Tarihi' },
  ];

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
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

      {isLaptop ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {desktopColumns.map((column) => (
                  <TableCell key={column.field}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.label}
                      <IconButton size="small">
                        <SortIcon
                          sx={{
                            transform: sortField === column.field && sortDirection === 'desc'
                              ? 'rotate(180deg)'
                              : 'none',
                          }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.customers.map((customer) => (
                <TableRow key={customer.customerCode}>
                  <TableCell>{customer.customerCode}</TableCell>
                  <TableCell>{customer.customerName}</TableCell>
                  <TableCell>{customer.cityDescription || '-'}</TableCell>
                  <TableCell>{customer.officeDescription}</TableCell>
                  <TableCell>{customer.currencyCode}</TableCell>
                  <TableCell>
                    {new Date(customer.createdDate).toLocaleDateString('tr-TR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {data?.customers.map((customer) => (
            <Grid item xs={12} key={customer.customerCode}>
              <CustomerCard customer={customer} />
            </Grid>
          ))}
        </Grid>
      )}

      <TablePagination
        component="div"
        count={data?.totalCount || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Sayfa başına kayıt"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} / ${count}`
        }
      />
    </Box>
  );
}; 