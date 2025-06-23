import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import ReactConfetti from 'react-confetti';
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
  Grid,
  FormHelperText
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { qrCustomerService } from '../../services/qrCustomerService';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { customerService } from '../../services/customerService';
import axios from 'axios';
import { useTaxOffices } from '../../hooks/useTaxOffices';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useCountriesWithToken, useStatesWithToken, useHierarchyWithToken } from '../../hooks/useLocation';
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
  stateCode: string;
  cityCode: string;
  districtCode: string;
  taxOffice: string;
  taxNumber: string;
  identityNumber: string;
  exchangeTypeCode: string; // Para birimi kodu
  termsAccepted: boolean;
  customerName: string;
  isIndividual: boolean;
  // Eski alanlar - şimdi stateCode, cityCode, districtCode kullanılıyor
  region?: string;
  district?: string;
  // Ek alanlar
  contactName?: string;
  formType?: string;
  isSubjectToEInvoice?: boolean;
  eInvoiceStartDate: Date | null;
  isSubjectToEShipment?: boolean;
  eShipmentStartDate: Date | null;
  // customerCode ve paymentMethod alanları kaldırıldı
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
  const queryParams = new URLSearchParams(location.search);
  const [token, setToken] = useState<string>(queryParams.get('token') || '');
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [tokenValidating, setTokenValidating] = useState<boolean>(true);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(600); // 10 dakika = 600 saniye
  const [forceUpdate, setForceUpdate] = useState<boolean>(false); // Dil değişikliğini zorlamak için
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  // SnackbarState tipi tanımı
  interface SnackbarState {
    open: boolean;
    message: string;
    severity: AlertColor;
  }
  
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Başarı sesi çal
  const playSuccessSound = useCallback(() => {
    try {
      // Web Audio API kullanarak ses oluştur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Başarı melodisi için notalar (C-E-G-C arpeji)
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 frekansları
      const noteDuration = 0.15; // Her notanın süresi (saniye)
      
      // Her nota için oscillator oluştur ve çal
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + noteDuration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime + index * noteDuration);
        oscillator.stop(audioContext.currentTime + (index + 1) * noteDuration);
      });
      
      // Havai fişek sesi ekle
      setTimeout(() => {
        const fireworksOscillator = audioContext.createOscillator();
        const fireworksGain = audioContext.createGain();
        
        fireworksOscillator.type = 'sawtooth';
        fireworksOscillator.frequency.value = 150;
        fireworksOscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.5);
        
        fireworksGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        fireworksGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        fireworksOscillator.connect(fireworksGain);
        fireworksGain.connect(audioContext.destination);
        
        fireworksOscillator.start();
        fireworksOscillator.stop(audioContext.currentTime + 0.5);
      }, notes.length * noteDuration * 1000);
      
    } catch (error) {
      console.error('Ses çalma hatası:', error);
    }
  }, []);
  
  // Hata sesi çal
  const playErrorSound = useCallback(() => {
    try {
      // Web Audio API kullanarak ses oluştur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Düşük frekanslı "aww" sesi
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 180;
      oscillator.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.6);
      
    } catch (error) {
      console.error('Ses çalma hatası:', error);
    }
  }, []);
  
  // Pencere boyutlarını takip et
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    console.log('Dil değiştiriliyor:', languageCode);
    try {
      i18n.changeLanguage(languageCode)
        .then(() => {
          console.log('Dil başarıyla değiştirildi:', languageCode);
          // Dil değişikliğini zorlamak için state güncelleme
          setForceUpdate((prev: boolean) => !prev);
        })
        .catch((error: Error) => {
          console.error('Dil değiştirme hatası:', error);
        });
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
      // Alternatif yöntem
      localStorage.setItem('i18nextLng', languageCode);
      window.location.reload();
    }
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
  const [formData, setFormData] = useState<FormData>({
    customerType: 'individual', // Varsayılan olarak bireysel
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'TR', // Varsayılan olarak Türkiye
    stateCode: '',
    cityCode: '',
    districtCode: '',
    taxOffice: '',
    taxNumber: '',
    identityNumber: '',
    exchangeTypeCode: '0', // Döviz alım ortamı kodu - varsayılan olarak 0 (Belirtilmemiş)
    termsAccepted: false,
    customerName: '',
    isIndividual: true, // Varsayılan olarak bireysel
    region: '',
    district: '',
    contactName: '',
    formType: 'quick', // Varsayılan olarak hızlı form
    isSubjectToEInvoice: false,
    eInvoiceStartDate: null,
    isSubjectToEShipment: false,
    eShipmentStartDate: null
  });

  // Referans veri state'leri
  const [locationHierarchy, setLocationHierarchy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Not: SnackbarState tipi zaten yukarıda tanımlandı
  
  // Bölge, şehir ve ilçe listeleri için state'ler
  const [regions, setRegions] = useState<Array<{code: string, name: string}>>([]);
  const [cities, setCities] = useState<{ code: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ code: string; name: string }[]>([]);
  
  // Debug için locationHierarchyData'yı izle
  const [debugHierarchy, setDebugHierarchy] = useState<any>(null);

  // Token ile vergi dairelerini ve para birimlerini getir
  const { data: taxOfficesDataFromHook, isLoading: isLoadingTaxOfficesHook } = useTaxOffices(token, tokenValid);
  
  // Para birimlerini getiren hook'u kullan
  const { data: currenciesDataFromHook, isLoading: isLoadingCurrenciesHook } = useCurrencies(token, 'TR', tokenValid);
  
  // Ülkeleri getiren hook'u kullan
  const { data: countriesDataFromHook, isLoading: isLoadingCountriesHook } = useCountriesWithToken(token, 'TR', tokenValid);
  
  // Bölgeleri/illeri getiren hook'u kullan
  const { data: statesDataFromHook, isLoading: isLoadingStatesHook } = useStatesWithToken(token, 'TR', tokenValid);
  
  // Hiyerarşik lokasyon verisini getiren hook'u kullan - formData.stateCode değiştiğinde güncellenecek
  const { data: locationHierarchyData, isLoading: isLoadingHierarchyHook } = useHierarchyWithToken(
    token,
    'TR',
    'TR', // Her zaman TR ülke kodunu kullan
    tokenValid // Her zaman aktif olsun, bölge seçilmese bile veriyi çekelim
  );
  
  // locationHierarchyData değiştiğinde şehir listesini güncelle
  useEffect(() => {
    if (locationHierarchyData) {
      console.log('locationHierarchyData güncellendi:', locationHierarchyData);
      
      // Veri yapısını detaylı incele
      console.log('locationHierarchyData.states:', locationHierarchyData.states);
      
      // Seçili bölge için şehirleri bul
      if (formData.stateCode && locationHierarchyData.states) {
        // Seçili bölgeyi bul
        const selectedState = locationHierarchyData.states.find(
          (state: any) => state.stateCode === formData.stateCode
        ) as any; // TypeScript hatalarını geçici olarak çözmek için any tipini kullan
        
        console.log('Seçili bölge:', selectedState);
        
        // Seçili bölgenin şehirlerini al
        if (selectedState && selectedState.cities && selectedState.cities.length > 0) {
          console.log('Bölgeye ait şehirler:', selectedState.cities);
          
          const citiesList = selectedState.cities.map((city: any) => ({
            code: city.cityCode,
            name: city.cityDescription
          }));
          
          console.log('Oluşturulan şehir listesi:', citiesList);
          setCities(citiesList);
        } else {
          console.log('Seçili bölge için şehir bulunamadı');
          setCities([]);
        }
      } else {
        console.log('Bölge seçilmedi veya states verisi yok');
        setCities([]);
      }
    }
  }, [locationHierarchyData, formData.stateCode]);
  
  // Şehir seçildiğinde ilçe listesini güncelle
  useEffect(() => {
    if (locationHierarchyData && formData.cityCode) {
      console.log('Şehir seçildi:', formData.cityCode);
      
      // Seçili bölgeyi bul
      if (formData.stateCode && locationHierarchyData.states) {
        const selectedState = locationHierarchyData.states.find(
          (state: any) => state.stateCode === formData.stateCode
        ) as any;
        
        // Seçili şehri bul
        if (selectedState && selectedState.cities) {
          const selectedCity = selectedState.cities.find(
            (city: any) => city.cityCode === formData.cityCode
          ) as any;
          
          console.log('Seçili şehir:', selectedCity);
          
          // Seçili şehrin ilçelerini al
          if (selectedCity && selectedCity.districts && selectedCity.districts.length > 0) {
            console.log('Şehre ait ilçeler:', selectedCity.districts);
            
            const districtsList = selectedCity.districts.map((district: any) => ({
              code: district.districtCode,
              name: district.districtDescription
            }));
            
            console.log('Oluşturulan ilçe listesi:', districtsList);
            setDistricts(districtsList);
          } else {
            console.log('Seçili şehir için ilçe bulunamadı');
            setDistricts([]);
          }
        } else {
          console.log('Şehir bulunamadı');
          setDistricts([]);
        }
      } else {
        console.log('Bölge seçilmedi veya states verisi yok');
        setDistricts([]);
      }
    } else {
      // Şehir seçilmemişse ilçe listesini temizle
      setDistricts([]);
    }
  }, [locationHierarchyData, formData.stateCode, formData.cityCode]);

  // Oturum kontrolü - Token varsa login kontrolünü atla
  useEffect(() => {
    const checkAuth = async () => {
      // Token varsa login kontrolünü atla
      if (token) {
        // console.log('Token mevcut, login kontrolü atlanıyor...'); // Sürekli log'u kaldırıyoruz
        return;
      }
      
      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!authToken && !isAuthenticated) {
        console.log('Oturum açılmamış ve token yok, login sayfasına yönlendiriliyor...');
        try {
          // await login('admin@example.com', 'Admin123!'); // Otomatik login denemesi - Gerekirse açılabilir
        } catch (error) {
          console.error('Otomatik login hatası:', error);
          navigate('/login', { replace: true });
        }
      }
    };
    checkAuth();
    // login fonksiyonunu bağımlılık dizisinden çıkarıyoruz çünkü kullanılmıyor
  }, [isAuthenticated, navigate, token]);
  
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
    
    if (token) {
      validateToken();
    }
  }, [token, t]);

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
    
    // Bölge seçildiğinde debug bilgisi ekle ve şehir listesini güncelle
    if (name === 'stateCode') {
      console.log('Bölge seçildi:', value);
      console.log('Mevcut locationHierarchyData:', locationHierarchyData);
      
      // Şehir listesini güncellemek için yeni bir API isteği yapalım
      // Bölge kodu TR.XX formatında olduğundan, sadece TR kısmını ülke kodu olarak kullanmalıyız
      const countryCode = value.split('.')[0]; // TR.MR -> TR
      console.log('Kullanılacak ülke kodu:', countryCode);
      
      // FormData'yı güncelle
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cityCode: '', // Şehir seçimini sıfırla
        districtCode: '' // İlçe seçimini sıfırla
      }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleDateChange = (name: 'eInvoiceStartDate' | 'eShipmentStartDate', value: string) => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        [name]: new Date(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Form ve Snackbar fonksiyonları dosyanın sonunda tanımlanmıştır

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
          if (!formData.identityNumber || formData.identityNumber.trim() === '') {
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

      // CustomerCreate.tsx ile aynı formatta veri hazırla
      const customerData: any = {
        customerCode: "", // Boş gönder, backend otomatik oluşturacak
        customerDescription: formData.customerName,
        customerName: formData.firstName,
        customerLastName: formData.lastName,
        customerTypeCode: formData.customerType,
        countryCode: 'TR',
        stateCode: formData.stateCode || formData.region || 'TR.DA',
        cityCode: formData.cityCode || formData.city || 'TR.34',
        districtCode: formData.districtCode || formData.district || '',
        address: formData.address || '',
        contactName: '',
        officeCode: "M", // Varsayılan ofis kodu (test ettiğimiz ve çalıştığını bildiğimiz kod)
        isIndividualAcc: formData.customerType === 'individual',
        companyCode: 1,
        taxNumber: formData.taxNumber || '',
        taxOffice: formData.taxOffice || '',
        createdUserName: 'system',
        // TC Kimlik numarasını ana müşteri verisine ekle
        identityNum: formData.identityNumber || ''
      };
      
      // Adres bilgilerini doğrudan müşteri oluşturma içinde gönder
      customerData.addresses = [
        {
          customerCode: '',
          addressID: 0,
          addressTypeCode: '2', // 2: İş adresi
          address: formData.address || '',
          countryCode: 'TR',
          stateCode: formData.stateCode || formData.region || 'TR.DA',
          cityCode: formData.cityCode || formData.city || 'TR.34',
          districtCode: formData.districtCode || formData.district || '',
          taxOffice: '',
          // TC Kimlik numarasını adres verilerine de ekle
          identityNum: formData.identityNumber || '',
          taxOfficeCode: formData.taxOffice || '',
          taxNumber: formData.taxNumber || '',
          isBlocked: false,
          createdUserName: 'system',
          lastUpdatedUserName: 'system'
        }
      ];
      
      // İletişim bilgilerini ekle - QR kod akışında tek seferde gönderilecek
      customerData.communications = [];
      
      // Telefon bilgisi varsa ekle
      if (formData.phone) {
        customerData.communications.push({
          customerCode: '', // Backend tarafında set edilecek
          communicationTypeCode: '1', // Telefon
          communication: formData.phone,
          isDefault: true,
          createdUserName: 'system',
          lastUpdatedUserName: 'system'
        });
        }
        
      // Email bilgisi varsa ekle
      if (formData.email) {
        customerData.communications.push({
          customerCode: '', // Backend tarafında set edilecek
          communicationTypeCode: '3', // Email
          communication: formData.email,
          isDefault: true,
          createdUserName: 'system',
          lastUpdatedUserName: 'system'
        });
      }
      
      // Bağlantılı kişi bilgilerini ekle - QR kod akışında tek seferde gönderilecek
      if (formData.phone || formData.email) {
        customerData.contacts = [
          {
            customerCode: '',
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactTypeCode: '1', // 1: Yetkili
            phone: formData.phone,
            email: formData.email,
            isDefault: true,
            createdUserName: 'system',
            lastUpdatedUserName: 'system'
          }
        ];
        
        // Eğer formda identityNum girilmişse ekle
        if (formData.identityNumber) {
          customerData.contacts[0].identityNum = formData.identityNumber;
        }
      }

      // Form verilerini konsola yazdır
      console.log('Form verileri:', formData);
      console.log('Gönderilecek müşteri verisi:', customerData);
      console.log('Adresler:', customerData.addresses);
      console.log('İletişim bilgileri:', customerData.communications);
      console.log('Bağlantılı kişiler:', customerData.contacts);
      
      // Token ile müşteri oluşturma - tüm bilgileri tek seferde gönder
      const customerResponse = await customerService.createCustomerWithToken(token, customerData);
      
      if (customerResponse.success) {
        // Müşteri başarıyla oluşturuldu
        let createdCustomerCode = '';
        let responseToken = token; // Varsayılan olarak gönderilen token'i kullan
        
        // Backend'den dönen yanıtın formatını kontrol et
        const anyResponse = customerResponse as any;
        
        // Müşteri kodunu al
        if (anyResponse.data && anyResponse.data.customerCode) {
          createdCustomerCode = anyResponse.data.customerCode;
        } else if (anyResponse.customerCode) {
          createdCustomerCode = anyResponse.customerCode;
        } else if (anyResponse.data && anyResponse.data.data && anyResponse.data.data.customerCode) {
          createdCustomerCode = anyResponse.data.data.customerCode;
        }
        
        // Token'i al
        if (anyResponse.token) {
          responseToken = anyResponse.token;
          // Token'i localStorage'a kaydet
          localStorage.setItem('customerToken', responseToken);
          console.log('Token localStorage a kaydedildi:', responseToken.substring(0, 10) + '...');
        }
        
        console.log('Müşteri başarıyla oluşturuldu. Müşteri kodu:', createdCustomerCode);
        console.log('Adres, iletişim ve bağlantılı kişi bilgileri müşteri kaydı sırasında eklendi.');
        
        // Başarı durumunda konfeti ve ses efekti
        setShowConfetti(true);
        playSuccessSound();
        
        // 5 saniye sonra konfeti efektini kaldır
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Tüm işlemler başarılı
        const adresEklendiMi = true;
        const iletisimEklendiMi = true;
        const contactEklendiMi = formData.firstName && formData.lastName ? true : false;
        
        // Bildirim mesajını oluştur
        let bildirimMesaji = 'Müşteri başarıyla oluşturuldu';
        let bildirimTipi: 'success' | 'error' = 'success';
        
        // Hata durumlarını kontrol et
        const hatalar = [];
        if (!adresEklendiMi) hatalar.push('adres');
        if (!iletisimEklendiMi) hatalar.push('iletişim');
        if (!contactEklendiMi && formData.firstName && formData.lastName) hatalar.push('bağlantılı kişi');
        
        if (hatalar.length > 0) {
          bildirimMesaji += ', ancak ' + hatalar.join(' ve ') + ' bilgileri eklenemedi';
          bildirimTipi = 'error'; // warning yerine error kullan
        } else {
          bildirimMesaji += ' ve tüm bilgiler kaydedildi';
        }
        
        // Başarılı bildirim göster
        setSnackbar({
          open: true,
          message: bildirimMesaji,
          severity: bildirimTipi
        });
        
        // Form temizle ve yükleme durumunu kapat
        setFormData({
          customerType: 'individual',
          companyName: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: 'TR',
          stateCode: '',
          cityCode: '',
          districtCode: '',
          taxOffice: '',
          taxNumber: '',
          identityNumber: '',
          exchangeTypeCode: '0', // Döviz alım ortamı kodu
          termsAccepted: false,
          customerName: '',
          isIndividual: true,
          eInvoiceStartDate: null,
          eShipmentStartDate: null
        });
        
        // Yükleme durumunu kapat
        setIsLoading(false);
        
        // Müşteri listesine yönlendir
        setTimeout(() => {
          navigate('/customers');
        }, 1500); // 1.5 saniye sonra yönlendir (kullanıcının bildirimi görmesi için)
      } else {
        // Hata durumu
        console.error('Müşteri oluşturma hatası:', customerResponse);
        setSnackbar({
          open: true,
          message: `Müşteri oluşturulurken hata oluştu: ${customerResponse.message || 'Bilinmeyen hata'}`,
          severity: 'error'
        });
        
        // Hata durumunda ses efekti
        playErrorSound();
        
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Müşteri kayıt hatası:', error);
      setSnackbar({
        open: true,
        message: `Müşteri oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        severity: 'error'
      });
      setIsLoading(false);
    }
  };

  // Form alanlarını temizle
  const resetForm = () => {
    setFormData({
      customerType: 'individual',
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'TR',
      stateCode: '',
      cityCode: '',
      districtCode: '',
      taxOffice: '',
      taxNumber: '',
      identityNumber: '',
      exchangeTypeCode: '0', // Döviz alım ortamı kodu
      termsAccepted: false,
      customerName: '',
      isIndividual: true,
      region: '',
      district: '',
      contactName: '',
      formType: 'quick',
      isSubjectToEInvoice: false,
      eInvoiceStartDate: null,
      isSubjectToEShipment: false,
      eShipmentStartDate: null
    });
    setSnackbar({
      open: true,
      message: t('customerRegistration.messages.formReset'),
      severity: 'success'
    });
  };

  // Snackbar'i kapat
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="md">
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
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
          
          {/* Müşteri Kodu alanı kaldırıldı - backend tarafından otomatik oluşturuluyor */}
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              required
              label={t('customerRegistration.form.customerName.label')}
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              // ADI alanı her zaman düzenlenebilir olmalı
              sx={{ flex: '1 1 100%' }}
            />
          </Box>

          {/* Bireysel/Kurumsal müşteri seçimi */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {t('customerRegistration.form.customerType.label')}:
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isIndividual}
                  onChange={(e) => setFormData({ ...formData, isIndividual: e.target.checked })}
                  color="primary"
                />
              }
              label={formData.isIndividual ? t('customerRegistration.form.customerType.individual') : t('customerRegistration.form.customerType.corporate')}
            />
          </Box>

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
                fullWidth
                disabled={isLoadingCountriesHook}
              >
                {isLoadingCountriesHook ? (
                  <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                ) : countriesDataFromHook && countriesDataFromHook.length > 0 ? (
                  countriesDataFromHook.map((country: any) => (
                    <MenuItem key={country.countryCode} value={country.countryCode}>
                      {country.countryDescription}
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
                    name="stateCode"
                    value={formData.stateCode || ''}
                    label={t('customerRegistration.form.region.label')}
                    onChange={handleSelectChange}
                    fullWidth
                    disabled={isLoadingStatesHook}
                  >
                    {isLoadingStatesHook ? (
                      <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                    ) : statesDataFromHook && statesDataFromHook.length > 0 ? (
                      statesDataFromHook.map((state: any) => (
                        <MenuItem key={state.stateCode} value={state.stateCode}>
                          {state.stateDescription}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>Bölge bulunamadı</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>{t('customerRegistration.form.city.label')}</InputLabel>
                  <Select
                    name="cityCode"
                    value={formData.cityCode || ''}
                    label={t('customerRegistration.form.city.label')}
                    onChange={handleSelectChange}
                    fullWidth
                    disabled={isLoadingHierarchyHook || !formData.stateCode}
                  >
                    <MenuItem value="">Seçiniz</MenuItem>
                    {isLoadingHierarchyHook ? (
                      <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                    ) : cities && cities.length > 0 ? (
                      cities.map((city) => (
                        <MenuItem key={city.code} value={city.code}>
                          {city.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        {formData.stateCode ? 'Bu bölgede şehir bulunamadı' : 'Önce bölge seçiniz'}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                  <InputLabel>{t('customerRegistration.form.district.label')}</InputLabel>
                  <Select
                    name="districtCode"
                    value={formData.districtCode || ''}
                    label={t('customerRegistration.form.district.label')}
                    onChange={handleSelectChange}
                    fullWidth
                    disabled={isLoadingHierarchyHook || !formData.cityCode}
                  >
                    <MenuItem value="">Seçiniz</MenuItem>
                    {isLoadingHierarchyHook ? (
                      <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                    ) : districts && districts.length > 0 ? (
                      districts.map((district) => (
                        <MenuItem key={district.code} value={district.code}>
                          {district.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        {formData.cityCode ? 'Bu şehirde ilçe bulunamadı' : 'Önce şehir seçiniz'}
                      </MenuItem>
                    )}
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

          {/* Türkiye seçildiğinde ve isIndividual değerine göre TC Kimlik veya Vergi alanları */}
          {formData.country === 'TR' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              {formData.isIndividual ? (
                <TextField
                  fullWidth
                  label={t('customerRegistration.form.identityNumber.label')}
                  name="identityNumber"
                  value={formData.identityNumber}
                  onChange={handleInputChange}
                  sx={{ flex: '1 1 100%' }}
                  helperText={t('customerRegistration.form.identityNumber.helper')}
                />
              ) : (
                <>
                  <TextField
                    fullWidth
                    label={t('customerRegistration.form.taxNumber.label')}
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 45%', minWidth: '200px' }}
                    helperText={t('customerRegistration.form.taxNumber.helper')}
                  />
                  <FormControl fullWidth sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                    <InputLabel>{t('customerRegistration.form.taxOffice.label')}</InputLabel>
                    <Select
                      name="taxOffice"
                      value={formData.taxOffice || ''}
                      label={t('customerRegistration.form.taxOffice.label')}
                      onChange={handleSelectChange}
                      fullWidth
                      disabled={isLoadingTaxOfficesHook}
                    >
                      <MenuItem value="">{t('customerRegistration.form.taxOffice.select')}</MenuItem>
                      {isLoadingTaxOfficesHook ? (
                        <MenuItem value="" disabled>Yükleniyor...</MenuItem>
                      ) : taxOfficesDataFromHook && taxOfficesDataFromHook.length > 0 ? (
                        taxOfficesDataFromHook.map((office: any) => (
                          <MenuItem key={office.taxOfficeCode} value={office.taxOfficeCode}>
                            {office.taxOfficeDescription || office.taxOfficeName}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>{t('customerRegistration.form.taxOffice.notFound')}</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{t('customerRegistration.form.taxOffice.helper')}</FormHelperText>
                  </FormControl>
                </>
              )}
            </Box>
          )}

          {/* Döviz Alım Ortamı Seçimi - Formdan kaldırıldı, varsayılan olarak 0 değeri gönderiliyor */}

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
