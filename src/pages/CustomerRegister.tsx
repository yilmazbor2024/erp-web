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
  Divider
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useTaxOffices } from '../hooks/useTaxOffices';
import { useCurrencies } from '../hooks/useCurrencies';
import { customerApi } from '../services/api';

// Token bazlı müşteri kayıt formu (CustomerCreate'in birebir kopyası)
const CustomerRegister = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  interface FormData {
    formType: 'quick' | 'detailed';
    customerType: string;
    isIndividual: boolean;
    country: string;
    region: string;
    city: string;
    district: string;
    address: string;
    contactName: string;
    phone: string;
    email: string;
    customerName: string;
    customerCode: string;
    identityNum: string;
    taxNumber: string;
    taxOffice: string;
    currency: string;
    customerSurname: string;
    isSubjectToEInvoice: boolean;
    eInvoiceStartDate: Date | null;
    isSubjectToEDispatch: boolean;
    isSubjectToEShipment: boolean;
    eShipmentStartDate: Date | null;
    firstName: string;
    lastName: string;
  }

  // Form state - CustomerCreate ile birebir aynı
  const [formData, setFormData] = useState<FormData>({
    formType: 'quick',
    customerType: '3',
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
    currency: 'TRY',
    customerSurname: '',
    isSubjectToEInvoice: false,
    eInvoiceStartDate: null,
    isSubjectToEDispatch: false,
    isSubjectToEShipment: false,
    eShipmentStartDate: null,
  });

  // Referans veri state'leri - CustomerCreate ile birebir aynı
  const [countries, setCountries] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [locationHierarchy, setLocationHierarchy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // Token ile hooks - CustomerRegister için özel
  const { data: taxOfficesDataFromHook, isLoading: isLoadingTaxOfficesHook } = useTaxOffices(token, !!token);
  const { data: currenciesDataFromHook, isLoading: isLoadingCurrenciesHook } = useCurrencies(token, 'TR', !!token);

  // Token kontrolü
  useEffect(() => {
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Geçersiz erişim. Token bulunamadı.',
        severity: 'error'
      });
      setTimeout(() => navigate('/'), 3000);
    }
  }, [token, navigate]);

  // Referans verileri yükle - Token bazlı
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!token) return;
      
      try {
        const countriesData = await customerApi.getCountriesWithToken(token);
        if (Array.isArray(countriesData) && countriesData.length > 0) {
          setCountries(countriesData);
        } else {
          setCountries([{ countryCode: 'TR', countryDescription: 'Türkiye' }]);
        }

        const typesData = await customerApi.getCustomerTypesWithToken(token);
        if (Array.isArray(typesData) && typesData.length > 0) {
          setTypes(typesData);
        }
        
        const hierarchyData = await customerApi.getLocationHierarchyWithToken(token, 'TR', 'TR');
        if (hierarchyData && hierarchyData.states) {
          setLocationHierarchy(hierarchyData);
          const stateList = hierarchyData.states.map((state: any) => ({
            code: state.stateCode,
            name: state.stateDescription
          }));
          setRegions(stateList);
        }
      } catch (error) {
        console.error('Referans veriler yüklenirken hata:', error);
        setSnackbar({
          open: true,
          message: 'Veri yükleme hatası. Lütfen sayfayı yenileyin.',
          severity: 'error'
        });
      }
    };

    loadReferenceData();
  }, [token]);

  // Şehir ve ilçe yükleme - Token bazlı
  useEffect(() => {
    const loadCitiesAndDistricts = async () => {
      if (!token || !formData.region || !locationHierarchy) return;

      try {
        const selectedState = locationHierarchy.states.find((state: any) => state.stateCode === formData.region);
        if (selectedState && selectedState.cities) {
          const cityList = selectedState.cities.map((city: any) => ({
            code: city.cityCode,
            name: city.cityDescription
          }));
          setCities(cityList);
        }

        if (formData.city && selectedState) {
          const selectedCity = selectedState.cities.find((city: any) => city.cityCode === formData.city);
          if (selectedCity && selectedCity.districts) {
            const districtList = selectedCity.districts.map((district: any) => ({
              code: district.districtCode,
              name: district.districtDescription
            }));
            setDistricts(districtList);
          }
        }
      } catch (error) {
        console.error('Şehir/ilçe yüklenirken hata:', error);
      }
    };

    loadCitiesAndDistricts();
  }, [formData.region, formData.city, locationHierarchy, token]);

  // Event handlers - CustomerCreate ile birebir aynı
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === 'true',
      // Bireysel/kurumsal değiştiğinde ilgili alanları temizle
      ...(name === 'isIndividual' && {
        taxNumber: '',
        taxOffice: '',
        identityNum: ''
      })
    }));
  };

  const resetForm = () => {
    setFormData({
      formType: 'quick',
      customerType: '3',
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
      currency: 'TRY',
      customerSurname: '',
      isSubjectToEInvoice: false,
      isSubjectToEDispatch: false,
      eInvoiceStartDate: null,
      isSubjectToEShipment: false,
      eShipmentStartDate: null,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Ana submit işlemi - CustomerCreate ile birebir aynı mantık, sadece token bazlı
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    let error: any = null;
    let errorMessage = '';

    try {
      // Temel doğrulama
      if (!formData.customerName || formData.customerName.trim() === '') {
        errorMessage = 'Müşteri adı alanı zorunludur';
        error = new Error(errorMessage);
      }

      // Form tipine göre doğrulama
      if (formData.formType === 'detailed') {
        if (formData.isIndividual) {
          if (!formData.identityNum || formData.identityNum.trim() === '') {
            errorMessage = 'TC Kimlik Numarası zorunludur';
            error = new Error(errorMessage);
          }
        } else {
          if (!formData.taxNumber || formData.taxNumber.trim() === '') {
            errorMessage = 'Vergi Numarası zorunludur';
            error = new Error(errorMessage);
          }
          if (!formData.taxOffice || formData.taxOffice.trim() === '') {
            errorMessage = 'Vergi Dairesi zorunludur';
            error = new Error(errorMessage);
          }
        }
      } else {
        if (!formData.phone && !formData.email) {
          errorMessage = 'Telefon veya E-posta alanlarından en az biri zorunludur';
          error = new Error(errorMessage);
        }
      }

      if (error) {
        setSnackbar({
          open: true,
          message: `Müşteri oluşturulurken hata oluştu: ${errorMessage}`,
          severity: 'error'
        });
        return;
      }

      // CustomerCreateRequest modeline uygun payload
      const customerData: any = {
        customerCode: formData.customerCode || "",
        customerName: formData.customerName,
        customerSurname: formData.customerSurname || "",
        customerTypeCode: formData.customerType,
        companyCode: "1",
        officeCode: "M",
        currencyCode: formData.currency || "TRY",
        isIndividualAcc: formData.isIndividual,
        taxNumber: formData.taxNumber || "",
        customerIdentityNumber: formData.identityNum || "",
        isSubjectToEInvoice: formData.isSubjectToEInvoice || false,
        isSubjectToEShipment: formData.isSubjectToEDispatch || false,
        dataLanguageCode: "TR",
        addresses: [],
        communications: []
      };

      console.log('Gönderilecek müşteri verisi:', customerData);
      
      // 1. Adım: Token ile temel müşteri oluştur
      const customerResponse = await customerApi.createCustomerWithToken(token!, customerData);
      
      if (customerResponse.success) {
        const createdCustomerCode = customerResponse.data.customerCode;
        console.log('Müşteri başarıyla oluşturuldu. Müşteri kodu:', createdCustomerCode);
        
        // 2. Adım: Adres ve iletişim bilgilerini ekle (token bazlı)
        try {
          let adresEklendiMi = false;
          let iletisimEklendiMi = false;
          
          // Adres bilgisi ekle
          if (formData.address) {
            try {
              const addressData = { 
                CustomerCode: createdCustomerCode,
                AddressTypeCode: "2",
                Address: formData.address || "",
                CountryCode: "TR",
                StateCode: formData.region || "TR.00",
                CityCode: formData.city || "TR.00",
                DistrictCode: formData.district || "",
                TaxOffice: "",
                TaxOfficeCode: formData.taxOffice || "",
                TaxNumber: formData.taxNumber || "",
                AddressID: 0,
                IsBlocked: false,
                IsDefault: true,
                IsBillingAddress: true,
                IsShippingAddress: true,
                CreatedUserName: "SYSTEM",
                LastUpdatedUserName: "SYSTEM"
              };
              const adresResponse = await customerApi.createCustomerAddressWithToken(token!, createdCustomerCode, addressData);
              console.log('Adres ekleme yanıtı:', adresResponse);
              adresEklendiMi = adresResponse.success;
            } catch (adresHata) {
              console.error('Adres eklenirken hata:', adresHata);
            }
          } else {
            adresEklendiMi = true;
          }

          // İletişim bilgisi ekle - Telefon
          if (formData.phone) {
            try {
              const communicationData = {
                CustomerCode: createdCustomerCode,
                CommunicationTypeCode: "1",
                Communication: formData.phone,
                IsDefault: true
              };
              const telefonResponse = await customerApi.createCustomerCommunicationWithToken(token!, createdCustomerCode, communicationData);
              console.log('Telefon ekleme yanıtı:', telefonResponse);
              iletisimEklendiMi = telefonResponse.success;
            } catch (telefonHata) {
              console.error('Telefon eklenirken hata:', telefonHata);
            }
          } else {
            iletisimEklendiMi = true;
          }

          // İletişim bilgisi ekle - E-posta
          if (formData.email) {
            try {
              const communicationData = {
                CustomerCode: createdCustomerCode,
                CommunicationTypeCode: "3",
                Communication: formData.email,
                IsDefault: true
              };
              const emailResponse = await customerApi.createCustomerCommunicationWithToken(token!, createdCustomerCode, communicationData);
              console.log('E-posta ekleme yanıtı:', emailResponse);
            } catch (emailHata) {
              console.error('E-posta eklenirken hata:', emailHata);
            }
          }

          // Başarı mesajı
          setSnackbar({
            open: true,
            message: `Müşteri başarıyla oluşturuldu! Müşteri Kodu: ${createdCustomerCode}`,
            severity: 'success'
          });
          
          // Formu temizle
          resetForm();
          
        } catch (detayHata) {
          console.error('Adres/iletişim eklenirken hata:', detayHata);
          setSnackbar({
            open: true,
            message: `Müşteri oluşturuldu ancak adres/iletişim bilgileri eklenirken hata oluştu. Müşteri Kodu: ${createdCustomerCode}`,
            severity: 'warning'
          });
        }
      } else {
        throw new Error(customerResponse.message || 'Müşteri oluşturulamadı');
      }
      
    } catch (error: any) {
      console.error('Müşteri oluşturulurken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: `Müşteri oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Müşteri Kayıt Formu
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Lütfen tüm gerekli bilgileri eksiksiz doldurunuz
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Form Tipi Seçimi */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Form Tipi</Typography>
            <RadioGroup
              row
              name="formType"
              value={formData.formType}
              onChange={(e) => setFormData(prev => ({ ...prev, formType: e.target.value as 'quick' | 'detailed' }))}
            >
              <FormControlLabel value="quick" control={<Radio />} label="Hızlı Form" />
              <FormControlLabel value="detailed" control={<Radio />} label="Detaylı Form" />
            </RadioGroup>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Müşteri Tipi */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Müşteri Tipi</Typography>
            <RadioGroup
              row
              name="isIndividual"
              value={formData.isIndividual.toString()}
              onChange={handleRadioChange}
            >
              <FormControlLabel value="false" control={<Radio />} label="Kurumsal" />
              <FormControlLabel value="true" control={<Radio />} label="Bireysel" />
            </RadioGroup>
          </Box>

          {/* Temel Bilgiler */}
          <Typography variant="subtitle1" gutterBottom>Temel Bilgiler</Typography>
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
            
            {formData.formType === 'detailed' && (
              <>
                {formData.isIndividual ? (
                  <TextField
                    fullWidth
                    required
                    label="TC Kimlik Numarası"
                    name="identityNum"
                    value={formData.identityNum}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 45%', minWidth: '200px' }}
                  />
                ) : (
                  <>
                    <TextField
                      fullWidth
                      required
                      label="Vergi Numarası"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleInputChange}
                      sx={{ flex: '1 1 45%', minWidth: '200px' }}
                    />
                    <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                      <InputLabel>Vergi Dairesi</InputLabel>
                      <Select
                        name="taxOffice"
                        value={formData.taxOffice}
                        label="Vergi Dairesi"
                        onChange={handleSelectChange}
                        disabled={isLoadingTaxOfficesHook}
                      >
                        {isLoadingTaxOfficesHook ? (
                          <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                        ) : taxOfficesDataFromHook && taxOfficesDataFromHook.length > 0 ? (
                          taxOfficesDataFromHook.map((office: any) => (
                            <MenuItem key={office.taxOfficeCode} value={office.taxOfficeCode}>
                              {office.taxOfficeName}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem value="" disabled>Vergi dairesi bulunamadı</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </>
                )}
              </>
            )}
          </Box>

          {/* Adres Bilgileri */}
          <Typography variant="subtitle1" gutterBottom>Adres Bilgileri</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
              <InputLabel>Bölge</InputLabel>
              <Select
                name="region"
                value={formData.region}
                label="Bölge"
                onChange={handleSelectChange}
              >
                {regions.map(region => (
                  <MenuItem key={region.code} value={region.code}>{region.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {formData.region && (
              <>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>Şehir</InputLabel>
                  <Select
                    name="city"
                    value={formData.city}
                    label="Şehir"
                    onChange={handleSelectChange}
                  >
                    {cities.map(city => (
                      <MenuItem key={city.code} value={city.code}>{city.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {formData.city && (
                  <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                    <InputLabel>İlçe</InputLabel>
                    <Select
                      name="district"
                      value={formData.district}
                      label="İlçe"
                      onChange={handleSelectChange}
                    >
                      {districts.map(district => (
                        <MenuItem key={district.code} value={district.code}>{district.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
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
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="button"
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={() => navigate('/')}
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

export default CustomerRegister;
