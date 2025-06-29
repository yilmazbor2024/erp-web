import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FRONTEND_URL } from '../../config/constants';
import { 
  Box,
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Button,
  InputAdornment,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Grid
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
  isMobile?: boolean;
}

export const CustomerList: React.FC<CustomerListProps> = ({ isMobile: propIsMobile = false }) => {
  const theme = useTheme();
  const isMobileDevice = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = propIsMobile || isMobileDevice;
  
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const { data, isLoading, error } = useCustomerList({ 
    page, 
    searchTerm, 
    offset, 
    pageSize: 20,
    useLazyLoading: true 
  });
  const navigate = useNavigate();
  
  // QR kod modalı  // QR Kod Dialog
  const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [tempLink, setTempLink] = useState<string>('');
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('00:00');
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string>('');
  
  // Modal görünürlüğünü kontrol etmek için ref
  const qrDialogRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<{open: boolean, message: string, type: 'success' | 'error'}>({open: false, message: '', type: 'success'});

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

  // Sayaç için useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (qrDialogOpen && expiryTime) {
      setRemainingTime(formatRemainingTime());
      
      timer = setInterval(() => {
        setRemainingTime(formatRemainingTime());
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrDialogOpen, expiryTime]);
  
  // Infinity scroll için scroll olayını dinleme
  const handleScroll = useCallback(() => {
    // (1) Sayfanın en altına ne kadar yakın olduğumuzu hesapla
    const scrollPosition = window.innerHeight + window.pageYOffset;
    // (2) Eşik değerini belirle (sayfa sonundan 300px önce)
    const scrollThreshold = document.documentElement.offsetHeight - 300; // Daha erken yüklemeye başla
    
    // (3) Konsola log yaz
    console.log('Scroll Position:', scrollPosition, 'Threshold:', scrollThreshold, 'Difference:', scrollThreshold - scrollPosition);
    
    // (4) Eşik değerine ulaşıldı mı kontrol et
    if (scrollPosition >= scrollThreshold) {
      // (5) Daha fazla veri yüklenebilir mi kontrol et
      // hasNextPage yerine her zaman daha fazla veri yüklemeyi dene
      if (!loadingMore) {
        // (6) Konsola log yaz
        console.log('Loading more data, current offset:', offset, 'allCustomers.length:', allCustomers.length);
        // (7) Yükleme durumunu güncelle
        setLoadingMore(true);
        // (8) Offset değerini artır
        setOffset(prev => prev + 20);
      }
    }
  }, [loadingMore, offset, allCustomers.length]);
  
  // Scroll olayını dinleme
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  // Yeni veriler yüklenince müşteri listesini güncelleme
  useEffect(() => {
    if (data?.customers) {
      console.log('Data loaded, customers count:', data.customers.length);
      
      if (offset === 0) {
        // İlk yükleme veya arama değiştiğinde listeyi sıfırla
        console.log('Resetting customer list');
        setAllCustomers(data.customers);
      } else {
        // Yeni müşterileri mevcut listeye ekle
        console.log('Appending customers to existing list');
        setAllCustomers(prev => [...prev, ...data.customers]);
      }
      setLoadingMore(false);
    }
  }, [data, offset]);

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
    // Sadece input değerini güncelle, arama yapma
    const value = event.target.value;
    setInputValue(value);
    // Otomatik arama kaldırıldı - sadece Enter veya buton ile arama yapılacak
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
    console.log('Link Ver butonuna tıklandı');
    
    setSelectedCustomerCode(customerCode);
    
    // localStorage'dan token al
    const token = localStorage.getItem('token');
    
    // customerCode dolu ise, mevcut müşteri için link oluştur
    axiosInstance.post(
      '/api/v1/Customer/create-temp-link',
      { customerCode } // Boş string gönderildiğinde API yeni kayıt için link oluşturacak
    )
    .then(response => {
      // API'den gelen yanıtı al
      console.log('API yanıtı:', response.data);
      
      // API yanıt yapısını kontrol et ve doğru şekilde işle
      let tempLinkValue = '';
      let expiryMinutesValue = 10; // Varsayılan 10 dakika
      
      if (response.data && response.data.data) {
        // Eğer yanıt data.data içinde geliyorsa
        tempLinkValue = response.data.data.tempLink;
        expiryMinutesValue = response.data.data.expiryMinutes || 10;
      } else if (response.data) {
        // Eğer yanıt doğrudan data içinde geliyorsa
        tempLinkValue = response.data.tempLink;
        expiryMinutesValue = response.data.expiryMinutes || 10;
      }
      
      // Eğer tempLink undefined ise, varsayılan bir değer ata
      if (!tempLinkValue) {
        // FRONTEND_URL kullanarak ortama göre doğru URL oluştur
        console.log(`Geçici link oluşturuluyor. FRONTEND_URL: ${FRONTEND_URL}`);
        
        // Token oluştur
        const randomToken = Math.random().toString(36).substring(2, 15);
        
        // URL oluştur
        tempLinkValue = `${FRONTEND_URL}/customer-registration?token=${randomToken}`;
        
        console.log(`Oluşturulan geçici link: ${tempLinkValue}`);
      }
      
      setTempLink(tempLinkValue);
      
      // QR kodu frontend'de oluştur
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tempLinkValue)}`;
      setQrCodeUrl(qrCode);
      
      // Şu anki zamana expiryMinutes ekleyerek son geçerlilik tarihini hesapla
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + expiryMinutesValue);
      setExpiryTime(expiry);
      
      console.log('QR dialog açılıyor...');
      setQrDialogOpen(true);
      console.log('QR dialog durumu:', qrDialogOpen);
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

  // Yükleniyor göstergesi
  const renderLoadingIndicator = () => {
    if (loadingMore) {
      return (
        <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    return null;
  };

  // Mobil görünüm için özel render fonksiyonu
  const renderMobileView = () => {
    return (
      <Box sx={{ p: 1 }}>
        {/* Sabit başlık ve arama alanı */}
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          backgroundColor: 'white', 
          zIndex: 10,
          pb: 1,
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', pt: 1, px: 1 }}>
            <TextField
              fullWidth
              placeholder="Müşteri Ara..."
              variant="outlined"
              size="small"
              value={inputValue}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Mobil görünümde Enter tuşuna basıldı, arama yapılıyor...');
                  // Karakter sınırı olmadan arama yap
                  setSearchTerm(inputValue);
                  setPage(1);
                  setOffset(0); // Arama yapıldığında offset'i sıfırla
                  setAllCustomers([]); // Listeyi temizle
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => {
                        // Karakter sınırı olmadan arama yap
                        setSearchTerm(inputValue);
                        setPage(1);
                        setOffset(0); // Arama yapıldığında offset'i sıfırla
                        setAllCustomers([]); // Listeyi temizle
                      }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 0 }}
            />
          </Box>
        </Box>
        
        {/* Müşteri listesi */}
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
          {/* Müşteri listesi başlıyor */}
          
          {/* Müşteri kart listesi */}
          {allCustomers.map((customer, index) => (
            <Box 
              key={customer.customerCode} 
              sx={{ 
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                '&:active': { backgroundColor: 'rgba(0,0,0,0.03)' },
                transition: 'background-color 0.1s'
              }}
              onClick={() => handleViewCustomer(customer.customerCode)}
            >
              {/* Üst satır: Müşteri kodu ve adı */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                px: 1.5,
              }}>
                {/* Sıra No ve Müşteri Kodu */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  maxWidth: '70%'
                }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium', 
                    fontSize: '0.85rem', 
                    color: 'text.secondary',
                    mr: 0.5
                  }}>
                    {index + 1}.
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {customer.customerCode}
                  </Typography>
                  
                  {/* Müşteri Adı */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: '500',
                      fontSize: '0.85rem',
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexGrow: 1
                    }}
                  >
                    {customer.customerName}
                    {customer.isBlocked && 
                      <span style={{ 
                        color: 'white', 
                        backgroundColor: '#f44336', 
                        fontSize: '0.7rem', 
                        padding: '1px 4px', 
                        borderRadius: '4px',
                        marginLeft: '6px',
                        verticalAlign: 'middle'
                      }}>
                        BLOKE
                      </span>
                    }
                  </Typography>
                </Box>
              </Box>
              
              {/* Orta satır: Borç, Alacak, Bakiye */}
              <Box sx={{ 
                display: 'flex', 
                width: '100%',
                py: 0.8,
                px: 1.5,
                borderTop: '1px solid rgba(0,0,0,0.03)',
                backgroundColor: 'rgba(0,0,0,0.01)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.77rem', display: 'block' }}>
                      Borç
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'medium', fontSize: '0.88rem' }}>
                      {customer.debit !== undefined 
                        ? `${customer.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                        : '0.00 TL'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.77rem', display: 'block' }}>
                      Alacak
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium', fontSize: '0.88rem' }}>
                      {customer.credit !== undefined 
                        ? `${customer.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                        : '0.00 TL'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.77rem', display: 'block' }}>
                      Bakiye
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '0.88rem',
                      color: customer.balance && customer.balance < 0 ? 'error.main' : 'success.main'
                    }}>
                      {customer.balance !== undefined 
                        ? `${customer.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                        : '0.00 TL'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Alt satır: Konum ve İşlemler */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 0.5,
                px: 1.5,
                borderTop: '1px solid rgba(0,0,0,0.03)',
                backgroundColor: 'rgba(0,0,0,0.01)'
              }}>
                {/* Ülke, şehir ve ilçe bilgileri */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <PlaceIcon sx={{ fontSize: '0.9rem', color: 'text.secondary', opacity: 0.7 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.88rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customer.countryDescription || 'Türkiye'}{customer.cityDescription ? `, ${customer.cityDescription}` : ''}{customer.districtDescription ? `, ${customer.districtDescription}` : ''}
                  </Typography>
                </Box>
                
                {/* İşlem butonları */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Detay">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCustomer(customer.customerCode);
                      }}
                      sx={{ padding: '4px' }}
                    >
                      <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Düzenle">
                    <IconButton 
                      size="small" 
                      color="secondary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer.customerCode);
                      }}
                      sx={{ padding: '4px' }}
                    >
                      <EditIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {/* Turuncu kesikli çizgi */}
              <Box sx={{ 
                borderBottom: '2px dashed orange',
                width: '100%',
                mt: 0.5
              }} />
            </Box>
          ))}
        </Box>
        
        {/* Sayfalama */}
        {renderLoadingIndicator()}
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
          sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', pt: 1 }}
        >
          Müşteriler
        </Typography>
        
        {/* Butonlar tek satırda */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
            size="small"
          >
            YENİ MÜŞTERİ
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<QrCodeIcon />}
            onClick={() => handleCreateTempLink('')}
            sx={{ flex: 1, py: 1 }}
            size="small"
          >
            LİNK VER
          </Button>
        </Box>
        
        {renderMobileView()}
      </Box>
    );
  }


  // Bildirim kapatma
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              console.log('Enter tuşuna basıldı, arama yapılıyor...');
              // Karakter sınırı olmadan arama yap
              setSearchTerm(inputValue);
              setPage(1);
              setOffset(0); // Aramada offset'i sıfırla
              setAllCustomers([]); // Müşteri listesini temizle
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={() => {
                  // Karakter sınırı olmadan arama yap
                  setSearchTerm(inputValue);
                  setPage(1);
                  setOffset(0); // Aramada offset'i sıfırla
                  setAllCustomers([]); // Müşteri listesini temizle
                }}
              >
                <SearchIcon />
              </IconButton>
            )
          }}
        />
      </Box>
      
      <TableContainer component={Paper} sx={{ mx: '5px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="60px" align="center">#</TableCell>
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
            {allCustomers.map((customer, index) => (
              <TableRow key={customer.customerCode}>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium', 
                    fontSize: '0.85rem', 
                    color: 'text.secondary'
                  }}>
                    {index + 1}.
                  </Typography>
                </TableCell>
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
      {renderLoadingIndicator()}
      
      {/* QR Kod ve Link Gösterme Modalı */}
      {qrDialogOpen && (
        <Dialog 
          open={true} 
          onClose={handleCloseQrDialog} 
          maxWidth="sm" 
          fullWidth
          fullScreen={isMobile}
          sx={{
            '& .MuiDialog-paper': {
              margin: isMobile ? 0 : 'auto',
              width: isMobile ? '100%' : undefined,
              height: isMobile ? '100%' : undefined,
              borderRadius: isMobile ? 0 : undefined,
              overflowY: 'auto'
            }
          }}
          ref={qrDialogRef}
        >
        <DialogTitle sx={{ textAlign: isMobile ? 'center' : 'left', pt: isMobile ? 3 : 2 }}>
          Geçici Müşteri Kayıt Linki
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mt: isMobile ? 3 : 2,
            px: isMobile ? 1 : 0
          }}>
            {qrCodeUrl && (
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                mb: 2
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="QR Kod" 
                  style={{ 
                    width: isMobile ? '180px' : '200px', 
                    height: isMobile ? '180px' : '200px', 
                    marginBottom: '16px' 
                  }} 
                />
              </Box>
            )}
            <Typography 
              variant={isMobile ? "body2" : "body1"} 
              gutterBottom
              sx={{ textAlign: 'center' }}
            >
              Bu link ile müşteri kendi bilgilerini doldurabilir:
            </Typography>
            <Box sx={{ 
              p: isMobile ? 1.5 : 2, 
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
                    mr: 1,
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
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
                size={isMobile ? "small" : "medium"}
                sx={{ mt: 1 }}
              >
                Linki Kopyala ve Paylaş
              </Button>
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                textAlign: 'center',
                fontWeight: 'medium'
              }}
            >
              Link geçerlilik süresi: <b>{formatRemainingTime()}</b>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: isMobile ? 3 : 2, justifyContent: 'center' }}>
          <Button 
            onClick={handleCloseQrDialog} 
            variant={isMobile ? "contained" : "text"}
            color="primary"
            size={isMobile ? "large" : "medium"}
            fullWidth={isMobile}
            sx={{ 
              minWidth: isMobile ? '80%' : 'auto',
              borderRadius: isMobile ? 2 : 'default'
            }}
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
      )}
      
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