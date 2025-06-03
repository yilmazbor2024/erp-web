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
  Divider,
  Menu,
  Tooltip,
  IconButton,
  AlertColor,
  Grid
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { useTaxOffices } from '../../hooks/useTaxOffices';
import { useCurrencies } from '../../hooks/useCurrencies';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface FormData {
  customerType: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxOffice: string;
  taxNumber: string;
  identityNumber: string;
  currency: string;
  paymentMethod: string;
  termsAccepted: boolean;
  customerCode: string;
  customerName: string;
  isIndividual: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

// Dil seçenekleri için bayrak ikonları (emoji olarak)
const languageOptions = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

// Müşteri kayıt formu (QR kod ile)
const CustomerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [token, setToken] = useState<string | null>(searchParams.get('token'));
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [tokenValidating, setTokenValidating] = useState<boolean>(true);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(600); // 10 dakika = 600 saniye
  const { isAuthenticated, login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Çeviri hook'unu kullan
  const { t, i18n } = useTranslation();
  
  // Dil seçimi için menü durumu
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const languageMenuOpen = Boolean(languageMenuAnchor);
  
  // Dil menüsünü açma/kapama işleyicileri
  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchor(event.currentTarget);
  };
  
  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };
  
  // Dil değiştirme işleyicisi
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleLanguageMenuClose();
  };
  
  // Geçerli dili al
  const currentLanguage = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[0];
  
  // Kalan süreyi takip et
  useEffect(() => {
    // Token geçerli değilse veya süre dolmuşsa zamanlayıcıyı çalıştırma
    if (!tokenValid || !tokenExpiryTime) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const remainingSecs = Math.floor((tokenExpiryTime.getTime() - now.getTime()) / 1000);
      
      if (remainingSecs <= 0) {
        // Süre doldu, token'ı geçersiz kıl
        setTokenValid(false);
        setRemainingTime(0);
        setSnackbar({
          open: true,
          message: t('customerRegistration.tokenValidation.expired'),
          severity: 'error'
        });
        clearInterval(timer);
      } else {
        // Kalan süreyi güncelle
        setRemainingTime(remainingSecs);
      }
    }, 1000); // Her saniye güncelle
    
    // Temizleme fonksiyonu
    return () => clearInterval(timer);
  }, [tokenValid, tokenExpiryTime, t]);
  
  // Kalan süreyi formatla (dk:sn)
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    formType: 'quick', // Sadece hızlı form kullanılacak, seçenek kaldırıldı
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
      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!authToken && !isAuthenticated) {
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
  
  // Token doğrulama
  useEffect(() => {
    // Önce localStorage'dan kayıtlı token geçerlilik süresini kontrol et
    const savedTokenData = localStorage.getItem(`token_expiry_${token}`);
    
    if (savedTokenData) {
      try {
        const parsedData = JSON.parse(savedTokenData);
        const expiryTime = new Date(parsedData.expiryTime);
        const now = new Date();
        
        // Token hala geçerli mi kontrol et
        if (expiryTime > now) {
          setTokenValid(true);
          setTokenExpiryTime(expiryTime);
          const remainingSecs = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
          setRemainingTime(remainingSecs);
          setTokenValidating(false);
          return; // Eğer localStorage'dan geçerli bir token bulunduysa, API isteği yapma
        } else {
          // Süresi dolmuş tokeni localStorage'dan temizle
          localStorage.removeItem(`token_expiry_${token}`);
        }
      } catch (error) {
        console.error('Token verisi ayrıştırılırken hata oluştu:', error);
        localStorage.removeItem(`token_expiry_${token}`);
      }
    }
    
    // localStorage'da geçerli bir token yoksa, API'den doğrula
    const validateToken = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/Customer/validate-token/${token}`);
        
        if (response.data && response.data.success) {
          setTokenValid(true);
          
          // Token geçerlilik süresini ayarla (10 dakika)
          const expiryTime = new Date();
          expiryTime.setMinutes(expiryTime.getMinutes() + 10);
          setTokenExpiryTime(expiryTime);
          
          // Kalan süreyi hesapla (saniye cinsinden)
          const remainingSecs = Math.floor((expiryTime.getTime() - new Date().getTime()) / 1000);
          setRemainingTime(remainingSecs);
          
          // Token bilgilerini localStorage'a kaydet
          localStorage.setItem(`token_expiry_${token}`, JSON.stringify({
            expiryTime: expiryTime.toISOString(),
            tokenValid: true
          }));
          
          // Eğer token bir müşteri koduna bağlıysa, müşteri bilgilerini yükle
          if (response.data.customerCode) {
            // Burada müşteri bilgilerini yükleme işlemi yapılabilir
            console.log('Müşteri kodu:', response.data.customerCode);
          }
          
          // Başarılı doğrulama mesajı göster
          setSnackbar({
            open: true,
            message: t('customerRegistration.tokenValidation.success'),
            severity: 'success'
          });
        } else {
          setTokenValid(false);
          setTokenExpiryTime(null);
          setRemainingTime(0);
          localStorage.removeItem(`token_expiry_${token}`);
          setSnackbar({
            open: true,
            message: response.data?.message || t('customerRegistration.tokenValidation.invalid'),
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Token doğrulama hatası:', error);
        setTokenValid(false);
        setTokenExpiryTime(null);
        setRemainingTime(0);
        localStorage.removeItem(`token_expiry_${token}`);
        setSnackbar({
          open: true,
          message: t('customerRegistration.tokenValidation.invalid'),
          severity: 'error'
        });
      } finally {
        setTokenValidating(false);
      }
    };
    
    validateToken();
  }, [token, t]);

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
    
    setFormData(prev => {
      // Eğer müşteri adı değişiyorsa ve gerçek kişi ise, firstName alanını da güncelle
      if (name === 'customerName' && prev.isIndividual) {
        return { ...prev, [name]: value, firstName: value };
      }
      
      // Eğer firstName veya lastName değişiyorsa ve gerçek kişi ise, müşteri açıklamasını otomatik oluştur
      if ((name === 'firstName' || name === 'lastName') && prev.isIndividual) {
        const updatedData = { ...prev, [name]: value };
        // Ad ve soyadı birleştirerek müşteri açıklaması oluştur
        if (name === 'firstName' && updatedData.lastName) {
          updatedData.customerName = `${value} ${updatedData.lastName}`;
        } else if (name === 'lastName' && updatedData.firstName) {
          updatedData.customerName = `${updatedData.firstName} ${value}`;
        }
        return updatedData;
      }
      
      return { ...prev, [name]: value };
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => {
      // Gerçek kişi seçildiğinde, müşteri adını firstName alanına kopyala
      if (name === 'isIndividual' && checked) {
        return { 
          ...prev, 
          [name]: checked,
          firstName: prev.customerName // Müşteri adını firstName alanına kopyala
        };
      }
      
      // E-Fatura veya E-İrsaliye checkbox'ları için tarih alanlarını ayarla
      if (name === 'isSubjectToEInvoice' && checked && !prev.eInvoiceStartDate) {
        return { ...prev, [name]: checked, eInvoiceStartDate: new Date() };
      }
      
      if (name === 'isSubjectToEShipment' && checked && !prev.eShipmentStartDate) {
        return { ...prev, [name]: checked, eShipmentStartDate: new Date() };
      }
      
      return { ...prev, [name]: checked };
    });
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
  };
  
  // Form sıfırlama fonksiyonu
  const resetForm = () => {
    setFormData({
      formType: 'quick', // Sadece hızlı form kullanılacak
      customerType: '3',
      isIndividual: false,
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
  };

  // Snackbar kapatma fonksiyonu
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Token ile müşteri oluşturma işlemi
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Token geçerli değilse form gönderimini engelle
    if (!tokenValid || !token) {
      setSnackbar({
        open: true,
        message: 'Geçersiz kayıt linki. Lütfen geçerli bir link kullanın.',
        severity: 'error'
      });
      return;
    }
    
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
        // Detaylı form için ek doğrulamalar
        if (formData.isIndividual) {
          // Bireysel müşteri için doğrulamalar
          if (!formData.identityNum || formData.identityNum.trim() === '') {
            errorMessage = 'TC Kimlik Numarası zorunludur';
            error = new Error(errorMessage);
          }
        } else {
          // Kurumsal müşteri için doğrulamalar
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
        // Hızlı form için doğrulamalar
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

      // TypeScript için any tipini kullanarak genişletilebilir nesne oluştur
      const customerData: any = {
        customerCode: formData.customerCode,
        customerName: formData.customerName,
        customerTypeCode: formData.customerType, // 3 = Müşteri, 1 = Tedarikçi
        countryCode: formData.country,
        stateCode: formData.region,
        cityCode: formData.city,
        districtCode: formData.district,
        address: formData.address,
        contactName: formData.contactName,
        officeCode: "M", // Varsayılan ofis kodu (test ettiğimiz ve çalıştığını bildiğimiz kod)
        exchangeTypeCode: formData.exchangeTypeCode,
        currencyCode: formData.exchangeTypeCode, // Para birimi değeri olarak exchangeTypeCode kullanıyoruz
        isIndividualAcc: formData.isIndividual,
        companyCode: 1, // Şirket kodu sayı olarak gönderilmeli
        createdUserName: localStorage.getItem('userName') || 'system' // Oluşturan kullanıcı adı
      };

      // Detaylı mod için ek alanlar
      if (formData.formType === 'detailed') {
        if (formData.isIndividual) {
          // Bireysel müşteri için TC kimlik numarası
          customerData.identityNum = formData.identityNum;
        }
        // Vergi bilgileri
        if (formData.taxNumber) {
          customerData.taxNumber = formData.taxNumber;
          customerData.taxOffice = formData.taxOffice;
          customerData.taxOfficeCode = formData.taxOffice; // Vergi dairesi kodu olarak vergi dairesini kullan
        }
      }

      // Kullanıcı adını al
      const userName = localStorage.getItem('userName') || 'system';
      
      // Benzersiz adres ID'si oluştur
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      console.log('Gönderilecek müşteri verisi:', customerData);
      
      // Token ile müşteri oluşturma
      const response = await axios.post(`${API_BASE_URL}/api/v1/Customer/create-with-token`, {
        token: token,
        customerData: customerData
      });
      
      // Axios yanıtını işle - response.data içinde API yanıtı var
      const customerResponse = response.data;
      
      if (customerResponse && customerResponse.success) {
        // Müşteri başarıyla oluşturuldu
        const createdCustomerCode = customerResponse.data.customerCode;
        console.log('Müşteri başarıyla oluşturuldu. Müşteri kodu:', createdCustomerCode);
        
        // 2. Adım: Adres ve iletişim bilgilerini ekle
        try {
          const addressPromises = [];
          const communicationPromises = [];
          let adresEklendiMi = false;
          let iletisimEklendiMi = false;
          
          // Adres bilgisi ekle
          if (formData.address) {
            try {
              // Backend'in beklediği formatta adres nesnesi oluştur
              // CustomerAddressCreateRequest sınıfına uygun alanları kullan
              // Kullanıcının seçtiği değerleri veya varsayılan değerleri kullan
              // prCurrAccPostalAddress tablosuyla %100 uyumlu adres verisi oluşturma
              const addressData = { 
                // Müşteri bilgileri - prCurrAccPostalAddress.CurrAccCode
                CustomerCode: createdCustomerCode, // Müşteri kodu, NOT NULL alan
                
                // Adres tipi bilgileri - prCurrAccPostalAddress.AddressTypeCode
                AddressTypeCode: "2", // "2" = "İş Adresi" - veritabanındaki geçerli kod, NOT NULL alan
                
                // Adres bilgileri - prCurrAccPostalAddress.Address
                Address: formData.address || "", // Açık adres, NOT NULL alan
                
                // Ülke, şehir, bölge bilgileri - prCurrAccPostalAddress tablosundaki ilgili alanlar
                CountryCode: "TR", // Ülke kodu, NOT NULL alan, varsayılan: Türkiye
                StateCode: formData.region || "TR.00", // Eyalet/Bölge kodu, NOT NULL alan
                CityCode: formData.city || "TR.00", // Şehir kodu, NOT NULL alan
                DistrictCode: formData.district || "", // İlçe kodu, NOT NULL alan
                
                // Posta ve vergi bilgileri - prCurrAccPostalAddress tablosundaki ilgili alanlar
                // Backend'de ZipCode için varsayılan değer kullanılacak, burada göndermiyoruz
                TaxOffice: "", // Vergi dairesi adı, backend'de zorunlu alan, boş string olarak gönderiyoruz
                TaxOfficeCode: formData.taxOffice || "", // Vergi dairesi kodu, backend'de zorunlu alan
                TaxNumber: formData.taxNumber || "", // Vergi numarası, NOT NULL alan
                
                // Adres ID - prCurrAccPostalAddress tablosundaki ilgili alan
                AddressID: 0, // Adres ID, NOT NULL alan, otomatik artan
                
                // Durum bilgileri
                IsBlocked: false, // Adres bloke mi?, NOT NULL alan, varsayılan: false
                IsDefault: true, // Varsayılan adres mi?
                IsBillingAddress: true, // Fatura adresi mi?
                IsShippingAddress: true, // Sevkiyat adresi mi?
                
                // Kullanıcı bilgileri - prCurrAccPostalAddress tablosundaki ilgili alanlar
                CreatedUserName: "SYSTEM", // Oluşturan kullanıcı, NOT NULL alan
                LastUpdatedUserName: "SYSTEM" // Son güncelleyen kullanıcı, NOT NULL alan
              };
              const adresResponse = await customerApi.createCustomerAddress(createdCustomerCode, addressData);
              console.log('Adres ekleme yanıtı:', adresResponse);
              adresEklendiMi = adresResponse.success;
            } catch (adresHata) {
              console.error('Adres eklenirken hata:', adresHata);
            }
          } else {
            adresEklendiMi = true; // Adres girilmediyse başarılı sayıyoruz
          }

          // İletişim bilgisi ekle - Telefon
          if (formData.phone) {
            try {
              // CustomerCommunicationCreateRequest sınıfına uygun alanları kullan
              const communicationData = {
                CustomerCode: createdCustomerCode,
                CommunicationTypeCode: "1", // "1" = "Telefon" - veritabanında yaygın kullanılan kod
                Communication: formData.phone,
                IsDefault: true // Varsayılan iletişim olarak işaretle - prCurrAccDefault tablosunu güncelleyecek
              };
              const telefonResponse = await customerApi.createCustomerCommunication(createdCustomerCode, communicationData);
              console.log('Telefon ekleme yanıtı:', telefonResponse);
              iletisimEklendiMi = telefonResponse.success;
            } catch (telefonHata) {
              console.error('Telefon eklenirken hata:', telefonHata);
            }
          } else {
            iletisimEklendiMi = true; // Telefon girilmediyse başarılı sayıyoruz
          }

          // İletişim bilgisi ekle - E-posta
          if (formData.email) {
            try {
              // CustomerCommunicationCreateRequest sınıfına uygun alanları kullan
              const communicationData = {
                CustomerCode: createdCustomerCode,
                CommunicationTypeCode: "3", // "3" = "E-Posta" - veritabanındaki geçerli kod
                Communication: formData.email,
                IsDefault: !formData.phone // Telefon yoksa e-posta varsayılan olsun
              };
              const emailResponse = await customerApi.createCustomerCommunication(createdCustomerCode, communicationData);
              console.log('Email ekleme yanıtı:', emailResponse);
              if (!iletisimEklendiMi) {
                iletisimEklendiMi = emailResponse.success;
              }
            } catch (emailHata) {
              console.error('Email eklenirken hata:', emailHata);
            }
          } else if (!formData.phone) {
            iletisimEklendiMi = true; // Ne telefon ne email girilmediyse başarılı sayıyoruz
          }
          
          // Bağlantılı kişi ekle
          let contactEklendiMi = false;
          if (formData.firstName && formData.lastName) {
            try {
              // Bağlantılı kişi verisi oluştur
              // Backend'in beklediği formata uygun veri yapısı oluştur
              const contactData: any = {
                // Zorunlu alanlar
                FirstName: formData.firstName,
                LastName: formData.lastName,
                // IdentityNum sadece formda girilirse gönderilecek
                
                // İletişim bilgileri - bunlar backend'e ayrıca gönderilecek
                Phone: formData.phone || "",
                Email: formData.email || "",
                
                // Diğer alanlar
                IsDefault: true,
                CreatedUserName: "SYSTEM",
                LastUpdatedUserName: "SYSTEM"
              };
              
              // Eğer formda identityNum girilmişse ekle
              if (formData.identityNum) {
                contactData.IdentityNum = formData.identityNum;
              }
              
              const contactResponse = await customerApi.createCustomerContact(createdCustomerCode, contactData);
              console.log('Bağlantılı kişi ekleme yanıtı:', contactResponse);
              contactEklendiMi = contactResponse.success;
            } catch (contactHata) {
              console.error('Bağlantılı kişi eklenirken hata:', contactHata);
            }
          } else {
            contactEklendiMi = true; // Bağlantılı kişi adı veya soyadı girilmediyse başarılı sayıyoruz
          }
          
          // Bildirim mesajını oluştur
          let bildirimMesaji = 'Müşteri başarıyla oluşturuldu';
          let bildirimTipi: 'success' | 'error' = 'success';
          
          // Hata durumlarını kontrol et
          const hatalar = [];
          if (!adresEklendiMi) hatalar.push('adres');
          if (!iletisimEklendiMi) hatalar.push('iletişim');
          if (!contactEklendiMi && formData.contactName) hatalar.push('bağlantılı kişi');
          
          if (hatalar.length > 0) {
            bildirimMesaji += ', ancak ' + hatalar.join(' ve ') + ' bilgileri eklenemedi';
            bildirimTipi = 'error'; // warning yerine error kullan
          } else {
            bildirimMesaji += ' ve tüm bilgiler kaydedildi';
          }
          
          // Bildirim göster
          setSnackbar({
            open: true,
            message: bildirimMesaji,
            severity: bildirimTipi
          });
          
          // Formu sıfırla
          resetForm();
          
          // Müşteri listesine yönlendir
          setTimeout(() => {
            navigate('/customers');
          }, 1500); // 1.5 saniye sonra yönlendir (kullanıcının bildirimi görmesi için)
        } catch (error: any) {
          console.error('Müşteri işlemi sırasında genel hata:', error);
          setSnackbar({
            open: true,
            message: `Müşteri oluşturuldu fakat diğer bilgiler eklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
            severity: 'error'
          });
          
          // Hata olsa bile müşteri oluşturulduğu için yönlendir
          resetForm();
          setTimeout(() => {
            navigate('/customers');
          }, 1500); // 1.5 saniye sonra yönlendir
        }
      } else {
        errorMessage = customerResponse?.message || 'Müşteri oluşturulurken bir hata oluştu!';
        setSnackbar({
          open: true,
          message: `Müşteri oluşturulurken hata oluştu: ${errorMessage}`,
          severity: 'error'
        });
        setIsLoading(false);
      }
    } catch (customerError: any) {
      error = customerError;
      console.error("Müşteri oluşturulurken hata oluştu:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Müşteri oluşturulurken bir hata oluştu!',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" gutterBottom>
              {t('customerRegistration.title')}
            </Typography>
            
            {/* Token geçerlilik süresi göstergesi */}
            {tokenValid && tokenExpiryTime && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: remainingTime < 60 ? 'error.light' : remainingTime < 180 ? 'warning.light' : 'success.light',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: remainingTime < 60 ? 'error.contrastText' : remainingTime < 180 ? 'warning.contrastText' : 'success.contrastText',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  {t('customerRegistration.tokenValidation.remainingTime')}: {formatRemainingTime()}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Dil seçim menüsü */}
          <Box>
            <Tooltip title={t('customerRegistration.languageSelector')}>
              <Button
                onClick={handleLanguageMenuOpen}
                startIcon={<span style={{ fontSize: '1.2rem' }}>{currentLanguage.flag}</span>}
                variant="outlined"
                size="small"
              >
                {currentLanguage.name}
              </Button>
            </Tooltip>
            <Menu
              anchorEl={languageMenuAnchor}
              open={languageMenuOpen}
              onClose={handleLanguageMenuClose}
            >
              {languageOptions.map((lang) => (
                <MenuItem 
                  key={lang.code} 
                  onClick={() => changeLanguage(lang.code)}
                  selected={lang.code === i18n.language}
                >
                  <span style={{ marginRight: '8px' }}>{lang.flag}</span> {lang.name}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
        
        {/* Token doğrulama durumu */}
        {tokenValidating ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              {t('customerRegistration.tokenValidation.checking')}
            </Typography>
          </Box>
        ) : !tokenValid ? (
          <Box sx={{ my: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body1" color="error.dark">
              {t('customerRegistration.tokenValidation.invalid')}
            </Typography>
          </Box>
        ) : null}
        <Box component="form" noValidate sx={{ mt: 2 }} onSubmit={handleSubmit} style={{ opacity: tokenValidating || !tokenValid ? 0.5 : 1 }}>
          {/* Form içeriği token geçerli değilse devre dışı */}
          <fieldset disabled={tokenValidating || !tokenValid} style={{ border: 'none', padding: 0, margin: 0 }}>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label={t('customerRegistration.form.customerCode.label')}
              name="customerCode"
              value={formData.customerCode}
              onChange={handleInputChange}
              helperText={t('customerRegistration.form.customerCode.helper')}
              sx={{ flex: '1 1 100%' }}
            />
            <TextField
              fullWidth
              required
              label={t('customerRegistration.form.customerName.label')}
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              disabled={formData.isIndividual}
              sx={{ flex: '1 1 100%' }}
            />
          </Box>

          {/* Detaylı form seçeneği kaldırıldı */}
          {false && (
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isIndividual}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData(prev => {
                        // Gerçek kişi seçildiğinde, müşteri ünvanını ad soyad'dan oluştur
                        if (isChecked) {
                          return {
                            ...prev,
                            isIndividual: isChecked,
                          };
                        }
                        return { ...prev, isIndividual: isChecked };
                      });
                    }}
                    name="isIndividual"
                  />
                }
                label={t('customerRegistration.form.isIndividual.label')}
              />
            </Box>
          )}
          

          {formData.formType === 'detailed' && formData.isIndividual && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                required
                label={t('customerRegistration.form.firstName.label')}
                name="firstName"
                value={formData.firstName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData(prev => {
                    // Ad alanı değiştiğinde, müşteri ünvanını güncelle
                    const updatedData = { ...prev, firstName: newValue };
                    if (prev.lastName) {
                      updatedData.customerName = `${newValue} ${prev.lastName}`;
                    } else {
                      updatedData.customerName = newValue;
                    }
                    return updatedData;
                  });
                }}
                sx={{ flex: '1 1 45%', minWidth: '200px' }}
              />
              <TextField
                fullWidth
                required
                label={t('customerRegistration.form.lastName.label')}
                name="lastName"
                value={formData.lastName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData(prev => {
                    // Soyad alanı değiştiğinde, müşteri ünvanını güncelle
                    const updatedData = { ...prev, lastName: newValue };
                    if (prev.firstName) {
                      updatedData.customerName = `${prev.firstName} ${newValue}`;
                    } else {
                      updatedData.customerName = newValue;
                    }
                    return updatedData;
                  });
                }}
                sx={{ flex: '1 1 45%', minWidth: '200px' }}
              />
              <TextField
                fullWidth
                required
                label={t('customerRegistration.form.identityNum.label')}
                name="identityNum"
                value={formData.identityNum}
                onChange={handleInputChange}
                sx={{ flex: '1 1 100%', minWidth: '200px' }}
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
                    label={t('customerRegistration.taxOfficeCode')}
                    value={formData.taxOffice}
                    disabled
                    helperText={t('customerRegistration.selected')}
                  />
                  <TextField
                    fullWidth
                    label={t('customerRegistration.taxOfficeName')}
                    value={taxOfficesDataFromHook?.find(office => office.taxOfficeCode === formData.taxOffice)?.taxOfficeDescription || ''}
                    disabled
                  />
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => setFormData({...formData, taxOffice: ''})}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {t('customerRegistration.buttons.change')}
                  </Button>
                </Box>
              ) : (
                // Vergi dairesi seçilmemişse, seçim listesini göster
                <FormControl fullWidth required sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>{t('customerRegistration.form.taxOffice.label')}</InputLabel>
                  <Select
                    name="taxOffice"
                    value={formData.taxOffice || ''}
                    label={t('customerRegistration.form.taxOffice.label')}
                    onChange={handleSelectChange}
                    disabled={isLoadingTaxOfficesHook}
                  >
                    {isLoadingTaxOfficesHook ? (
                      <MenuItem value="" disabled>{t('customerRegistration.loading')}</MenuItem>
                    ) : taxOfficesDataFromHook && taxOfficesDataFromHook.length > 0 ? (
                      taxOfficesDataFromHook.map((office: any) => (
                        <MenuItem key={office.taxOfficeCode} value={office.taxOfficeCode}>
                          {office.taxOfficeDescription}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>{t('customerRegistration.form.taxOffice.notFound')}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}
              <TextField
                fullWidth
                required
                label={t('customerRegistration.form.taxNumber.label')}
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
                  label={t('customerRegistration.form.isSubjectToEInvoice.label')}
                />
                {formData.isSubjectToEInvoice && (
                  <TextField
                    type="date"
                    label={t('customerRegistration.eInvoiceStartDate')}
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
                  label={t('customerRegistration.form.isSubjectToEShipment.label')}
                />
                {formData.isSubjectToEShipment && (
                  <TextField
                    type="date"
                    label={t('customerRegistration.eShipmentStartDate')}
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
          <Typography variant="subtitle1" gutterBottom>{t('customerRegistration.addressInfo')}</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl fullWidth required sx={{ flex: '1 1 45%', minWidth: '200px' }}>
              <InputLabel>{t('customerRegistration.form.country.label')}</InputLabel>
              <Select
                name="country"
                value={formData.country || ''}
                label={t('customerRegistration.form.country.label')}
                onChange={handleSelectChange}
              >
                {countries.length > 0 ? (
                  countries.map(c => (
                    <MenuItem key={c.countryCode} value={c.countryCode}>
                      {c.countryDescription}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="TR">{t('customerRegistration.countries.turkey')}</MenuItem>
                )}
              </Select>
            </FormControl>

            {formData.country === 'TR' && (
              <>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>{t('customerRegistration.form.region.label')}</InputLabel>
                  <Select
                    name="region"
                    value={formData.region || ''}
                    label={t('customerRegistration.form.region.label')}
                    onChange={handleSelectChange}
                  >
                    {regions.map(r => (
                      <MenuItem key={r.code} value={r.code}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>{t('customerRegistration.form.city.label')}</InputLabel>
                  <Select
                    name="city"
                    value={formData.city || ''}
                    label={t('customerRegistration.form.city.label')}
                    onChange={handleSelectChange}
                  >
                    {cities.map(c => (
                      <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>{t('customerRegistration.form.district.label')}</InputLabel>
                  <Select
                    name="district"
                    value={formData.district || ''}
                    label={t('customerRegistration.form.district.label')}
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
              label={t('customerRegistration.form.address.label')}
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
              <InputLabel>{t('customerRegistration.currency.label')}</InputLabel>
              <Select
                name="exchangeTypeCode"
                value={(isLoadingCurrenciesHook || !currenciesDataFromHook || currenciesDataFromHook.length === 0) ? '' : formData.exchangeTypeCode}
                label={t('customerRegistration.currency.label')}
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
                  <MenuItem value="" disabled>{t('customerRegistration.currency.notFound')}</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>{t('customerRegistration.contactInfo')}</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              required
              label={t('customerRegistration.form.phone.label')}
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '200px' }}
            />
            <TextField
              fullWidth
              required
              label={t('customerRegistration.form.email.label')}
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
              onClick={() => navigate('/customers')}
            >
              {t('customerRegistration.buttons.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : t('customerRegistration.buttons.submit')}
            </Button>
          </Box>
          </fieldset>
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

export default CustomerRegistration;
