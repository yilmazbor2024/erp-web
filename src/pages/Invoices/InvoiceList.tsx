import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  Box,
  TextField,
  IconButton,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Grid } from '../../utils/muiGridAdapter';
import { Add, Search, FilterList, Visibility, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { invoiceService } from '../../services/invoiceService';

interface InvoiceItem {
  invoiceHeaderId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  currAccCode: string;
  currAccDesc: string;
  netTotal: number;
  grandTotal: number;
  isCompleted: boolean;
  isCancelled: boolean;
}

interface InvoiceListProps {
  type?: 'purchase' | 'sales' | 'all';
}

const InvoiceList: React.FC<InvoiceListProps> = ({ type = 'all' }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('invoiceDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [customerCode, setCustomerCode] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getInvoices({
        pageSize: rowsPerPage,
        pageNumber: page + 1,
        sortBy,
        sortDirection,
        customerCode: customerCode || undefined,
        invoiceNumber: invoiceNumber || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type
      });

      if (response && response.data) {
        setInvoices(response.data.invoices);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, sortBy, sortDirection, type]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchInvoices();
  };

  const handleClearFilters = () => {
    setCustomerCode('');
    setInvoiceNumber('');
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    
    // Reset to default sort
    setSortBy('invoiceDate');
    setSortDirection('desc');
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Faturalar
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              Filtreler
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />}
              onClick={() => navigate('/invoices/new')}
            >
              Yeni Fatura
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Müşteri Kodu"
                  fullWidth
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Fatura Numarası"
                  fullWidth
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Başlangıç Tarihi"
                  fullWidth
                  value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    try {
                      setStartDate(e.target.value ? new Date(e.target.value) : null);
                    } catch (err) {
                      setStartDate(null);
                    }
                  }}
                  type="date"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Bitiş Tarihi"
                  fullWidth
                  value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    try {
                      setEndDate(e.target.value ? new Date(e.target.value) : null);
                    } catch (err) {
                      setEndDate(null);
                    }
                  }}
                  type="date"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button 
                    variant="outlined" 
                    onClick={handleClearFilters} 
                    sx={{ mr: 1 }}
                  >
                    Temizle
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleApplyFilters}
                  >
                    Filtrele
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('invoiceNumber')}
                    style={{ cursor: 'pointer' }}
                  >
                    Fatura No.
                    {sortBy === 'invoiceNumber' && (
                      <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('invoiceDate')}
                    style={{ cursor: 'pointer' }}
                  >
                    Fatura Tarihi
                    {sortBy === 'invoiceDate' && (
                      <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('currAccDesc')}
                    style={{ cursor: 'pointer' }}
                  >
                    Müşteri
                    {sortBy === 'currAccDesc' && (
                      <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    Tutar
                  </TableCell>
                  <TableCell align="center">
                    Durum
                  </TableCell>
                  <TableCell align="right">
                    İşlemler
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      Fatura bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.invoiceHeaderId} hover>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{invoice.currAccDesc}</Typography>
                          <Typography variant="caption" color="textSecondary">{invoice.currAccCode}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(invoice.grandTotal)}</TableCell>
                      <TableCell align="center">
                        {invoice.isCancelled ? (
                          <Chip label="İptal Edildi" color="error" size="small" />
                        ) : (
                          <Chip label="Aktif" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => handleViewInvoice(invoice.invoiceHeaderId)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına kayıt:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `${to}`}`}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default InvoiceList; 