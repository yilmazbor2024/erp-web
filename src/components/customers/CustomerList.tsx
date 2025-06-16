import React, { useState, useEffect } from 'react';
import { FRONTEND_URL } from '../../config/constants';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
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
  QrCode as QrCodeIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useCustomerList } from '../../hooks/useCustomerList';
import { Customer } from '../../types/customer';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../config/axios';

interface CustomerListProps {
  isMobile: boolean;
}

export const CustomerList: React.FC<CustomerListProps> = ({ isMobile }) => {
  const [page, setPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data, isLoading, error } = useCustomerList({ page, searchTerm });
  const navigate = useNavigate();
  
  // QR kod modalı için state'ler
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [tempLink, setTempLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [selectedCustomerCode, setSelectedCustomerCode] = useState('');
  const [notification, setNotification] = useState<{open: boolean, message: string, type: 'success' | 'error'}>({open: false, message: '', type: 'success'});

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
    // Doğrudan /customers/create sayfasına yönlendir
    window.location.href = '/customers/create';
  };

  const handleCreateTempLink = (customerCode: string) => {
    setSelectedCustomerCode(customerCode);
    
    // localStorage'dan token al
    const token = localStorage.getItem('token');
    
    // customerCode boş ise, yeni bir geçici müşteri kaydı için link oluştur
    // customerCode dolu ise, mevcut müşteri için link oluştur
    axiosInstance.post(
      '/api/v1/Customer/create-temp-link',
      { customerCode } // Boş string gönderildiğinde API yeni kayıt için link oluşturacak
    )
    .then(response => {
      // API'den gelen yanıtı al
      console.log('API yanıtı:', response.data);
      
      // API yanıt yapısını kontrol et ve doğru şekilde işle
      let tempLink, expiryMinutes;
      
      if (response.data && response.data.data) {
        // Eğer yanıt data.data içinde geliyorsa
        tempLink = response.data.data.tempLink;
        expiryMinutes = response.data.data.expiryMinutes;
      } else if (response.data) {
        // Eğer yanıt doğrudan data içinde geliyorsa
        tempLink = response.data.tempLink;
        expiryMinutes = response.data.expiryMinutes;
      }
      
      // Eğer tempLink undefined ise, varsayılan bir değer ata
      if (!tempLink) {
        // FRONTEND_URL kullanarak ortama göre doğru URL oluştur
        // Üretim ortamında olup olmadığımızı kontrol et
        console.log(`Geçici link oluşturuluyor. FRONTEND_URL: ${FRONTEND_URL}, NODE_ENV: ${process.env.NODE_ENV}`);
        
        // Token oluştur
        const randomToken = Math.random().toString(36).substring(2, 15);
        
        // URL oluştur
        tempLink = `${FRONTEND_URL}/customer-registration?token=${randomToken}`;
        
        console.log(`Oluşturulan geçici link: ${tempLink}`);
      }
      
      // Eğer expiryMinutes undefined ise, varsayılan bir değer ata
      if (!expiryMinutes) {
        expiryMinutes = 10; // Varsayılan 10 dakika
      }
      
      setTempLink(tempLink);
      
      // QR kodu frontend'de oluştur
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tempLink)}`;
      setQrCodeUrl(qrCode);
      
      // Şu anki zamana expiryMinutes ekleyerek son geçerlilik tarihini hesapla
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
      setExpiryTime(expiry);
      
      setQrDialogOpen(true);
    })
    .catch(error => {
      console.error('Geçici link oluşturma hatası:', error);
      setNotification({
        open: true,
        message: 'Geçici link oluşturulurken bir hata oluştu!',
        type: 'error'
      });
    });
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
  };

  // Kalan süreyi hesaplama
  const formatRemainingTime = () => {
    if (!expiryTime) return '00:00';
    
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return '00:00';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins < 10 ? '0' + diffMins : diffMins}:${diffSecs < 10 ? '0' + diffSecs : diffSecs}`;
  };

  // Linki panoya kopyalama
  const copyToClipboard = () => {
    if (tempLink) {
      navigator.clipboard.writeText(tempLink)
        .then(() => {
          setNotification({
            open: true,
            message: 'Link panoya kopyalandı!',
            type: 'success'
          });
        })
        .catch(err => {
          console.error('Kopyalama hatası:', err);
          // Alternatif kopyalama yöntemi
          try {
            const textArea = document.createElement('textarea');
            textArea.value = tempLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setNotification({
              open: true,
              message: 'Link panoya kopyalandı!',
              type: 'success'
            });
          } catch (e) {
            setNotification({
              open: true,
              message: 'Link kopyalanırken bir hata oluştu!',
              type: 'error'
            });
          }
        });
    }
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

  // Bildirim kapatma
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };
  
  return (
    <Box p={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Müşteriler</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Yeni Müşteri
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<QrCodeIcon />}
            onClick={() => handleCreateTempLink('')}
          >
            Link Ver
          </Button>
        </Box>
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
      
      {/* QR Kod ve Link Gösterme Modalı */}
      <Dialog open={qrDialogOpen} onClose={handleCloseQrDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Geçici Müşteri Kayıt Linki</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Kod" style={{ width: '200px', height: '200px', marginBottom: '16px' }} />
            )}
            <Typography variant="body1" gutterBottom>
              Bu link ile müşteri kendi bilgilerini doldurabilir:
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 1, 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              mb: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    wordBreak: 'break-all',
                    flexGrow: 1,
                    mr: 1
                  }}
                >
                  {tempLink}
                </Typography>
                <IconButton onClick={copyToClipboard} size="small">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={copyToClipboard}
                startIcon={<ContentCopyIcon />}
                sx={{ mt: 1 }}
              >
                Linki Kopyala ve Paylaş
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Link geçerlilik süresi: <b>{formatRemainingTime()}</b>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>Kapat</Button>
        </DialogActions>
      </Dialog>
      
      {/* Bildirimler */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Box>
  );
};