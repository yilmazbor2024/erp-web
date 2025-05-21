import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../services/api';
import vendorApi from '../../services/vendorApi';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useTaxOffices } from '../../hooks/useTaxOffices';
import { useCurrencies } from '../../hooks/useCurrencies';

// Tedarikçi oluşturma formu
const VendorCreate = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [formData, setFormData] = useState({
    formType: 'quick',
    customerType: '1', // Tedarikçi tipi kodu
    isIndividual: false,
    country: 'TR',
    region: '',
    city: '',
    district: '',
    taxOffice: '',
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
    exchangeTypeCode: 'TRY', // Para birimi varsayılan değeri
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
        console.log('Referans verileri yükleniyor...');
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
        
        // Bölge listesini yükle
        console.log('Bölge listesi yükleniyor...');
        const regionsData = await customerApi.getRegions();
        if (Array.isArray(regionsData) && regionsData.length > 0) {
          console.log('Bölge verileri:', regionsData);
          const stateList = regionsData.map((state: any) => ({
            code: state.stateCode || state.code,
            name: state.stateDescription || state.name
          }));
          setRegions(stateList);
        } else {
          console.log('Bölge listesi boş veya hatalı format');
          // Alternatif olarak location hierarchy'den bölge listesini almayı dene
          const hierarchyData = await customerApi.getLocationHierarchy('TR', 'TR');
          if (hierarchyData && hierarchyData.states) {
            console.log('Location hierarchy kullanılarak bölge listesi alındı');
            setLocationHierarchy(hierarchyData);
            const stateList = hierarchyData.states.map((state: any) => ({
              code: state.stateCode,
              name: state.stateDescription
            }));
            setRegions(stateList);
          }
        }
      } catch (error) {
        console.error('Referans verileri yüklenirken hata oluştu:', error);
      }
    };
    
    loadReferenceData();
  }, []);

  // Ülke değiştiğinde şehir ve ilçe verilerini yükle
  useEffect(() => {
    const loadCountryData = async () => {
      if (formData.country) {
        try {
          // Ülkeye göre bölgeleri yükle
          const regionsData = await customerApi.getRegions('TR');
          if (Array.isArray(regionsData) && regionsData.length > 0) {
            setRegions(regionsData.map((region: any) => ({
              code: region.regionCode,
              name: region.regionDescription
            })));
          }
        } catch (error) {
          console.error('Ülke verileri yüklenirken hata oluştu:', error);
        }
      }
    };
    
    loadCountryData();
  }, [formData.country]);

  // Bölge değiştiğinde şehirleri yükle
  useEffect(() => {
    const loadCities = async () => {
      if (formData.region) {
        try {
          const citiesData = await customerApi.getCitiesByRegion(formData.region);
          if (Array.isArray(citiesData) && citiesData.length > 0) {
            setCities(citiesData.map((city: any) => ({
              code: city.cityCode,
              name: city.cityDescription
            })));
          }
        } catch (error) {
          console.error('Şehir verileri yüklenirken hata oluştu:', error);
        }
      }
    };
    
    loadCities();
  }, [formData.region]);

  // Şehir değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadDistricts = async () => {
      if (formData.city) {
        try {
          const districtsData = await customerApi.getDistrictsByCity(formData.city);
          if (Array.isArray(districtsData) && districtsData.length > 0) {
            setDistricts(districtsData.map((district: any) => ({
              code: district.districtCode,
              name: district.districtDescription
            })));
          }
        } catch (error) {
          console.error('İlçe verileri yüklenirken hata oluştu:', error);
        }
      }
    };
    
    loadDistricts();
  }, [formData.city]);

  // Input değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'customerName' || name === 'firstName' || name === 'lastName') {
      // Müşteri adı veya isim/soyisim alanları değiştiğinde
      if (name === 'firstName' || name === 'lastName') {
        // İsim veya soyisim değiştiğinde, müşteri adını güncelle
        const newFirstName = name === 'firstName' ? value : formData.firstName;
        const newLastName = name === 'lastName' ? value : formData.lastName;
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customerName: `${newFirstName} ${newLastName}`.trim()
        }));
      } else {
        // Doğrudan müşteri adı değiştiğinde
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      // Diğer alanlar için normal güncelleme
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name === 'isIndividual') {
      // Bireysel/Kurumsal seçimi değiştiğinde
      setFormData(prev => ({
        ...prev,
        isIndividual: checked,
        // Bireysel seçildiğinde, isim ve soyisim alanlarını temizle
        firstName: checked ? prev.firstName : '',
        lastName: checked ? prev.lastName : '',
        // Kurumsal seçildiğinde, müşteri adını temizle
        customerName: checked ? '' : prev.customerName
      }));
    } else if (name === 'isSubjectToEInvoice') {
      // E-Fatura mükellefi seçimi değiştiğinde
      setFormData(prev => ({
        ...prev,
        isSubjectToEInvoice: checked,
        eInvoiceStartDate: checked ? new Date() : null
      }));
    } else if (name === 'isSubjectToEShipment') {
      // E-İrsaliye mükellefi seçimi değiştiğinde
      setFormData(prev => ({
        ...prev,
        isSubjectToEShipment: checked,
        eShipmentStartDate: checked ? new Date() : null
      }));
    } else {
      // Diğer checkbox'lar için normal güncelleme
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value ? new Date(value) : null
    }));
  };

  // Form sıfırlama fonksiyonu
  const resetForm = () => {
    setFormData({
      formType: 'quick',
      customerType: '1', // Tedarikçi tipi kodu
      isIndividual: false,
      country: 'TR',
      region: '',
      city: '',
      district: '',
      taxOffice: '',
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
      eInvoiceStartDate: null,
      isSubjectToEShipment: false,
      eShipmentStartDate: null,
      exchangeTypeCode: 'TRY',
    });
  };

  // Snackbar kapatma fonksiyonu
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Tedarikçi oluşturma işlemi
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Gönderilecek tedarikçi verisi:', formData);
      
      // API'ye gönderilecek veriyi hazırla
      const vendorData = {
        customerCode: '', // Boş gönder, backend otomatik oluşturacak
        customerName: formData.customerName,
        customerSurname: '', // Tedarikçiler için soyisim kullanılmıyor
        customerTypeCode: 1, // Tedarikçi tipi kodu
        companyCode: 1, // Varsayılan şirket kodu
        officeCode: 'M', // Varsayılan ofis kodu
        currencyCode: formData.exchangeTypeCode,
        isIndividualAcc: formData.isIndividual,
        createdUserName: 'system',
        lastUpdatedUserName: 'system',
        taxNumber: formData.taxNumber,
        identityNum: formData.identityNum,
        taxOfficeCode: formData.taxOffice,
        isSubjectToEInvoice: formData.isSubjectToEInvoice,
        isSubjectToEDispatch: formData.isSubjectToEShipment,
        cityCode: formData.city,
        districtCode: formData.district
      };
      
      console.log('Tedarikçi oluşturma için gönderilecek veriler:', vendorData);
      
      // API çağrısı yap
      // Tedarikçi oluşturmak için vendorApi servisini kullanalım
      const response = await vendorApi.createVendor(vendorData);
      
      console.log('API yanıtı:', response);
      
      if (response && response.success) {
        // Başarılı yanıt
        setSnackbar({
          open: true,
          message: 'Tedarikçi başarıyla oluşturuldu!',
          severity: 'success'
        });
        
        // Formu sıfırla
        resetForm();
        
        // 2 saniye sonra tedarikçi listesine yönlendir
        setTimeout(() => {
          navigate('/vendors');
        }, 2000);
      } else {
        // Hata yanıtı
        setSnackbar({
          open: true,
          message: `Tedarikçi oluşturulurken hata oluştu: ${response?.message || 'Bilinmeyen hata'}`,
          severity: 'error'
        });
      }
    } catch (error: any) {
      console.error('Tedarikçi oluşturulurken hata oluştu:', error);
      
      // Hata detaylarını kontrol et
      let errorMessage = 'Tedarikçi oluşturulurken bir hata oluştu.';
      
      if (error.response) {
        console.log('API error response details:', error.response);
        
        if (error.response.data) {
          console.log('API error response data:', error.response.data);
          
          // API'den dönen hata mesajını kullan
          errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        }
      }
      
      setSnackbar({
        open: true,
        message: `Hata: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Yeni Tedarikçi Oluştur
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Tedarikçi Tipi Seçimi */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tedarikçi Tipi
            </Typography>
            <RadioGroup
              row
              name="isIndividual"
              value={formData.isIndividual ? 'true' : 'false'}
              onChange={(e) => handleCheckboxChange({
                target: {
                  name: 'isIndividual',
                  checked: e.target.value === 'true'
                }
              } as React.ChangeEvent<HTMLInputElement>)}
            >
              <FormControlLabel value="false" control={<Radio />} label="Kurumsal" />
              <FormControlLabel value="true" control={<Radio />} label="Bireysel" />
            </RadioGroup>
          </FormControl>

          {/* Tedarikçi Bilgileri */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {formData.isIndividual ? (
              // Bireysel tedarikçi için isim ve soyisim alanları
              <>
                <TextField
                  fullWidth
                  required
                  label="İsim"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  sx={{ flex: '1 1 45%', minWidth: '200px' }}
                />
                <TextField
                  fullWidth
                  required
                  label="Soyisim"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  sx={{ flex: '1 1 45%', minWidth: '200px' }}
                />
              </>
            ) : (
              // Kurumsal tedarikçi için firma adı alanı
              <TextField
                fullWidth
                required
                label="Firma Adı"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                sx={{ flex: '1 1 100%' }}
              />
            )}
          </Box>

          {/* Vergi Bilgileri */}
          <Typography variant="subtitle1" gutterBottom>
            Vergi Bilgileri
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
              <InputLabel>Vergi Dairesi</InputLabel>
              <Select
                name="taxOffice"
                value={(isLoadingTaxOfficesHook || !taxOfficesDataFromHook || taxOfficesDataFromHook.length === 0) ? '' : formData.taxOffice}
                label="Vergi Dairesi"
                onChange={handleSelectChange}
                disabled={isLoadingTaxOfficesHook}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    },
                  },
                }}
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
            <TextField
              fullWidth
              label="Vergi Numarası"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
            {formData.isIndividual && (
              <TextField
                fullWidth
                label="T.C. Kimlik Numarası"
                name="identityNum"
                value={formData.identityNum}
                onChange={handleInputChange}
                sx={{ flex: '1 1 45%', minWidth: '200px' }}
              />
            )}
          </Box>

          {/* E-Fatura ve E-İrsaliye Bilgileri */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isSubjectToEInvoice}
                  onChange={handleCheckboxChange}
                  name="isSubjectToEInvoice"
                />
              }
              label="E-Fatura Mükellefi"
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isSubjectToEShipment}
                  onChange={handleCheckboxChange}
                  name="isSubjectToEShipment"
                />
              }
              label="E-İrsaliye Mükellefi"
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Adres Bilgileri</Typography>

          {/* Adres Bilgileri */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {/* Ülke, Şehir, İlçe seçimleri */}
            {!isMobile && (
              <>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>Ülke</InputLabel>
                  <Select
                    name="country"
                    value={formData.country}
                    label="Ülke"
                    onChange={handleSelectChange}
                  >
                    {countries.map(c => (
                      <MenuItem key={c.countryCode} value={c.countryCode}>{c.countryDescription}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>Bölge</InputLabel>
                  <Select
                    name="region"
                    value={formData.region}
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
                    value={formData.city}
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
                    value={formData.district}
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

          {/* Para Birimi Seçimi */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
              <InputLabel>Para Birimi</InputLabel>
              <Select
                name="exchangeTypeCode"
                value={(isLoadingCurrenciesHook || !currenciesDataFromHook || currenciesDataFromHook.length === 0) ? '' : formData.exchangeTypeCode}
                label="Para Birimi"
                onChange={handleSelectChange}
                disabled={isLoadingCurrenciesHook}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    },
                  },
                }}
              >
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
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="button"
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={() => navigate('/vendors')}
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

export default VendorCreate;
