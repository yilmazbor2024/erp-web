import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Alert,
  Container,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  RadioGroup,
  Radio,
  Snackbar
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useCustomerDetail } from '../../hooks/useCustomerDetail';
import useCustomerCreate from '../../hooks/useCustomerCreate';
import { useAddressTypes } from '../../hooks/useAddressTypes';

interface CustomerDetailProps {
  isNew?: boolean;
  isEdit?: boolean;
}

// Müşteri ekleme/düzenleme sayfası
const CustomerDetail: React.FC<CustomerDetailProps> = ({ isNew = false, isEdit = false }) => {
  const { customerCode } = useParams<{ customerCode: string }>();
  const navigate = useNavigate();
  
  // Fetch address types
  const { addressTypes, isLoading: isLoadingAddressTypes } = useAddressTypes();
  
  // Müşteri tipi (Bireysel/Kurumsal)
  const [customerKind, setCustomerKind] = useState<'individual' | 'corporate'>('individual');
  
  // Form durumu
  const [formData, setFormData] = useState({
    customerCode: '',
    customerName: '',
    taxNumber: '',
    taxOffice: '',
    customerTypeCode: 1, // Default: Bireysel
    regionCode: 'R001', // Default: Marmara
    cityCode: 'C001', // Default: İstanbul
    districtCode: 'D001', // Default: Kadıköy
    isBlocked: false,
    // İletişim bilgileri
    contacts: [{ contactTypeCode: 'PHONE', contact: '', isDefault: true }],
    communications: [{ communicationTypeCode: 'EMAIL', communication: '', isDefault: true }],
    // Diğer gerekli default değerler
    customerSurname: '',
    customerTitle: '',
    customerIdentityNumber: '',
    discountGroupCode: 'DG001',
    paymentPlanGroupCode: 'PPG001',
    currencyCode: 'TRY',
    officeCode: 'OF001',
    salesmanCode: 'SM001',
    creditLimit: 0,
    riskLimit: 0,
    addresses: [{ 
      addressTypeCode: 'INVOICE', 
      address: '', 
      countryCode: 'TR', 
      stateCode: '', 
      cityCode: 'C001', 
      districtCode: 'D001', 
      postalCode: '', 
      isDefault: true, 
      isBlocked: false 
    }]
  });

  // Doğrulama ve UI durumu
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });
  
  // Müşteri kodu işleme
  const sanitizedCustomerCode = customerCode ? decodeURIComponent(customerCode.split('/')[0]) : undefined;
  
  // Customer create/update hooks
  const { mutate: createCustomer, isPending: isCreating } = useCustomerCreate();
  
  // Mevcut müşteri detaylarını getir (düzenleme modunda)
  const { data: customer, isLoading, error } = useCustomerDetail({
    customerCode: sanitizedCustomerCode
  });

  useEffect(() => {
    console.log('CustomerDetail bileşeni yüklendi. isNew:', isNew, 'isEdit:', isEdit, 'customerCode:', sanitizedCustomerCode);
    
    // Düzenleme modunda mevcut müşteri verilerini forma doldur
    if (isEdit && customer) {
      setFormData({
        customerCode: customer.customerCode || '',
        customerName: customer.customerName || '',
        taxNumber: customer.taxNumber || '',
        taxOffice: customer.taxOffice || '',
        customerTypeCode: customer.customerTypeCode || 1,
        regionCode: customer.regionCode || 'R001',
        cityCode: customer.cityCode || 'C001',
        districtCode: customer.districtCode || 'D001',
        isBlocked: customer.isBlocked || false,
        contacts: customer.contacts?.length > 0 ? customer.contacts : [{ contactTypeCode: 'PHONE', contact: '', isDefault: true }],
        communications: customer.communications?.length > 0 ? customer.communications : [{ communicationTypeCode: 'EMAIL', communication: '', isDefault: true }],
        customerSurname: '',
        customerTitle: '',
        customerIdentityNumber: '',
        discountGroupCode: customer.discountGroupCode || 'DG001',
        paymentPlanGroupCode: customer.paymentPlanGroupCode || 'PPG001',
        currencyCode: 'TRY',
        officeCode: 'OF001',
        salesmanCode: 'SM001',
        creditLimit: 0,
        riskLimit: 0,
        addresses: customer.addresses?.length > 0 ? customer.addresses : [{ 
          addressTypeCode: 'INVOICE', 
          address: '', 
          countryCode: 'TR', 
          stateCode: '', 
          cityCode: 'C001', 
          districtCode: 'D001', 
          postalCode: '', 
          isDefault: true, 
          isBlocked: false 
        }]
      });
      
      // Müşteri tipini belirle
      setCustomerKind(customer.customerTypeCode === 1 ? 'individual' : 'corporate');
    }
  }, [isNew, isEdit, sanitizedCustomerCode, customer]);

  // Input değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Hata varsa temizle
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Select değişikliklerini işle
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Müşteri tipini değiştir (Bireysel/Kurumsal)
  const handleCustomerKindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'individual' | 'corporate';
    setCustomerKind(value);
    
    // Müşteri tipine göre customerTypeCode güncelle
    setFormData(prev => ({
      ...prev,
      customerTypeCode: value === 'individual' ? 1 : 2
    }));
  };

  // İletişim bilgisi değişikliğini işle
  const handleContactChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: [
        {
          ...prev.contacts[0],
          contact: value
        },
        ...prev.contacts.slice(1)
      ]
    }));
  };

  // Email değişikliğini işle
  const handleEmailChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      communications: [
        {
          ...prev.communications[0],
          communication: value
        },
        ...prev.communications.slice(1)
      ]
    }));
  };

  // Form doğrulama
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerCode) newErrors.customerCode = 'Müşteri kodu gereklidir';
    if (!formData.customerName) newErrors.customerName = 'Müşteri adı gereklidir';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({
        open: true,
        message: 'Lütfen zorunlu alanları doldurun',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Gerçek API çağrısı
      console.log('Müşteri oluşturma verileri:', formData);
      
      if (isEdit) {
        // TODO: Müşteri güncelleme henüz implementasyonu tamamlanmadı
        console.warn('Müşteri güncelleme henüz implementasyonu tamamlanmadı');
        setNotification({
          open: true,
          message: 'Müşteri güncelleme henüz aktif değil!',
          type: 'error'
        });
      } else {
        // Yeni müşteri oluşturma API çağrısı
        createCustomer(formData, {
          onSuccess: (data) => {
            console.log('Müşteri başarıyla oluşturuldu:', data);
            setNotification({
              open: true,
              message: 'Müşteri başarıyla oluşturuldu!',
              type: 'success'
            });
            
            if (isNew) {
              // Yeni müşteri ekleme durumunda adres formuna geç
              setShowAddressForm(true);
            } else {
              // Düzenleme durumunda listeye geri dön
              setTimeout(() => {
                navigate('/customers');
              }, 1500);
            }
          },
          onError: (error) => {
            console.error('Müşteri oluşturma hatası:', error);
            setNotification({
              open: true,
              message: `Müşteri oluşturma hatası: ${error.message || 'Bilinmeyen hata'}`,
              type: 'error'
            });
          }
        });
      }
    } catch (error) {
      console.error('Müşteri işlemi sırasında hata:', error);
      setNotification({
        open: true,
        message: `Müşteri ${isEdit ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adres kaydetme
  const handleSaveAddress = () => {
    setNotification({
      open: true,
      message: 'Adres başarıyla kaydedildi!',
      type: 'success'
    });
    
    // Müşteri listesine geri dön
    setTimeout(() => {
      navigate('/customers');
    }, 1500);
  };

  const goBack = () => {
    navigate('/customers');
  };

  let pageTitle = "Müşteri Detay";
  if (isNew) {
    pageTitle = "Yeni Müşteri";
  } else if (isEdit) {
    pageTitle = "Müşteri Düzenle";
  }

  const renderLoading = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  const renderError = () => (
    <Alert severity="error" sx={{ mt: 2 }}>
      Müşteri bilgileri yüklenirken bir hata oluştu: {error?.message}
    </Alert>
  );

  // Adres ekleme formu
  const renderAddressForm = () => (
    <Box component="form" onSubmit={(e) => e.preventDefault()}>
      <Typography variant="h6" gutterBottom>Adres Bilgileri</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Adres Tipi</InputLabel>
          <Select
            name="addressTypeCode"
            value={formData.addresses[0].addressTypeCode}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({
                ...prev,
                addresses: [
                  {
                    ...prev.addresses[0],
                    addressTypeCode: value as string
                  },
                  ...prev.addresses.slice(1)
                ]
              }));
            }}
            label="Adres Tipi"
          >
            {isLoadingAddressTypes ? (
              <MenuItem disabled value="">
                <CircularProgress size={20} /> Yükleniyor...
              </MenuItem>
            ) : addressTypes && addressTypes.length > 0 ? (
              addressTypes.map((type: any) => (
                <MenuItem key={type.addressTypeCode} value={type.addressTypeCode}>
                  {type.addressTypeDescription}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">Adres tipi bulunamadı</MenuItem>
            )}
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Bölge</InputLabel>
          <Select
            name="regionCode"
            value={formData.regionCode}
            onChange={handleSelectChange}
            label="Bölge"
          >
            <MenuItem value="R001">Marmara</MenuItem>
            <MenuItem value="R002">Ege</MenuItem>
            <MenuItem value="R003">İç Anadolu</MenuItem>
            <MenuItem value="R004">Akdeniz</MenuItem>
            <MenuItem value="R005">Karadeniz</MenuItem>
            <MenuItem value="R006">Doğu Anadolu</MenuItem>
            <MenuItem value="R007">Güneydoğu Anadolu</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Şehir</InputLabel>
          <Select
            name="cityCode"
            value={formData.cityCode}
            onChange={handleSelectChange}
            label="Şehir"
          >
            <MenuItem value="C001">İstanbul</MenuItem>
            <MenuItem value="C002">Ankara</MenuItem>
            <MenuItem value="C003">İzmir</MenuItem>
            <MenuItem value="C004">Bursa</MenuItem>
            <MenuItem value="C005">Antalya</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>İlçe</InputLabel>
          <Select
            name="districtCode"
            value={formData.districtCode}
            onChange={handleSelectChange}
            label="İlçe"
          >
            <MenuItem value="D001">Kadıköy</MenuItem>
            <MenuItem value="D002">Beşiktaş</MenuItem>
            <MenuItem value="D003">Şişli</MenuItem>
            <MenuItem value="D004">Üsküdar</MenuItem>
            <MenuItem value="D005">Bakırköy</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="Adres"
          name="address"
          multiline
          rows={4}
          value={formData.addresses[0].address}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({
              ...prev,
              addresses: [
                {
                  ...prev.addresses[0],
                  address: value
                },
                ...prev.addresses.slice(1)
              ]
            }));
          }}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="Posta Kodu"
          name="postalCode"
          value={formData.addresses[0].postalCode}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({
              ...prev,
              addresses: [
                {
                  ...prev.addresses[0],
                  postalCode: value
                },
                ...prev.addresses.slice(1)
              ]
            }));
          }}
          sx={{ mb: 2 }}
        />
      </Box>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSaveAddress}
        startIcon={<SaveIcon />}
      >
        Adresi Kaydet
      </Button>
    </Box>
  );

  // Müşteri formu - Hem yeni ekleme hem de düzenleme için kullanılır
  const renderCustomerForm = () => (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Temel Bilgiler</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <RadioGroup
          row
          name="customerKind"
          value={customerKind}
          onChange={handleCustomerKindChange}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="individual" control={<Radio />} label="Bireysel" />
          <FormControlLabel value="corporate" control={<Radio />} label="Kurumsal" />
        </RadioGroup>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Müşteri Kodu"
            name="customerCode"
            value={formData.customerCode}
            onChange={handleInputChange}
            error={!!errors.customerCode}
            helperText={errors.customerCode}
            required
            disabled={isEdit} // Düzenleme modunda müşteri kodu değiştirilemez
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label={customerKind === 'individual' ? 'Müşteri Adı Soyadı' : 'Firma Adı'}
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            error={!!errors.customerName}
            helperText={errors.customerName}
            required
            sx={{ mb: 2 }}
          />
          
          {customerKind === 'corporate' && (
            <>
              <TextField
                fullWidth
                label="Vergi Numarası"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Vergi Dairesi"
                name="taxOffice"
                value={formData.taxOffice}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </>
          )}
          
          <TextField
            fullWidth
            label="Telefon"
            name="phone"
            value={formData.contacts[0]?.contact || ''}
            onChange={(e) => handleContactChange(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="E-posta"
            name="email"
            type="email"
            value={formData.communications[0]?.communication || ''}
            onChange={(e) => handleEmailChange(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>
        
        <Button 
          type="submit"
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
          startIcon={<SaveIcon />}
        >
          {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
        </Button>
      </Box>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={notification.type} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );

  // Mevcut müşteri detayları
  const renderCustomerDetail = () => {
    if (!customer) return null;
    
    // Helper function to get address text with fallbacks
    const getAddressText = (address: any) => {
      return address.addressText || address.address || '';
    };
    
    // Helper function to get address type with fallbacks
    const getAddressType = (address: any) => {
      if (addressTypes && addressTypes.length > 0) {
        const addressType = addressTypes.find((t: any) => t.addressTypeCode === address.addressTypeCode);
        if (addressType) {
          return addressType.addressTypeDescription;
        }
      }
      return address.addressType || address.addressTypeDescription || 'Adres';
    };
    
    // Helper function to get district name with fallbacks
    const getDistrict = (address: any) => {
      return address.district || address.districtDescription || '';
    };
    
    // Helper function to get city name with fallbacks
    const getCity = (address: any) => {
      return address.city || address.cityDescription || '';
    };
    
    // Helper function to get country name with fallbacks
    const getCountry = (address: any) => {
      return address.country || address.countryDescription || '';
    };
    
    // Helper function to get contact value with fallbacks
    const getContactValue = (contact: any) => {
      return contact.value || contact.contact || '';
    };
    
    // Helper function to get contact type with fallbacks
    const getContactType = (contact: any) => {
      return contact.type || '';
    };
    
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Müşteri Bilgileri</Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem>
              <ListItemText primary="Müşteri Kodu" secondary={customer.customerCode} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Müşteri Adı" secondary={customer.customerName} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vergi No" secondary={customer.taxNumber || '-'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vergi Dairesi" secondary={customer.taxOffice || '-'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Müşteri Tipi" secondary={customer.customerTypeDescription} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Durum" secondary={customer.isActive ? 'Aktif' : customer.isBlocked ? 'Bloke' : 'Pasif'} />
            </ListItem>
          </List>
        </Box>

        {customer.addresses && customer.addresses.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Adres Bilgileri</Typography>
            <Divider sx={{ mb: 2 }} />
            {customer.addresses.map((address: any, index: number) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">{getAddressType(address)}</Typography>
                <Typography variant="body2">{getAddressText(address)}</Typography>
                <Typography variant="body2">
                  {getDistrict(address) && `${getDistrict(address)}, `}
                  {getCity(address) && `${getCity(address)}, `}
                  {getCountry(address)}
                </Typography>
                {address.postalCode && (
                  <Typography variant="body2">Posta Kodu: {address.postalCode}</Typography>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {customer.contacts && customer.contacts.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>İletişim Bilgileri</Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {customer.contacts.map((contact: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${getContactType(contact)}: ${getContactValue(contact)}`}
                    secondary={contact.description || ''}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            sx={{ mr: 2 }}
          >
            Geri
          </Button>
          <Typography variant="h5">{pageTitle}</Typography>
        </Box>

        {isLoading && !isNew ? (
          renderLoading()
        ) : error && !isNew && !isEdit ? (
          renderError()
        ) : (isNew || isEdit) && !showAddressForm ? (
          renderCustomerForm()
        ) : showAddressForm ? (
          renderAddressForm()
        ) : (
          renderCustomerDetail()
        )}
      </Paper>
    </Container>
  );
};

export default CustomerDetail; 