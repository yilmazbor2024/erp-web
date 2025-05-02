import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Divider,
  Button,
  Paper,
  List,
  ListItem,
  IconButton,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Arayüzler
interface Customer {
  customerCode: string;
  customerName: string;
  isRealPerson: boolean;
  identityNumber?: string;
  taxNumber?: string;
  taxOfficeCode?: string;
  creditLimit: number;
  paymentTerm: number;
  currency: string;
  isVIP: boolean;
  isBlocked: boolean;
  communications: CustomerCommunication[];
  addresses: CustomerAddress[];
  [key: string]: any;
}

interface CustomerCommunication {
  communicationTypeCode: string;
  communication: string;
  isDefault: boolean;
  isBlocked: boolean;
  [key: string]: any;
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

interface FormErrors {
  [key: string]: string;
}

interface RenderProps {
  data: Customer;
  errors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (e: SelectChangeEvent) => void;
  handleSwitchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddCommunication: (type: string) => void;
  handleCommunicationChange: (index: number, value: string) => void;
  handleDeleteCommunication: (index: number) => void;
  handleAddAddress: () => void;
  handleAddressChange: (index: number, field: string, value: any) => void;
  handleDeleteAddress: (index: number) => void;
  isEdit: boolean;
}

// Temel bilgiler formu
const renderBasicForm = ({ data, errors, handleChange, handleSelectChange, handleSwitchChange, isEdit }: RenderProps) => {
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
          disabled={isEdit}
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
              <MenuItem value=""><em>Seçiniz</em></MenuItem>
              <MenuItem value="001">Kadıköy VD</MenuItem>
              <MenuItem value="002">Üsküdar VD</MenuItem>
              <MenuItem value="003">Beşiktaş VD</MenuItem>
              <MenuItem value="004">Şişli VD</MenuItem>
              <MenuItem value="005">Bakırköy VD</MenuItem>
            </Select>
            {errors.taxOfficeCode && <FormHelperText>{errors.taxOfficeCode}</FormHelperText>}
          </FormControl>
        </Box>
      )}
    </Box>
  );
};

// İletişim bilgileri formu
const renderCommunicationForm = ({ data, handleAddCommunication, handleCommunicationChange, handleDeleteCommunication }: RenderProps) => {
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
                  data.communications.findIndex((c: CustomerCommunication) => c === phone),
                  e.target.value
                )}
                InputProps={{
                  startAdornment: <InputAdornment position="start">+90</InputAdornment>,
                }}
              />
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDeleteCommunication(data.communications.findIndex((c: CustomerCommunication) => c === phone))}
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
                  data.communications.findIndex((c: CustomerCommunication) => c === email),
                  e.target.value
                )}
                type="email"
              />
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDeleteCommunication(data.communications.findIndex((c: CustomerCommunication) => c === email))}
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

// Adres formu
const renderAddressForm = ({ data, handleAddAddress, handleAddressChange, handleDeleteAddress }: RenderProps) => {
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
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Henüz adres eklenmemiş.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Finansal bilgiler formu
const renderFinancialForm = ({ data, handleChange, handleSelectChange, handleSwitchChange }: RenderProps) => {
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

interface CustomerFormComponentProps {
  formType: 'basic' | 'communication' | 'address' | 'financial';
  data: Customer;
  onChange: (data: Customer) => void;
  isEdit?: boolean;
}

// CustomerForm bileşeni
const CustomerForm = ({ formType, data, onChange, isEdit = false }: CustomerFormComponentProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({ ...data, [name]: checked });
  };

  const handleAddCommunication = (type: string) => {
    const newComm = {
      communicationTypeCode: type,
      communication: '',
      isDefault: data.communications.filter((c: CustomerCommunication) => c.communicationTypeCode === type).length === 0,
      isBlocked: false
    };
    
    onChange({ ...data, communications: [...data.communications, newComm] });
  };

  const handleCommunicationChange = (index: number, value: string) => {
    const newCommunications = [...data.communications];
    newCommunications[index].communication = value;
    
    onChange({ ...data, communications: newCommunications });
  };

  const handleDeleteCommunication = (index: number) => {
    const newCommunications = [...data.communications];
    newCommunications.splice(index, 1);
    
    onChange({ ...data, communications: newCommunications });
  };

  const handleAddAddress = () => {
    const newAddress = {
      addressTypeCode: 'HOME',
      address: '',
      cityCode: '',
      districtCode: '',
      isDefault: data.addresses.length === 0,
      isBlocked: false
    };
    
    onChange({ ...data, addresses: [...data.addresses, newAddress] });
  };

  const handleAddressChange = (index: number, field: string, value: any) => {
    const newAddresses = [...data.addresses];
    if (!newAddresses[index]) {
      newAddresses[index] = {
        addressTypeCode: '',
        address: '',
        cityCode: '',
        districtCode: '',
        isDefault: false,
        isBlocked: false
      };
    }
    newAddresses[index][field] = value;
    
    onChange({ ...data, addresses: newAddresses });
  };

  const handleDeleteAddress = (index: number) => {
    const newAddresses = [...data.addresses];
    newAddresses.splice(index, 1);
    
    onChange({ ...data, addresses: newAddresses });
  };

  const errors: FormErrors = {};

  const renderProps: RenderProps = {
    data,
    errors,
    handleChange,
    handleSelectChange,
    handleSwitchChange,
    handleAddCommunication,
    handleCommunicationChange,
    handleDeleteCommunication,
    handleAddAddress,
    handleAddressChange,
    handleDeleteAddress,
    isEdit
  };

  switch (formType) {
    case 'basic':
      return renderBasicForm(renderProps);
    case 'communication':
      return renderCommunicationForm(renderProps);
    case 'address':
      return renderAddressForm(renderProps);
    case 'financial':
      return renderFinancialForm(renderProps);
    default:
      return null;
  }
};

export default CustomerForm;
