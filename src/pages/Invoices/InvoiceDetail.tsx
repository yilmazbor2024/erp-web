import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Divider, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Grid as MuiGrid } from '@mui/material';
import { Grid } from '../../utils/muiGridAdapter';
import { 
  ArrowBack, 
  Edit, 
  Cancel as CancelIcon,
  Print,
  Share
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { invoiceService } from '../../services/invoiceService';
import { LOCALE, CURRENCY, DATE_FORMAT } from '../../config/constants';

interface InvoiceDetail {
  invoiceHeaderId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  currAccCode: string;
  currAccDesc: string;
  officeCode: string;
  description1: string;
  description2: string;
  description3: string;
  description4: string;
  netTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentPlanCode: string;
  isCompleted: boolean;
  isCancelled: boolean;
  docTrackingNumber: string;
  lines: InvoiceLine[];
}

interface InvoiceLine {
  invoiceLineId: string;
  invoiceHeaderId: string;
  lineNumber: number;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  discountRate: number;
  discountAmount: number;
  description: string;
}

const InvoiceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await invoiceService.getInvoiceById(id);
        setInvoice(response.data);
      } catch (err) {
        console.error('Error fetching invoice details:', err);
        setError('Fatura bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleCancel = async () => {
    if (!id || !invoice || invoice.isCancelled) return;
    
    if (!window.confirm('Bu faturayı iptal etmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      setCancelLoading(true);
      const response = await invoiceService.cancelInvoice(id);
      if (response.success) {
        setInvoice(prev => prev ? {...prev, isCancelled: true} : null);
      } else {
        setError('Fatura iptal edilirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Error cancelling invoice:', err);
      setError('Fatura iptal edilirken bir hata oluştu.');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), DATE_FORMAT);
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error || 'Fatura bilgileri bulunamadı.'}</Alert>
          <Box mt={2}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />}
              onClick={() => navigate('/invoices')}
            >
              Faturalara Dön
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Fatura Detayı
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />}
              onClick={() => navigate('/invoices')}
              sx={{ mr: 1 }}
            >
              Geri
            </Button>
            {!invoice.isCancelled && (
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={cancelLoading}
                sx={{ mr: 1 }}
              >
                {cancelLoading ? <CircularProgress size={24} /> : 'İptal Et'}
              </Button>
            )}
            <Button 
              variant="outlined"
              startIcon={<Print />}
              sx={{ mr: 1 }}
            >
              Yazdır
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Edit />}
              onClick={() => navigate(`/invoices/${id}/edit`)}
              disabled={invoice.isCancelled}
            >
              Düzenle
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Fatura #{invoice.invoiceNumber}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tarih: {formatDate(invoice.invoiceDate)}
              </Typography>
            </Box>
            <Box textAlign="right">
              {invoice.isCancelled ? (
                <Chip 
                  label="İptal Edildi" 
                  color="error" 
                  size="medium" 
                  sx={{ fontSize: '1rem', height: 32, fontWeight: 'bold' }} 
                />
              ) : (
                <Chip 
                  label="Aktif" 
                  color="success" 
                  size="medium" 
                  sx={{ fontSize: '1rem', height: 32, fontWeight: 'bold' }} 
                />
              )}
              {invoice.docTrackingNumber && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Takip No: {invoice.docTrackingNumber}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Müşteri</Typography>
              <Typography variant="body1">{invoice.currAccDesc}</Typography>
              <Typography variant="body2" color="text.secondary">Kod: {invoice.currAccCode}</Typography>
            </Grid>
            <Grid xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Ofis</Typography>
              <Typography variant="body1">{invoice.officeCode}</Typography>
            </Grid>
            {invoice.description1 && (
              <Grid xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Açıklama 1</Typography>
                <Typography variant="body1">{invoice.description1}</Typography>
              </Grid>
            )}
            {invoice.description2 && (
              <Grid xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Açıklama 2</Typography>
                <Typography variant="body1">{invoice.description2}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Fatura Kalemleri</Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sıra</TableCell>
                  <TableCell>Ürün</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell align="right">Miktar</TableCell>
                  <TableCell>Birim</TableCell>
                  <TableCell align="right">Birim Fiyat</TableCell>
                  <TableCell align="right">İndirim</TableCell>
                  <TableCell align="right">Net Tutar</TableCell>
                  <TableCell align="right">KDV</TableCell>
                  <TableCell align="right">Toplam</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.invoiceLineId}>
                    <TableCell>{line.lineNumber / 10}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{line.itemDescription}</Typography>
                      <Typography variant="caption" color="textSecondary">{line.itemCode}</Typography>
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell align="right">{line.quantity}</TableCell>
                    <TableCell>{line.unitCode}</TableCell>
                    <TableCell align="right">{formatCurrency(line.unitPrice)}</TableCell>
                    <TableCell align="right">
                      {line.discountRate > 0 ? (
                        <>
                          {line.discountRate}% ({formatCurrency(line.discountAmount)})
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(line.netAmount)}</TableCell>
                    <TableCell align="right">
                      {line.taxRate}% ({formatCurrency(line.taxAmount)})
                    </TableCell>
                    <TableCell align="right">{formatCurrency(line.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="flex-end">
            <Grid container spacing={2} maxWidth="400px">
              <Grid xs={6}>
                <Typography variant="body2" color="text.secondary">Net Toplam:</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="body1" align="right">{formatCurrency(invoice.netTotal)}</Typography>
              </Grid>
              
              <Grid xs={6}>
                <Typography variant="body2" color="text.secondary">KDV Toplam:</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="body1" align="right">{formatCurrency(invoice.taxTotal)}</Typography>
              </Grid>
              
              <Grid xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">Genel Toplam:</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle1" align="right" fontWeight="bold">
                  {formatCurrency(invoice.grandTotal)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default InvoiceDetail; 