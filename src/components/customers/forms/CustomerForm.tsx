import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Typography,
  Divider,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormHelperText,
  Checkbox,
  Paper,
  InputAdornment,
  ListItemSecondaryAction,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { useTaxOffices } from '../../../hooks/useTaxOffices';

interface CustomerFormProps {
  formType: 'basic' | 'communication' | 'address' | 'financial';
  data: CustomerFormData;
  onChange: (data: CustomerFormData) => void;
  isEdit?: boolean;
}

interface CustomerFormData {
  customerCode: string;
  customerName: string;
  customerTypeCode?: number;
  taxNumber?: string;
  taxOffice?: string;
  taxOfficeCode?: string;
  addresses: CustomerAddress[];
  communications: CustomerCommunication[];
  contacts?: CustomerContact[];
  creditLimit?: number;
  paymentTerm?: number;
  isRealPerson: boolean;
  identityNumber?: string;
  balance?: number;
  totalRisk?: number;
  isBlocked?: boolean;
  isVIP?: boolean;
  currency?: string;
}

interface CustomerAddress {
  addressTypeCode: string;
  address: string;
  cityCode?: string;
  districtCode?: string;
  isDefault: boolean;
  isBlocked: boolean;
  [key: string]: any;
}

interface CustomerCommunication {
  communicationTypeCode: string;
  communication: string;
  isDefault: boolean;
  isBlocked: boolean;
}

interface CustomerContact {
  contactName: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  isDefault: boolean;
  isBlocked: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ formType, data, onChange, isEdit = false }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: taxOfficesData, isLoading: isLoadingTaxOffices } = useTaxOffices();
  
  // Form değişikliklerini işle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Select değişikliklerini işle
  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Switch değişikliklerini işle
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({ ...data, [name]: checked });
  };
  
  // İletişim bilgisi ekle
  const handleAddCommunication = (type: string) => {
    const newComm: CustomerCommunication = {
      communicationTypeCode: type,
      communication: '',
      isDefault: data.communications.filter((c: CustomerCommunication) => c.communicationTypeCode === type).length === 0,
      isBlocked: false
    };
    
    onChange({
      ...data,
      communications: [...data.communications, newComm]
    });
  };
  
  // İletişim bilgisi sil
  const handleRemoveCommunication = (index: number) => {
    const newCommunications = [...data.communications];
    newCommunications.splice(index, 1);
    
    onChange({
      ...data,
      communications: newCommunications
    });
  };
  
  // İletişim bilgisi güncelle
  const handleCommunicationChange = (index: number, value: string) => {
    const newCommunications = [...data.communications];
    newCommunications[index].communication = value;
    
    onChange({
      ...data,
      communications: newCommunications
    });
  };
  
  // Adres ekle
  const handleAddAddress = () => {
    const newAddress: CustomerAddress = {
      addressTypeCode: 'WORK',
      address: '',
      isDefault: data.addresses.length === 0,
      isBlocked: false,
    };
    
    onChange({
      ...data,
      addresses: [...data.addresses, newAddress]
    });
  };
  
  // Adres sil
  const handleRemoveAddress = (index: number) => {
    const newAddresses = [...data.addresses];
    newAddresses.splice(index, 1);
    
    onChange({
      ...data,
      addresses: newAddresses
    });
  };
  
  // Adres güncelle
  const handleAddressChange = (index: number, field: string, value: any) => {
    const newAddresses = [...data.addresses];
    newAddresses[index][field] = value;
    
    onChange({
      ...data,
      addresses: newAddresses
    });
  };
  
  // Validasyon
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (formType === 'basic') {
      if (!data.customerName) {
        newErrors.customerName = 'Müşteri adı zorunludur';
      }
      
      if (!data.isRealPerson) {
        if (!data.taxNumber) {
          newErrors.taxNumber = 'Vergi numarası zorunludur';
        }
        if (!data.taxOfficeCode) {
          newErrors.taxOfficeCode = 'Vergi dairesi zorunludur';
        }
      } else {
        if (!data.identityNumber) {
          newErrors.identityNumber = 'TC Kimlik numarası zorunludur';
        } else if (data.identityNumber.length !== 11) {
          newErrors.identityNumber = 'TC Kimlik numarası 11 haneli olmalıdır';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validasyon çalıştır
  useEffect(() => {
    if (formType === 'basic') {
      validate();
    }
  }, [data.customerName, data.taxNumber, data.taxOfficeCode, data.identityNumber, data.isRealPerson]);
  
  // Temel bilgiler formu
  const renderBasicForm = () => {
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
            
            <FormControl 
              sx={{ flex: '1 1 45%', minWidth: '250px' }}
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
                {isLoadingTaxOffices ? (
                  <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                ) : (
                  taxOfficesData?.map((office: any) => (
                    <MenuItem key={office.taxOfficeCode} value={office.taxOfficeCode}>
                      {office.taxOfficeDescription}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.taxOfficeCode && <FormHelperText>{errors.taxOfficeCode}</FormHelperText>}
            </FormControl>
          </Box>
        )}
      </Box>
    );
  };
  
  // İletişim bilgileri formu
  const renderCommunicationForm = () => {
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
                    data.communications.indexOf(phone),
                    e.target.value
                  )}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveCommunication(data.communications.indexOf(phone))}
                  sx={{ ml: 1 }}
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
                    data.communications.indexOf(email),
                    e.target.value
                  )}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveCommunication(data.communications.indexOf(email))}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    );
  };
  
  // Adres bilgileri formu
  const renderAddressForm = () => {
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
            >
              Adres Ekle
            </Button>
          </Box>
          
          {data.addresses?.map((address: CustomerAddress, index: number) => (
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
                    <MenuItem value="WORK">İş</MenuItem>
                    <MenuItem value="HOME">Ev</MenuItem>
                    <MenuItem value="SHIPPING">Sevkiyat</MenuItem>
                  </Select>
                </FormControl>
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveAddress(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Adres"
                value={address.address}
                onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: '250px' }}
                  fullWidth
                  label="Şehir"
                  value={address.cityCode || ''}
                  onChange={(e) => handleAddressChange(index, 'cityCode', e.target.value)}
                />
                
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: '250px' }}
                  fullWidth
                  label="İlçe"
                  value={address.districtCode || ''}
                  onChange={(e) => handleAddressChange(index, 'districtCode', e.target.value)}
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
          ))}
          
          {(!data.addresses || data.addresses.length === 0) && (
            <Typography variant="body2" color="text.secondary">
              Henüz adres eklenmemiş.
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Finansal bilgiler formu
  const renderFinancialForm = () => {
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
            value={data.paymentTerm || 0}
            onChange={handleChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">gün</InputAdornment>,
            }}
          />
        </Box>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="currency-label">Para Birimi</InputLabel>
          <Select
            labelId="currency-label"
            id="currency"
            name="currency"
            value={data.currency || 'TRY'}
            label="Para Birimi"
            onChange={handleSelectChange}
          >
            <MenuItem value="TRY">Türk Lirası (₺)</MenuItem>
            <MenuItem value="USD">Amerikan Doları ($)</MenuItem>
            <MenuItem value="EUR">Euro (€)</MenuItem>
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
  };
  
  // Form tipine göre ilgili formu göster
  switch (formType) {
    case 'basic':
      return renderBasicForm();
    case 'communication':
      return renderCommunicationForm();
    case 'address':
      return renderAddressForm();
    case 'financial':
      return renderFinancialForm();
    default:
      return null;
  }
};

export default CustomerForm;
