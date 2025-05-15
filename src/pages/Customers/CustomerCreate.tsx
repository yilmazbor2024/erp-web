import React, { useState, useEffect, ReactNode } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  RadioGroup,
  FormControlLabel,
  Radio,
  SelectChangeEvent,
  Checkbox,
  Switch,
  Divider
} from '@mui/material';
// useState ve useEffect zaten yukarıda import edildi
import { useNavigate } from 'react-router-dom'; // useLocation kaldırıldı
import { customerApi } from '../../services/api'; // createCustomerBasic direk import edilmeyecek
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { useTaxOffices } from '../../hooks/useTaxOffices';
import { useCurrencies } from '../../hooks/useCurrencies';

// Müşteri oluşturma formu
const CustomerCreate = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [formData, setFormData] = useState({
    formType: 'quick',
    customerType: '3',
    isIndividual: false,
    country: 'TR',
    region: '',
    city: '',
    district: '',
    taxOffice: '', // Tutarlılık için taxOffice kullanıyoruz
    taxNumber: '',
    identityNum: '',
    firstName: '',
    lastName: '',
    customerName: '',
    customerCode: '',
    address: '',
    phone: '',
    email: '',
    contactName: '',
    isSubjectToEInvoice: false,
    eInvoiceStartDate: null as Date | null,
    isSubjectToEShipment: false,
    eShipmentStartDate: null as Date | null,
    exchangeTypeCode: '' // Başlangıçta boş, veri yüklenince set edilecek
  });

  // Referans veri state'leri
  const [countries, setCountries] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [locationHierarchy, setLocationHierarchy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: taxOfficesDataFromHook, isLoading: isLoadingTaxOfficesHook } = useTaxOffices();
  const { data: currenciesDataFromHook, isLoading: isLoadingCurrenciesHook } = useCurrencies();

  // Oturum kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token && !isAuthenticated) {
        console.log('Oturum açılmamış, login sayfasına yönlendiriliyor...');
        try {
          // await login('admin@example.com', 'Admin123!'); // Otomatik login denemesi - Gerekirse açılabilir
        } catch (error) {
          console.error('Otomatik login hatası:', error);
          navigate('/login', { replace: true });
        }
      }
    };
    checkAuth();
  }, [isAuthenticated, login, navigate]);

  // Referans verileri yükle
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const countriesData = await customerApi.getCountries();
        if (Array.isArray(countriesData) && countriesData.length > 0) {
          setCountries(countriesData);
        } else {
          setCountries([{ countryCode: 'TR', countryDescription: 'Türkiye' }]);
        }

        const typesData = await customerApi.getCustomerTypes();
        if (Array.isArray(typesData) && typesData.length > 0) {
          setTypes(typesData);
        }
        
        const hierarchyData = await customerApi.getLocationHierarchy('TR', 'TR');
        if (hierarchyData && hierarchyData.states) {
          setLocationHierarchy(hierarchyData);
          const stateList = hierarchyData.states.map((state: any) => ({
            code: state.stateCode,
            name: state.stateDescription
          }));
          setRegions(stateList);
        }
      } catch (error) {
        console.error('Referans verileri yüklenirken hata:', error);
      }
    };
    loadReferenceData();
  }, []);

  // Para birimleri yüklendiğinde ve USD varsa onu varsayılan yap, yoksa ilk para birimini al
  useEffect(() => {
    if (currenciesDataFromHook && currenciesDataFromHook.length > 0) {
      const usdCurrencyExists = currenciesDataFromHook.some(c => c.currencyCode === 'USD');
      if (usdCurrencyExists) {
        setFormData(prev => ({ ...prev, exchangeTypeCode: 'USD' }));
      } else {
        setFormData(prev => ({ ...prev, exchangeTypeCode: currenciesDataFromHook[0].currencyCode }));
      }
      console.log('Para birimi varsayılan değeri USD olarak ayarlandı');
    }
  }, [currenciesDataFromHook]);

  // Ülke değiştiğinde bölge ve şehir verilerini yükle
  useEffect(() => {
    const loadCountryData = async () => {
      if (formData.country === 'TR') {
        if (locationHierarchy && locationHierarchy.states && locationHierarchy.states.length > 0) return;
        try {
          const data = await customerApi.getLocationHierarchy('TR', 'TR');
          if (data && data.states) {
            setLocationHierarchy(data);
            const stateList = data.states.map((state: any) => ({
              code: state.stateCode,
              name: state.stateDescription
            }));
            setRegions(stateList);
          }
        } catch (error) {
          console.error('Lokasyon hiyerarşisi yüklenirken hata:', error);
        }
      } else {
        setRegions([]);
        setCities([]);
        setDistricts([]);
      }
    };
    loadCountryData();
  }, [formData.country, locationHierarchy]);

  // Bölge değiştiğinde şehirleri yükle
  useEffect(() => {
    if (formData.region && locationHierarchy) {
      const selectedState = locationHierarchy.states.find(
        (state: any) => state.stateCode === formData.region
      );
      if (selectedState && selectedState.cities) {
        const cityList = selectedState.cities.map((city: any) => ({
          code: city.cityCode,
          name: city.cityDescription
        }));
        setCities(cityList);
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
      setDistricts([]);
    }
  }, [formData.region, locationHierarchy]);

  // Şehir değiştiğinde ilçeleri yükle
  useEffect(() => {
    if (formData.city && locationHierarchy && formData.region) {
      const selectedRegion = locationHierarchy.states.find((state: any) =>
        state.stateCode === formData.region
      );
      if (selectedRegion && selectedRegion.cities) {
        const selectedCity = selectedRegion.cities.find((city: any) =>
          city.cityCode === formData.city
        );
        if (selectedCity && selectedCity.districts) {
          const districtList = selectedCity.districts.map((district: any) => ({
            code: district.districtCode,
            name: district.districtDescription
          }));
          setDistricts(districtList);
        } else {
          setDistricts([]);
        }
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [formData.city, formData.region, locationHierarchy]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const customerCode = formData.customerCode || `121.${Date.now().toString().slice(-8)}`;
      const customerData: any = {
        customerCode: customerCode,
        customerName: formData.customerName,
        customerTypeCode: parseInt(formData.customerType, 10), // string to number
        countryCode: formData.country,
        cityCode: formData.city,
        districtCode: formData.district,
        address: formData.address,
        contactName: formData.contactName,
        officeCode: "1", // Varsayılan ofis kodu
        exchangeTypeCode: formData.exchangeTypeCode,
        isIndividualAcc: formData.isIndividual
      };

      if (formData.isIndividual) {
        customerData.identityNum = formData.identityNum;
        customerData.firstName = formData.firstName;
        customerData.lastName = formData.lastName;
      } else {
        customerData.taxOfficeCode = formData.taxOffice; // taxOffice kullanıyoruz
        customerData.taxNumber = formData.taxNumber;
      }

      if (formData.country === 'TR') {
        customerData.isSubjectToEInvoice = formData.isSubjectToEInvoice;
        customerData.eInvoiceStartDate = formData.eInvoiceStartDate;
        customerData.isSubjectToEShipment = formData.isSubjectToEShipment;
        customerData.eShipmentStartDate = formData.eShipmentStartDate;
      }
      
      customerData.communications = [];
      if (formData.phone) customerData.communications.push({ communicationTypeCode: "PHONE", communication: formData.phone, isDefault: true });
      if (formData.email) customerData.communications.push({ communicationTypeCode: "EMAIL", communication: formData.email, isDefault: true });

      customerData.addresses = [];
      if (formData.address) customerData.addresses.push({ 
        addressTypeCode: "WORK",
        address: formData.address, 
        cityCode: formData.city, 
        districtCode: formData.district, 
        countryCode: formData.country,
        isDefault: true
      });


      console.log('Gönderilecek müşteri verisi:', customerData);
      const response = await customerApi.createCustomerBasic(customerData); // customerApi üzerinden çağır
      setSnackbar({ open: true, message: 'Müşteri başarıyla oluşturuldu', severity: 'success' });
      
      // Formu temizle
      setFormData({
        formType: 'quick',
        customerType: '3',
        isIndividual: false,
        region: '', 
        city: '', 
        district: '',
        taxOffice: '', // taxOffice kullanılıyor, taxOfficeCode değil
        taxNumber: '', 
        identityNum: '',
        firstName: '',
        lastName: '',
        customerName: '', 
        customerCode: '', 
        country: 'TR', 
        address: '', 
        phone: '', 
        email: '',
        contactName: '',
        isSubjectToEInvoice: false,
        eInvoiceStartDate: null,
        isSubjectToEShipment: false,
        eShipmentStartDate: null,
        exchangeTypeCode: 'TRY'
      });
      
      navigate('/customers');
    } catch (error: any) {
      console.error('Müşteri oluşturma hatası:', error);
      setSnackbar({
        open: true,
        message: `Müşteri oluşturulurken hata oluştu: ${error.response?.data?.message || error.message || 'Bilinmeyen hata'}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Müşteri Oluştur</Typography>
        <Box component="form" noValidate sx={{ mt: 2 }} onSubmit={handleSubmit}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              row
              name="formType"
              value={formData.formType}
              onChange={(e) => setFormData(prev => ({...prev, formType: e.target.value}))}
            >
              <FormControlLabel value="quick" control={<Radio />} label="Hızlı" />
              <FormControlLabel value="detailed" control={<Radio />} label="Detaylı" />
            </RadioGroup>
          </FormControl>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              required
              label="Müşteri Adı"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              sx={{ flex: '1 1 100%' }}
            />
            <TextField
              fullWidth
              label="Müşteri Kodu (Opsiyonel)"
              name="customerCode"
              value={formData.customerCode}
              onChange={handleInputChange}
              helperText="Boş bırakılırsa otomatik oluşturulur (121.XXXXXXXX)"
              sx={{ flex: '1 1 100%' }}
            />
          </Box>

          {formData.formType === 'detailed' && (
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isIndividual}
                    onChange={handleCheckboxChange}
                    name="isIndividual"
                  />
                }
                label="Gerçek Kişi/Şahıs"
              />
            </Box>
          )}

          {formData.formType === 'detailed' && formData.isIndividual && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                required
                label="T.C. Kimlik No"
                name="identityNum"
                value={formData.identityNum}
                onChange={handleInputChange}
                sx={{ flex: '1 1 100%', minWidth: '200px' }}
              />
              <TextField
                fullWidth
                required
                label="Adı"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                sx={{ flex: '1 1 45%', minWidth: '200px' }}
              />
              <TextField
                fullWidth
                required
                label="Soyadı"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                sx={{ flex: '1 1 45%', minWidth: '200px' }}
              />
            </Box>
          )}

          {formData.formType === 'detailed' && !formData.isIndividual && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              {formData.taxOffice ? (
                // Vergi dairesi seçilmişse, kod ve adı göster
                <Box sx={{ flex: '1 1 45%', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Vergi Dairesi Kodu"
                    value={formData.taxOffice}
                    disabled
                    helperText="Seçildi"
                  />
                  <TextField
                    fullWidth
                    label="Vergi Dairesi Adı"
                    value={taxOfficesDataFromHook?.find(office => office.taxOfficeCode === formData.taxOffice)?.taxOfficeDescription || ''}
                    disabled
                  />
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => setFormData({...formData, taxOffice: ''})}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Değiştir
                  </Button>
                </Box>
              ) : (
                // Vergi dairesi seçilmemişse, seçim listesini göster
                <FormControl fullWidth required sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>Vergi Dairesi</InputLabel>
                  <Select
                    name="taxOffice"
                    value={formData.taxOffice || ''}
                    label="Vergi Dairesi"
                    onChange={handleSelectChange}
                    disabled={isLoadingTaxOfficesHook}
                  >
                    {isLoadingTaxOfficesHook ? (
                      <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                    ) : taxOfficesDataFromHook && taxOfficesDataFromHook.length > 0 ? (
                      taxOfficesDataFromHook.map((office: any) => (
                        <MenuItem key={office.taxOfficeCode} value={office.taxOfficeCode}>
                          {office.taxOfficeDescription}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>Vergi dairesi bulunamadı</MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}
              <TextField
                fullWidth
                required
                label="Vergi No"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleInputChange}
                sx={{ flex: '1 1 45%', minWidth: '200px' }}
              />
            </Box>
          )}

          {formData.formType === 'detailed' && formData.country === 'TR' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isSubjectToEInvoice}
                      onChange={handleCheckboxChange}
                      name="isSubjectToEInvoice"
                    />
                  }
                  label="E-fatura Tabi"
                />
                {formData.isSubjectToEInvoice && (
                  <TextField
                    type="date"
                    label="E-fatura Başlangıç Tarihi"
                    value={formData.eInvoiceStartDate ? formData.eInvoiceStartDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateChange('eInvoiceStartDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isSubjectToEShipment}
                      onChange={handleCheckboxChange}
                      name="isSubjectToEShipment"
                    />
                  }
                  label="E-İrsaliye Tabi"
                />
                {formData.isSubjectToEShipment && (
                  <TextField
                    type="date"
                    label="E-İrsaliye Başlangıç Tarihi"
                    value={formData.eShipmentStartDate ? formData.eShipmentStartDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateChange('eShipmentStartDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Adres Bilgileri</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl fullWidth required sx={{ flex: '1 1 45%', minWidth: '200px' }}>
              <InputLabel>Ülke</InputLabel>
              <Select
                name="country"
                value={formData.country || ''}
                label="Ülke"
                onChange={handleSelectChange}
              >
                {countries.length > 0 ? (
                  countries.map(c => (
                    <MenuItem key={c.countryCode} value={c.countryCode}>
                      {c.countryDescription}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="TR">Türkiye</MenuItem>
                )}
              </Select>
            </FormControl>

            {formData.country === 'TR' && (
              <>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>Bölge</InputLabel>
                  <Select
                    name="region"
                    value={formData.region || ''}
                    label="Bölge"
                    onChange={handleSelectChange}
                  >
                    {regions.map(r => (
                      <MenuItem key={r.code} value={r.code}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>Şehir</InputLabel>
                  <Select
                    name="city"
                    value={formData.city || ''}
                    label="Şehir"
                    onChange={handleSelectChange}
                  >
                    {cities.map(c => (
                      <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>İlçe</InputLabel>
                  <Select
                    name="district"
                    value={formData.district || ''}
                    label="İlçe"
                    onChange={handleSelectChange}
                  >
                    {districts.map(d => (
                      <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            <TextField
              fullWidth
              label="Adres"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              multiline
              rows={3}
              sx={{ flex: '1 1 100%' }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>İletişim Bilgileri</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              required
              label="Telefon"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
            <TextField
              fullWidth
              required
              label="E-posta"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
            <TextField
              fullWidth
              required
              label="Yetkili Kişi"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
            <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
              <InputLabel>Para Birimi</InputLabel>
              <Select
                name="exchangeTypeCode"
                value={(isLoadingCurrenciesHook || !currenciesDataFromHook || currenciesDataFromHook.length === 0) ? '' : formData.exchangeTypeCode}
                label="Para Birimi"
                onChange={handleSelectChange}
                disabled={isLoadingCurrenciesHook}
                // Arama yapılabilmesi için
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
                
                {isLoadingCurrenciesHook ? (
                  <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                ) : currenciesDataFromHook && currenciesDataFromHook.length > 0 ? (
                  currenciesDataFromHook.map((currency: any) => (
                    <MenuItem key={currency.currencyCode} value={currency.currencyCode}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span><strong>{currency.currencyCode}</strong> - {currency.currencyDescription}</span>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>Para birimi bulunamadı</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="button"
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={() => navigate('/customers')}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Kaydet'}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerCreate;
