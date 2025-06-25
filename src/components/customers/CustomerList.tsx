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
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon
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
  const [inputValue, setInputValue] = React.useState('');
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
    const value = event.target.value;
    setInputValue(value);
    
    // Sadece 3 veya daha fazla karakter girildiğinde veya hiç karakter yoksa arama yap
    if (value.length === 0 || value.length >= 3) {
      setSearchTerm(value);
      setPage(1);
    }
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
      
      // API'den gelen linki kontrol et ve düzelt
      if (tempLink) {
        // API'den gelen linkte localhost varsa, gerçek domain ile değiştir
        if (tempLink.includes('localhost')) {
          console.log('API yanıtında localhost tespit edildi, gerçek domain ile değiştiriliyor');
          tempLink = tempLink.replace(/http:\/\/localhost:\d+/g, FRONTEND_URL);
          console.log(`Düzeltilmiş link: ${tempLink}`);
        }
      } else {
        // Eğer API'den link gelmezse, FRONTEND_URL kullanarak oluştur
        console.log(`API'den link gelmedi. FRONTEND_URL: ${FRONTEND_URL}, NODE_ENV: ${process.env.NODE_ENV}`);
        
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
      <Box sx={{ px: '5px', py: 2 }}>
        {/* Başlık en üstte ortada */}
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ textAlign: 'center', mb: 3, fontWeight: 'bold', pt: 1 }}
        >
          Müşteriler
        </Typography>
        
        {/* Butonlar tek satırda */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
            sx={{ flex: 1 }}
          >
            Yeni Müşteri
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<ShareIcon />}
            onClick={() => setQrDialogOpen(true)}
            sx={{ flex: 1 }}
          >
            Link Ver
          </Button>
        </Box>
        
        {/* Arama alanı */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Müşteri Ara (min 3 karakter)..."
          value={inputValue}
          onChange={handleSearch}
          InputProps={{
            endAdornment: <SearchIcon 
              sx={{ 
                color: inputValue.length > 0 && inputValue.length < 3 ? 'action.disabled' : 'inherit',
                cursor: inputValue.length > 0 && inputValue.length < 3 ? 'not-allowed' : 'pointer'
              }} 
            />
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'grid', gap: 1.2, mx: 0 }}>
          {data.customers.map((customer) => (
            <Card key={customer.customerCode} sx={{ mx: 0 }}>
              <CardContent sx={{ px: 1.2, py: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.8 }}>
                  <Typography 
                    variant="body1" 
                    component="div" 
                    sx={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 'medium',
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {customer.customerName}
                    {customer.isBlocked && <span style={{ color: 'red', marginLeft: 8 }}>Bloke</span>}
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: 'primary.main', 
                      fontSize: '0.85rem',
                      ml: 1,
                      fontWeight: 'medium'
                    }}
                  >
                    {customer.customerCode}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.855rem',
                    color: 'text.secondary',
                    mb: 0.8
                  }}
                >
                  {customer.cityDescription} / {customer.districtDescription}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mt: 0.8, 
                  pt: 0.8, 
                  borderTop: '1px solid #eee',
                  fontSize: '0.85rem'
                }}>
                  <Box>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Borç
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                      {customer.debit !== undefined 
                        ? `${customer.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                        : '0.00 TL'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Alacak
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                      {customer.credit !== undefined 
                        ? `${customer.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                        : '0.00 TL'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Bakiye
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 'bold',
                      color: customer.balance && customer.balance < 0 ? 'error.main' : 'success.main'
                    }}>
                      {customer.balance !== undefined 
                        ? `${customer.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                        : '0.00 TL'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, mx: '5px' }}>
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
    <Box sx={{ px: '5px', py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mx: '5px' }}>
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
      
      <Box sx={{ display: 'flex', mb: 2, mx: '5px' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Müşteri Ara (min 3 karakter)..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (inputValue.length === 0 || inputValue.length >= 3) {
                setSearchTerm(inputValue);
                setPage(1);
              }
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={() => {
                  if (inputValue.length === 0 || inputValue.length >= 3) {
                    setSearchTerm(inputValue);
                    setPage(1);
                  }
                }}
                disabled={inputValue.length > 0 && inputValue.length < 3}
              >
                <SearchIcon 
                  sx={{ 
                    color: inputValue.length > 0 && inputValue.length < 3 ? 'action.disabled' : 'inherit'
                  }} 
                />
              </IconButton>
            )
          }}
        />
      </Box>
      
      <TableContainer component={Paper} sx={{ mx: '5px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Müşteri Kodu</TableCell>
              <TableCell>Müşteri Adı</TableCell>
              <TableCell>Şehir</TableCell>
              <TableCell>İlçe</TableCell>
              <TableCell align="right">Borç</TableCell>
              <TableCell align="right">Alacak</TableCell>
              <TableCell align="right">Bakiye</TableCell>
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
                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                  {customer.debit !== undefined 
                    ? `${customer.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                    : '0.00 TL'}
                </TableCell>
                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                  {customer.credit !== undefined 
                    ? `${customer.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                    : '0.00 TL'}
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold',
                  color: customer.balance && customer.balance < 0 ? 'error.main' : 'success.main'
                }}>
                  {customer.balance !== undefined 
                    ? `${customer.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                    : '0.00 TL'}
                </TableCell>
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