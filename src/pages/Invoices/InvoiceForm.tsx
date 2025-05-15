import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  TextField, 
  Autocomplete,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add, Delete, ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { DATE_FORMAT, CURRENCY, LOCALE } from '../../config/constants';
import { Grid } from '../../utils/muiGridAdapter';

interface Customer {
  customerCode: string;
  customerName: string;
}

interface PaymentPlan {
  paymentPlanCode: string;
  paymentPlanDesc: string;
  isCreditCardPlan: boolean;
}

interface Office {
  officeCode: string;
  officeDesc: string;
}

interface InvoiceLine {
  itemCode: string;
  itemDescription?: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  description?: string;
}

interface InvoiceFormProps {
  type?: 'purchase' | 'sales' | 'wholesale' | 'wholesale-purchase';
}

const calculateLineAmounts = (line: InvoiceLine): InvoiceLine => {
  const netAmount = line.quantity * line.unitPrice * (1 - line.discountRate / 100);
  const taxAmount = netAmount * (line.taxRate / 100);
  const totalAmount = netAmount + taxAmount;

  return {
    ...line,
    netAmount,
    taxAmount,
    totalAmount
  };
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ type = 'sales' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [invoiceTime, setInvoiceTime] = useState<Date | null>(new Date());
  const [officeCode, setOfficeCode] = useState('');
  const [paymentPlanCode, setPaymentPlanCode] = useState('');
  const [description1, setDescription1] = useState('');
  const [description2, setDescription2] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([{
    itemCode: '',
    itemDescription: '',
    quantity: 1,
    unitCode: 'AD',
    unitPrice: 0,
    taxRate: 18,
    discountRate: 0,
    netAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    description: ''
  }]);

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  // Totals
  const [netTotal, setNetTotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoading(true);
        const [customersRes, paymentPlansRes, officesRes] = await Promise.all([
          customerService.getCustomers(),
          invoiceService.getPaymentPlans(false, false),
          invoiceService.getOffices(false)
        ]);

        setCustomers(customersRes.data?.customers || []);
        setPaymentPlans(paymentPlansRes.data?.paymentPlans || []);
        setOffices(officesRes.data?.offices || []);

        // Set defaults
        if (officesRes.data?.offices?.length) {
          setOfficeCode(officesRes.data.offices[0].officeCode);
        }
        if (paymentPlansRes.data?.paymentPlans?.length) {
          setPaymentPlanCode(paymentPlansRes.data.paymentPlans[0].paymentPlanCode);
        }
      } catch (err) {
        console.error('Error loading reference data:', err);
        setError('Referans veriler yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Load invoice data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadInvoice = async () => {
        try {
          setLoading(true);
          const response = await invoiceService.getInvoiceById(id);
          const invoice = response.data;

          setCustomerCode(invoice.currAccCode);
          setCustomerName(invoice.currAccDesc);
          setInvoiceDate(new Date(invoice.invoiceDate));
          setInvoiceTime(new Date(`1970-01-01T${invoice.invoiceTime}`));
          setOfficeCode(invoice.officeCode);
          setPaymentPlanCode(invoice.paymentPlanCode);
          setDescription1(invoice.description1 || '');
          setDescription2(invoice.description2 || '');
          setLines(invoice.lines.map((line: any) => ({
            itemCode: line.itemCode,
            itemDescription: line.itemDescription,
            quantity: line.quantity,
            unitCode: line.unitCode,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            discountRate: line.discountRate || 0,
            netAmount: line.netAmount,
            taxAmount: line.taxAmount,
            totalAmount: line.totalAmount,
            description: line.description || ''
          })));
        } catch (err) {
          console.error('Error loading invoice:', err);
          setError('Fatura bilgileri yüklenirken hata oluştu.');
        } finally {
          setLoading(false);
        }
      };

      loadInvoice();
    }
  }, [id, isEditMode]);

  // Calculate totals when lines change
  useEffect(() => {
    const net = lines.reduce((sum, line) => sum + line.netAmount, 0);
    const tax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const grand = lines.reduce((sum, line) => sum + line.totalAmount, 0);

    setNetTotal(net);
    setTaxTotal(tax);
    setGrandTotal(grand);
  }, [lines]);

  const handleCustomerChange = (event: React.SyntheticEvent, value: Customer | null) => {
    if (value) {
      setCustomerCode(value.customerCode);
      setCustomerName(value.customerName);
    } else {
      setCustomerCode('');
      setCustomerName('');
    }
  };

  const handleAddLine = () => {
    setLines([...lines, {
      itemCode: '',
      itemDescription: '',
      quantity: 1,
      unitCode: 'AD',
      unitPrice: 0,
      taxRate: 18,
      discountRate: 0,
      netAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      description: ''
    }]);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = [...lines];
    newLines.splice(index, 1);
    if (newLines.length === 0) {
      handleAddLine();
    } else {
      setLines(newLines);
    }
  };

  const handleLineChange = (index: number, field: keyof InvoiceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Recalculate amounts if quantity, unitPrice, taxRate, or discountRate changes
    if (['quantity', 'unitPrice', 'taxRate', 'discountRate'].includes(field)) {
      newLines[index] = calculateLineAmounts(newLines[index]);
    }

    setLines(newLines);
  };

  const validateForm = (): boolean => {
    if (!customerCode) {
      setError('Lütfen müşteri seçiniz.');
      return false;
    }

    if (!invoiceDate) {
      setError('Lütfen fatura tarihi giriniz.');
      return false;
    }

    if (!officeCode) {
      setError('Lütfen ofis seçiniz.');
      return false;
    }

    if (!paymentPlanCode) {
      setError('Lütfen ödeme planı seçiniz.');
      return false;
    }

    // Validate line items
    if (lines.length === 0) {
      setError('En az bir satır eklemelisiniz.');
      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.itemCode) {
        setError(`Satır ${i + 1}: Ürün kodu girilmelidir.`);
        return false;
      }
      if (line.quantity <= 0) {
        setError(`Satır ${i + 1}: Miktar 0'dan büyük olmalıdır.`);
        return false;
      }
      if (line.unitPrice < 0) {
        setError(`Satır ${i + 1}: Birim fiyat 0 veya daha büyük olmalıdır.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const invoiceData = {
        customerCode,
        invoiceDate: invoiceDate!,
        invoiceTime: invoiceTime ? new Date(invoiceTime.getTime() - invoiceTime.getTimezoneOffset() * 60000) : undefined,
        officeCode,
        paymentPlanCode,
        description1,
        description2,
        description3: '',
        description4: '',
        lines: lines.map(line => ({
          itemCode: line.itemCode,
          quantity: line.quantity,
          unitCode: line.unitCode,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          discountRate: line.discountRate,
          description: line.description
        }))
      };

      let response;
      if (isEditMode) {
        // In reality, the API might not support updating invoices
        // This is just a placeholder for the UI flow
        alert('Uyarı: Fatura güncellemesi henüz aktif değildir.');
      } else {
        response = await invoiceService.createInvoice(invoiceData);
        if (response && response.isSuccess) {
          navigate('/invoices', { state: { success: true, message: 'Fatura başarıyla oluşturuldu.' }});
        } else {
          setError('Fatura oluşturulurken bir hata oluştu.');
        }
      }
    } catch (err: any) {
      console.error('Error submitting invoice:', err);
      setError(err.message || 'Fatura kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isEditMode ? 'Fatura Düzenle' : 'Yeni Fatura'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate('/invoices')}
          >
            Geri
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Fatura Bilgileri</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => `${option.customerCode} - ${option.customerName}`}
                  isOptionEqualToValue={(option, value) => option.customerCode === value.customerCode}
                  value={customerCode ? { customerCode, customerName } as Customer : null}
                  onChange={handleCustomerChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Müşteri"
                      required
                      fullWidth
                      margin="normal"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Ofis"
                  value={officeCode}
                  onChange={(e) => setOfficeCode(e.target.value)}
                  fullWidth
                  required
                  margin="normal"
                >
                  {offices.map((office) => (
                    <MenuItem key={office.officeCode} value={office.officeCode}>
                      {office.officeDesc}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fatura Tarihi"
                  fullWidth
                  value={invoiceDate ? format(invoiceDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    try {
                      setInvoiceDate(e.target.value ? new Date(e.target.value) : null);
                    } catch (err) {
                      setInvoiceDate(null);
                    }
                  }}
                  type="date"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fatura Saati"
                  fullWidth
                  value={invoiceTime ? format(invoiceTime, 'HH:mm') : ''}
                  onChange={(e) => {
                    try {
                      // Create a date object with today's date but the selected time
                      const today = new Date();
                      const [hours, minutes] = e.target.value.split(':');
                      today.setHours(parseInt(hours), parseInt(minutes));
                      setInvoiceTime(today);
                    } catch (err) {
                      setInvoiceTime(null);
                    }
                  }}
                  type="time"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Ödeme Planı"
                  value={paymentPlanCode}
                  onChange={(e) => setPaymentPlanCode(e.target.value)}
                  fullWidth
                  required
                  margin="normal"
                >
                  {paymentPlans.map((plan) => (
                    <MenuItem key={plan.paymentPlanCode} value={plan.paymentPlanCode}>
                      {plan.paymentPlanDesc}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Açıklama 1"
                  value={description1}
                  onChange={(e) => setDescription1(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Açıklama 2"
                  value={description2}
                  onChange={(e) => setDescription2(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Fatura Kalemleri</Typography>
              <Button 
                variant="outlined" 
                startIcon={<Add />}
                onClick={handleAddLine}
              >
                Kalem Ekle
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ürün Kodu</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell align="right">Miktar</TableCell>
                    <TableCell>Birim</TableCell>
                    <TableCell align="right">Birim Fiyat</TableCell>
                    <TableCell align="right">KDV %</TableCell>
                    <TableCell align="right">İndirim %</TableCell>
                    <TableCell align="right">Net Tutar</TableCell>
                    <TableCell align="right">KDV Tutarı</TableCell>
                    <TableCell align="right">Toplam</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          value={line.itemCode}
                          onChange={(e) => handleLineChange(index, 'itemCode', e.target.value)}
                          size="small"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={line.description || ''}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={line.unitCode}
                          onChange={(e) => handleLineChange(index, 'unitCode', e.target.value)}
                          size="small"
                          sx={{ width: '60px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                          sx={{ width: '100px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={line.taxRate}
                          onChange={(e) => handleLineChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          sx={{ width: '60px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={line.discountRate}
                          onChange={(e) => handleLineChange(index, 'discountRate', parseFloat(e.target.value) || 0)}
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          sx={{ width: '60px' }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(line.netAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(line.taxAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(line.totalAmount)}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveLine(index)}
                          disabled={lines.length <= 1}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Fatura Özeti</Typography>
              
              <Box>
                <Grid container spacing={2} justifyContent="flex-end" alignItems="center">
                  <Grid item>
                    <Typography variant="body2" color="textSecondary">Net Toplam:</Typography>
                    <Typography variant="h6">{formatCurrency(netTotal)}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="textSecondary">KDV Toplam:</Typography>
                    <Typography variant="h6">{formatCurrency(taxTotal)}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="textSecondary">Genel Toplam:</Typography>
                    <Typography variant="h6">{formatCurrency(grandTotal)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/invoices')}
              sx={{ mr: 1 }}
              disabled={saving}
            >
              İptal
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              startIcon={<Save />}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Kaydet'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default InvoiceForm; 