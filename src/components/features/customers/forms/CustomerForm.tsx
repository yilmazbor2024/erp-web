import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Divider,
  Paper,
  List,
  ListItem,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  useTaxOffices
} from '../../../../hooks/useTaxOffices';
import { useCurrencies } from '../../../../hooks/useCurrencies';
import { customerApi } from '../../../../services/api';

interface Customer {
  customerCode: string;
  customerName: string;
  isRealPerson: boolean;
  identityNumber: string;
  taxNumber: string;
  taxOfficeCode: string;
  creditLimit: number;
  paymentTerm: number;
  currency: string;
  isVIP: boolean;
  isBlocked: boolean;
  communications: CustomerCommunication[];
  addresses: CustomerAddress[];
}

interface CustomerCommunication {
  communicationTypeCode: string;
  communication: string;
  isDefault: boolean;
  isBlocked: boolean;
}

interface CustomerAddress {
  addressTypeCode: string;
  address: string;
  cityCode: string;
  districtCode: string;
  buildingNum?: string;
  floorNum?: number;
  doorNum?: number;
  quarterCode?: number;
  streetCode?: number;
  isDefault: boolean;
  isBlocked: boolean;
  [key: string]: any;
}

interface CustomerFormProps {
  initialData: Customer;
  onSubmit: (data: Customer) => void;
  isLoading: boolean;
  isEdit?: boolean;
  activeSection?: 'basic' | 'communication' | 'address' | 'financial';
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading, 
  isEdit = false,
  activeSection 
}) => {
  const [data, setData] = useState<Customer>(initialData || {
    customerCode: '',
    customerName: '',
    isRealPerson: false,
    identityNumber: '',
    taxNumber: '',
    taxOfficeCode: '',
    creditLimit: 0,
    paymentTerm: 30,
    currency: 'USD', // Varsayılan para birimi USD olarak değiştirildi
    isVIP: false,
    isBlocked: false,
    communications: [],
    addresses: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Vergi dairelerini API'den al
  const { data: taxOfficesData, isLoading: isLoadingTaxOffices } = useTaxOffices();
  
  // Para birimlerini API'den al
  const { data: currenciesData, isLoading: isLoadingCurrencies } = useCurrencies();
  
  // Seçilen vergi dairesinin adını bulmak için state
  const [selectedTaxOfficeName, setSelectedTaxOfficeName] = useState<string>('');
  
  // Vergi daireleri ve para birimleri yüklendiğinde konsola yazdır
  useEffect(() => {
    console.log('CustomerForm: Vergi daireleri yüklendi mi?', !isLoadingTaxOffices);
    console.log('CustomerForm: Vergi daireleri veri sayısı:', taxOfficesData?.length || 0);
    if (taxOfficesData && taxOfficesData.length > 0) {
      console.log('CustomerForm: İlk 3 vergi dairesi:', JSON.stringify(taxOfficesData.slice(0, 3)));
    }
    
    console.log('CustomerForm: Para birimleri yüklendi mi?', !isLoadingCurrencies);
    console.log('CustomerForm: Para birimleri veri sayısı:', currenciesData?.length || 0);
  }, [taxOfficesData, isLoadingTaxOffices, currenciesData, isLoadingCurrencies]);
  
  // Vergi dairesi seçildiğinde adını güncelle
  useEffect(() => {
    if (data.taxOfficeCode && taxOfficesData) {
      const selectedOffice = taxOfficesData.find(office => office.taxOfficeCode === data.taxOfficeCode);
      if (selectedOffice) {
        setSelectedTaxOfficeName(selectedOffice.taxOfficeDescription || '');
      }
    }
  }, [data.taxOfficeCode, taxOfficesData]);
  
  // Form değişikliklerini işle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Select değişikliklerini işle
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Switch değişikliklerini işle
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setData({ ...data, [name]: checked });
  };
  
  // İletişim bilgisi ekle
  const handleAddCommunication = (type: string) => {
    const newComm: CustomerCommunication = {
      communicationTypeCode: type,
      communication: '',
      isDefault: data.communications.filter(c => c.communicationTypeCode === type).length === 0,
      isBlocked: false
    };
    
    setData({
      ...data,
      communications: [...data.communications, newComm]
    });
  };
  
  // İletişim bilgisi değiştir
  const handleCommunicationChange = (index: number, value: string) => {
    const newComms = [...data.communications];
    newComms[index].communication = value;
    
    setData({
      ...data,
      communications: newComms
    });
  };
  
  // İletişim bilgisi sil
  const handleDeleteCommunication = (index: number) => {
    const newComms = [...data.communications];
    newComms.splice(index, 1);
    
    setData({
      ...data,
      communications: newComms
    });
  };
  
  // Adres ekle
  const handleAddAddress = () => {
    const newAddress: CustomerAddress = {
      addressTypeCode: 'HOME',
      address: '',
      cityCode: '',
      districtCode: '',
      isDefault: data.addresses.length === 0,
      isBlocked: false
    };
    
    setData({
      ...data,
      addresses: [...data.addresses, newAddress]
    });
  };
  
  // Adres değiştir
  const handleAddressChange = (index: number, field: keyof CustomerAddress, value: any) => {
    const newAddresses = [...data.addresses];
    if (!newAddresses[index]) {
      newAddresses[index] = {
        addressTypeCode: '',
        address: '',
        cityCode: '',
        districtCode: '',
        isDefault: false,
        isBlocked: false
      } as CustomerAddress;
    }
    newAddresses[index][field] = value;
    
    setData({
      ...data,
      addresses: newAddresses
    });
  };
  
  // Adres sil
  const handleDeleteAddress = (index: number) => {
    const newAddresses = [...data.addresses];
    newAddresses.splice(index, 1);
    
    setData({
      ...data,
      addresses: newAddresses
    });
  };
  
  // Formu doğrula
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.customerCode) {
      newErrors.customerCode = 'Müşteri kodu gereklidir';
    }
    
    if (!data.customerName) {
      newErrors.customerName = 'Müşteri adı gereklidir';
    }
    
    if (data.isRealPerson && !data.identityNumber) {
      newErrors.identityNumber = 'TC Kimlik numarası gereklidir';
    } else if (data.isRealPerson && data.identityNumber && data.identityNumber.length !== 11) {
      newErrors.identityNumber = 'TC Kimlik numarası 11 haneli olmalıdır';
    }
    
    if (!data.isRealPerson && !data.taxNumber) {
      newErrors.taxNumber = 'Vergi numarası gereklidir';
    }
    
    if (!data.isRealPerson && !data.taxOfficeCode) {
      newErrors.taxOfficeCode = 'Vergi dairesi gereklidir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formu gönder
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(data);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Temel Bilgiler */}
        {(!activeSection || activeSection === 'basic') && renderBasicForm()}
        
        {/* İletişim Bilgileri */}
        {(!activeSection || activeSection === 'communication') && renderCommunicationForm()}
        
        {/* Adres Bilgileri */}
        {(!activeSection || activeSection === 'address') && renderAddressForm()}
        
        {/* Finansal Bilgiler */}
        {(!activeSection || activeSection === 'financial') && renderFinancialForm()}
        
        {/* Form Butonları */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isLoading}
          >
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
  
  // Temel bilgiler formu
  function renderBasicForm() {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>Temel Bilgiler</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            sx={{ flex: '1 1 45%', minWidth: '250px' }}
            fullWidth
            label="Müşteri Kodu"
            name="customerCode"
            value={data.customerCode}
            onChange={handleChange}
            disabled={isEdit} // Düzenleme modunda müşteri kodu değiştirilemez
            required
          />
          
          <TextField
            sx={{ flex: '1 1 45%', minWidth: '250px' }}
            fullWidth
            label="Müşteri Adı"
            name="customerName"
            value={data.customerName}
            onChange={handleChange}
            required
            error={!!errors.customerName}
            helperText={errors.customerName}
          />
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={data.isRealPerson}
              onChange={handleSwitchChange}
              name="isRealPerson"
            />
          }
          label="Bireysel Müşteri"
        />
        
        {data.isRealPerson ? (
          <TextField
            sx={{ flex: '1 1 45%', minWidth: '250px' }}
            fullWidth
            label="TC Kimlik Numarası"
            name="identityNumber"
            value={data.identityNumber || ''}
            onChange={handleChange}
            required
            error={!!errors.identityNumber}
            helperText={errors.identityNumber}
          />
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              sx={{ flex: '1 1 45%', minWidth: '250px' }}
              fullWidth
              label="Vergi Numarası"
              name="taxNumber"
              value={data.taxNumber || ''}
              onChange={handleChange}
              required
              error={!!errors.taxNumber}
              helperText={errors.taxNumber}
            />
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.taxOfficeCode ? (
                // Vergi dairesi seçilmişse, kod ve adı göster
                <>
                  <TextField
                    fullWidth
                    label="Vergi Dairesi Kodu"
                    value={data.taxOfficeCode}
                    disabled
                    sx={{ mb: 1 }}
                    helperText="Seçildi"
                  />
                  <TextField
                    fullWidth
                    label="Vergi Dairesi Adı"
                    value={selectedTaxOfficeName}
                    disabled
                  />
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => {
                      setData({ ...data, taxOfficeCode: '' });
                      setSelectedTaxOfficeName('');
                    }}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    Değiştir
                  </Button>
                </>
              ) : (
                // Vergi dairesi seçilmemişse, seçim listesini göster
                <FormControl 
                  fullWidth 
                  required 
                  error={!!errors.taxOfficeCode}
                >
                  <InputLabel id="tax-office-label">Vergi Dairesi</InputLabel>
                  <Select
                    labelId="tax-office-label"
                    name="taxOfficeCode"
                    value={data.taxOfficeCode || ''}
                    onChange={handleSelectChange}
                    label="Vergi Dairesi"
                  >
                    <MenuItem value=""><em>Seçiniz</em></MenuItem>
                    {isLoadingTaxOffices ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Yükleniyor...
                        </Box>
                      </MenuItem>
                    ) : taxOfficesData && taxOfficesData.length > 0 ? (
                      taxOfficesData.map((office: any) => (
                        <MenuItem 
                          key={office.taxOfficeCode || `tax-office-${Math.random()}`} 
                          value={office.taxOfficeCode || ""}
                        >
                          {office.taxOfficeDescription || office.taxOfficeCode || "İsimsiz Vergi Dairesi"}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Vergi dairesi bulunamadı</MenuItem>
                    )}
                  </Select>
                  {errors.taxOfficeCode && <FormHelperText>{errors.taxOfficeCode}</FormHelperText>}
                </FormControl>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  }
  
  // İletişim bilgileri formu
  function renderCommunicationForm() {
    const phones = data.communications?.filter((c: CustomerCommunication) => c.communicationTypeCode === 'PHONE') || [];
    const emails = data.communications?.filter((c: CustomerCommunication) => c.communicationTypeCode === 'EMAIL') || [];
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>İletişim Bilgileri</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Telefon Numaraları</Typography>
            <Button 
              startIcon={<AddIcon />}
              onClick={() => handleAddCommunication('PHONE')}
              size="small"
              variant="outlined"
            >
              Telefon Ekle
            </Button>
          </Box>
          
          <List>
            {phones.map((phone: CustomerCommunication, index: number) => (
              <ListItem key={index} disableGutters>
                <TextField
                  fullWidth
                  label={`Telefon ${index + 1}`}
                  value={phone.communication}
                  onChange={(e) => handleCommunicationChange(
                    data.communications.findIndex(c => c === phone),
                    e.target.value
                  )}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+90</InputAdornment>,
                  }}
                />
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteCommunication(data.communications.findIndex(c => c === phone))}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">E-posta Adresleri</Typography>
            <Button 
              startIcon={<AddIcon />}
              onClick={() => handleAddCommunication('EMAIL')}
              size="small"
              variant="outlined"
            >
              E-posta Ekle
            </Button>
          </Box>
          
          <List>
            {emails.map((email: CustomerCommunication, index: number) => (
              <ListItem key={index} disableGutters>
                <TextField
                  fullWidth
                  label={`E-posta ${index + 1}`}
                  value={email.communication}
                  onChange={(e) => handleCommunicationChange(
                    data.communications.findIndex(c => c === email),
                    e.target.value
                  )}
                  type="email"
                />
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteCommunication(data.communications.findIndex(c => c === email))}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    );
  }
  
  // Adres formu
  function renderAddressForm() {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>Adres Bilgileri</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Adresler</Typography>
            <Button 
              startIcon={<AddIcon />}
              onClick={handleAddAddress}
              size="small"
              variant="outlined"
            >
              Adres Ekle
            </Button>
          </Box>
          
          {data.addresses && data.addresses.length > 0 ? (
            data.addresses.map((address: CustomerAddress, index: number) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id={`address-type-label-${index}`}>Adres Tipi</InputLabel>
                    <Select
                      labelId={`address-type-label-${index}`}
                      value={address.addressTypeCode}
                      label="Adres Tipi"
                      onChange={(e) => handleAddressChange(index, 'addressTypeCode', e.target.value)}
                    >
                      <MenuItem value="HOME">Ev</MenuItem>
                      <MenuItem value="WORK">İş</MenuItem>
                      <MenuItem value="OTHER">Diğer</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteAddress(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <TextField
                  fullWidth
                  label="Adres"
                  multiline
                  rows={3}
                  value={address.address || ''}
                  onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <TextField
                    sx={{ flex: '1 1 45%', minWidth: '250px' }}
                    fullWidth
                    label="Şehir"
                    value={address.cityCode || ''}
                    onChange={(e) => handleAddressChange(index, 'cityCode', e.target.value)}
                    required
                  />
                  
                  <TextField
                    sx={{ flex: '1 1 45%', minWidth: '250px' }}
                    fullWidth
                    label="İlçe"
                    value={address.districtCode || ''}
                    onChange={(e) => handleAddressChange(index, 'districtCode', e.target.value)}
                    required
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={address.isDefault}
                      onChange={(e) => handleAddressChange(index, 'isDefault', e.target.checked)}
                    />
                  }
                  label="Varsayılan Adres"
                />
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Henüz adres eklenmemiş.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
  
  // Finansal bilgiler formu
  function renderFinancialForm() {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>Finansal Bilgiler</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            sx={{ flex: '1 1 45%', minWidth: '250px' }}
            fullWidth
            label="Kredi Limiti"
            name="creditLimit"
            type="number"
            value={data.creditLimit || 0}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">₺</InputAdornment>,
            }}
          />
          
          <TextField
            sx={{ flex: '1 1 45%', minWidth: '250px' }}
            fullWidth
            label="Ödeme Vadesi (Gün)"
            name="paymentTerm"
            type="number"
            value={data.paymentTerm || 30}
            onChange={handleChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">gün</InputAdornment>,
            }}
          />
        </Box>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="currency-label">Para Birimi</InputLabel>
          {/* Para birimi seçimi için arama yapılabilir Select */}
          <Select
            labelId="currency-label"
            id="currency"
            name="currency"
            value={data.currency || 'USD'}
            label="Para Birimi"
            onChange={handleSelectChange}
            // Arama yapabilmek için
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300
                },
              },
            }}
          >
            {/* Arama kutusu */}
            <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <TextField
                autoFocus
                placeholder="Para birimi ara..."
                fullWidth
                size="small"
                sx={{ mb: 1 }}
                onChange={(e) => {
                  // Bu arama işlevi sadece UI tarafında çalışır
                  const searchInput = e.target.value.toLowerCase();
                  const menuItems = document.querySelectorAll('[role="listbox"] [role="option"]');
                  menuItems.forEach((item: any) => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(searchInput)) {
                      item.style.display = 'flex';
                    } else {
                      item.style.display = 'none';
                    }
                  });
                }}
                // Menü kapanmasını önlemek için
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key !== 'Escape') {
                    e.stopPropagation();
                  }
                }}
              />
            </Box>
            
            {isLoadingCurrencies ? (
              <MenuItem disabled>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Yükleniyor...
                </Box>
              </MenuItem>
            ) : currenciesData && currenciesData.length > 0 ? (
              currenciesData.map((currency: any) => (
                <MenuItem 
                  key={currency.currencyCode || `currency-${Math.random()}`} 
                  value={currency.currencyCode || ""}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span><strong>{currency.currencyCode}</strong> - {currency.currencyDescription}</span>
                  </Box>
                </MenuItem>
              ))
            ) : (
              // API'den veri gelmezse varsayılan değerleri göster
              <>
                <MenuItem value="USD">USD - Amerikan Doları ($)</MenuItem>
                <MenuItem value="TRY">TRY - Türk Lirası (₺)</MenuItem>
                <MenuItem value="EUR">EUR - Euro (€)</MenuItem>
              </>
            )}
          </Select>
        </FormControl>
        
        <FormControlLabel
          control={
            <Switch
              checked={data.isVIP || false}
              onChange={handleSwitchChange}
              name="isVIP"
            />
          }
          label="VIP Müşteri"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={data.isBlocked || false}
              onChange={handleSwitchChange}
              name="isBlocked"
            />
          }
          label="Bloke"
        />
      </Box>
    );
  }
};

export default CustomerForm;
