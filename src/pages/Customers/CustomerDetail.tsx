import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  Container,
  Snackbar,
  SelectChangeEvent,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Save as SaveIcon, 
  Edit as EditIcon,
  Phone as PhoneIcon,
  Smartphone as SmartphoneIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
  Link as LinkIcon
} from '@mui/icons-material';

import { useCustomerDetail } from '../../hooks/useCustomerDetail';
import useCustomerCreate from '../../hooks/useCustomerCreate';
import useCustomerUpdate from '../../hooks/useCustomerUpdate';
import { useCustomerAddresses } from '../../hooks/useCustomerAddresses';
import { useCustomerCommunications } from '../../hooks/useCustomerCommunications';
import { useCustomerContacts } from '../../hooks/useCustomerContacts';
import { useAddressTypes } from '../../hooks/useAddressTypes';
import { useTaxOffices, useTaxOfficesByCity } from '../../hooks/useTaxOffices';
import { customerApi } from '../../services/api';

interface CustomerDetailProps {
  isNew?: boolean;
  isEdit?: boolean;
  tab?: string;
  customerCodeOverride?: string;
}

// Form veri modeli
interface CustomerFormData {
  customerCode: string;
  customerName: string;
  customerTypeCode: number; // 1: Bireysel, 2: Kurumsal
  taxNumber: string;
  taxOffice: string;
  taxOfficeCode: string;
  addresses: CustomerAddress[];
  communications: CustomerCommunication[];
  contacts: CustomerContact[];
  // Yeni eklenen alanlar
  creditLimit: number;
  paymentTerm: number;
  isRealPerson: boolean; // Gerçek Kişilik (Şahıs)
  officeCode: string;
  accountCode: string;
  dataLanguageCode: string;
  currencyCode: string;
  eInvoiceEnabled: boolean;
  eInvoiceStartDate: string;
  eArchiveEnabled: boolean;
  eArchiveStartDate: string;
  campaignGroup: string;
  paymentPlanGroup: string;
  accountDiscountGroup: string;
  retailPriceGroup: string;
  wholesalePriceGroup: string;
  markupGroup: string;
  customerStoreGroup: string;
  bankCode: string;
  isVIP: boolean;
  requiresCustomerOrderNumber: boolean;
  balance: number;
  debit: number;
  credit: number;
  openRisk: number;
  totalRisk: number;
  workPhone?: string;
  mobilePhone?: string;
  homePhone?: string;
  email?: string;
  identityNum?: string;
  birthDate?: string;
  [key: string]: any; // İndeks imzası, dinamik alan erişimi için
}

interface CustomerAddress {
  customerCode: string;
  addressTypeCode: string;
  address: string;
  cityCode?: string;
  districtCode?: string;
  addressID: string;
  isDefault?: boolean;
  isBlocked?: boolean;
  [key: string]: any;
}

interface CustomerCommunication {
  customerCode: string;
  communicationTypeCode: string;
  communication: string;
  commAddress?: string;
  isDefault?: boolean;
  isBlocked?: boolean;
  [key: string]: any;
}

interface CustomerContact {
  customerCode: string;
  contactTypeCode: string;
  firstName: string;
  lastName: string;
  isAuthorized?: boolean;
  isDefault?: boolean;
  isBlocked?: boolean;
  contact?: string;
  [key: string]: any;
}

// Müşteri ekleme/düzenleme sayfası
const CustomerDetail: React.FC<CustomerDetailProps> = ({ isNew = false, isEdit = false, tab, customerCodeOverride }) => {
  const { customerCode } = useParams<{ customerCode: string }>();
  const navigate = useNavigate();
  
  // Fetch address types
  const { addressTypes: addressTypesData, isLoading: isLoadingAddressTypes } = useAddressTypes();
  
  // Form durumu
  const [formData, setFormData] = useState<CustomerFormData>({
    customerCode: "",
    customerName: "",
    customerTypeCode: 1, // 1: Bireysel, 2: Kurumsal
    taxNumber: "",
    taxOffice: "",
    taxOfficeCode: "",
    addresses: [],
    communications: [],
    contacts: [],
    // Yeni eklenen alanlar
    creditLimit: 0,
    paymentTerm: 0,
    isRealPerson: true, // Gerçek Kişilik (Şahıs)
    officeCode: "",
    accountCode: "",
    dataLanguageCode: "TR",
    currencyCode: "TRY",
    eInvoiceEnabled: false,
    eInvoiceStartDate: "",
    eArchiveEnabled: false,
    eArchiveStartDate: "",
    campaignGroup: "",
    paymentPlanGroup: "",
    accountDiscountGroup: "",
    retailPriceGroup: "",
    wholesalePriceGroup: "",
    markupGroup: "",
    customerStoreGroup: "",
    bankCode: "",
    isVIP: false,
    requiresCustomerOrderNumber: false,
    balance: 0,
    debit: 0,
    credit: 0,
    openRisk: 0,
    totalRisk: 0,
    workPhone: '',
    mobilePhone: '',
    homePhone: '',
    email: '',
    identityNum: '',
    birthDate: ''
  });
  
  // Yeni adres verisi için state
  const [newAddressData, setNewAddressData] = useState<{
    address: string;
    cityCode: string;
    districtCode: string;
    addressTypeCode: string;
    regionCode?: string;
    postalCode?: string;
  }>({
    address: "",
    cityCode: "",
    districtCode: "",
    addressTypeCode: "",
    postalCode: ""
  });
  
  // Bölge, şehir ve ilçe verileri için state'ler
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Vergi daireleri
  const { data: taxOfficesData, isLoading: isLoadingTaxOffices } = useTaxOffices();
  const { data: cityTaxOffices } = useTaxOfficesByCity(selectedCity, null, 'TR', !!selectedCity);

  // Vergi daireleri yüklendiğinde konsola yazdır
  useEffect(() => {
    console.log('CustomerDetail: Vergi daireleri yüklendi mi?', !isLoadingTaxOffices);
    console.log('CustomerDetail: Vergi daireleri veri sayısı:', taxOfficesData?.length || 0);
    if (taxOfficesData && taxOfficesData.length > 0) {
      console.log('CustomerDetail: İlk 3 vergi dairesi:', JSON.stringify(taxOfficesData.slice(0, 3)));
    }
  }, [taxOfficesData, isLoadingTaxOffices]);

  // Doğrulama ve UI durumu
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    type: 'info'
  });
  
  // Geçici link ve QR kod state'i
  const [tempLink, setTempLink] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [linkExpiryTime, setLinkExpiryTime] = useState<Date | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Adım takibi için state
  const [activeStep, setActiveStep] = useState<number>(0);

  // Müşteri kodu işleme
  const effectiveCustomerCode = customerCodeOverride || customerCode || '';
  const sanitizedCustomerCode = effectiveCustomerCode ? decodeURIComponent(effectiveCustomerCode.split('/')[0]) : undefined;
  
  // Tab değişkenini belirle
  const pathParts = effectiveCustomerCode ? effectiveCustomerCode.split('/') : [];
  const activeTab = pathParts.length > 1 ? pathParts[1] : (tab || 'customer');
  console.log('Active tab:', activeTab, 'Path parts:', pathParts);
  
  // Customer create/update hooks
  const { mutateAsync: createCustomer, isPending: isCreating } = useCustomerCreate();
  const { mutateAsync: updateCustomer, isPending: isUpdating } = useCustomerUpdate();
  
  // Mevcut müşteri detaylarını getir (düzenleme modunda)
  const { data: customer, refetch } = useCustomerDetail({
    customerCode: !isNew ? sanitizedCustomerCode : undefined
  });

  // Customer addresses
  const { data: customerAddresses, isLoading: isLoadingCustomerAddresses } = useCustomerAddresses({
    customerCode: !isNew ? sanitizedCustomerCode : undefined
  });

  // Customer communications
  const { data: customerCommunications, isLoading: isLoadingCustomerCommunications } = useCustomerCommunications({
    customerCode: !isNew ? sanitizedCustomerCode : undefined
  });

  // Customer contacts
  const { data: customerContacts, isLoading: isLoadingCustomerContacts } = useCustomerContacts({
    customerCode: !isNew ? sanitizedCustomerCode : undefined
  });

  useEffect(() => {
    if (!isNew && customer) {
      console.log('Müşteri verileri forma dolduruluyor:', customer);
      
      // Konsola json formatında tüm alanları ve değerlerini logla
      console.log('Customer details:\n' + JSON.stringify(customer, null, 2));
      
      // API yanıtını daha detaylı loglayalım ve eksik bilgileri görelim
      console.log('Customer type code:', customer.customerTypeCode, typeof customer.customerTypeCode);
      console.log('Is real person check:', customer.isRealPerson, typeof customer.isRealPerson);
      console.log('Tax office:', customer.taxOffice, typeof customer.taxOffice);
      console.log('Tax office code:', customer.taxOfficeCode, typeof customer.taxOfficeCode);
      console.log('Identity number:', customer.identityNum, typeof customer.identityNum);
      
      // İletişim bilgilerini bul
      let workPhone = '';
      let mobilePhone = '';
      let homePhone = '';
      let email = '';
      
      if (Array.isArray(customer.communications) && customer.communications.length > 0) {
        // İletişim tiplerini kontrol et
        customer.communications.forEach((comm: CustomerCommunication) => {
          // İletişim tipi kodlarına göre sınıflandır
          // Tipik olarak: 1=İş Telefonu, 2=Cep Telefonu, 3=E-posta, 4=Ev Telefonu
          if (comm.communicationTypeCode === '1' || comm.communicationTypeCode === 'ISTEL') {
            workPhone = comm.communication || comm.commAddress || '';
          } else if (comm.communicationTypeCode === '2' || comm.communicationTypeCode === 'CEPTEL') {
            mobilePhone = comm.communication || comm.commAddress || '';
          } else if (comm.communicationTypeCode === '4' || comm.communicationTypeCode === 'EVTEL') {
            homePhone = comm.communication || comm.commAddress || '';
          } else if (comm.communicationTypeCode === '3' || 
                    comm.communicationTypeCode === 'EMAIL' || 
                    (comm.commAddress && comm.commAddress.includes('@'))) {
            email = comm.communication || comm.commAddress || '';
          }
        });
      }
      
      // Gerçek kişi kontrolü - API'den gelen değeri veya customerTypeCode'a göre belirle
      // customerTypeCode 1 ise veya isRealPerson true ise gerçek kişi
      // Ayrıca müşteri kodu A ile başlıyorsa (örn. A008) genellikle gerçek kişidir
      const isRealPerson = 
        customer.isRealPerson === true || 
        customer.customerTypeCode === 1 || 
        customer.customerTypeCode === '1' ||
        (customer.customerCode && customer.customerCode.startsWith('A'));
      
      console.log('Calculated isRealPerson:', isRealPerson);
      
      // Bölge ve şehir bilgilerini ayarla
      if (customer.regionCode) {
        setSelectedRegion(customer.regionCode);
        // Şehirleri yükle
        customerApi.getCitiesByRegion(customer.regionCode)
          .then(citiesData => {
            setCities(citiesData);
            
            // Eğer müşterinin şehir kodu varsa, ilçeleri yükle
            if (customer.cityCode) {
              setSelectedCity(customer.cityCode);
              customerApi.getDistrictsByCity(customer.cityCode)
                .then(districtsData => {
                  setDistricts(districtsData);
                })
                .catch(error => {
                  console.error('İlçeler yüklenirken hata:', error);
                });
            }
          })
          .catch(error => {
            console.error('Şehirler yüklenirken hata:', error);
          });
      }
      
      // Form verilerini güvenli bir şekilde ayarla
      const updatedFormData: CustomerFormData = {
        customerCode: customer.customerCode || '',
        customerName: customer.customerName || '',
        customerTypeCode: customer.customerTypeCode ? Number(customer.customerTypeCode) : (isRealPerson ? 1 : 2),
        taxNumber: customer.taxNumber || '',
        // Vergi dairesi bilgilerini API'den al veya varsayılan değerler kullan
        taxOffice: customer.taxOffice || (customer.taxOfficeDescription || ''),
        taxOfficeCode: customer.taxOfficeCode || '',
        addresses: customer.addresses || [],
        communications: customer.communications || [],
        contacts: customer.contacts || [],
        creditLimit: customer.creditLimit || 0,
        paymentTerm: customer.paymentTerm || 0,
        isRealPerson: isRealPerson,
        officeCode: customer.officeCode || '',
        accountCode: customer.accountCode || '',
        dataLanguageCode: customer.dataLanguageCode || 'TR',
        currencyCode: customer.currencyCode || 'TRY',
        eInvoiceEnabled: Boolean(customer.eInvoiceEnabled),
        eInvoiceStartDate: customer.eInvoiceStartDate || '',
        eArchiveEnabled: Boolean(customer.eArchiveEnabled),
        eArchiveStartDate: customer.eArchiveStartDate || '',
        campaignGroup: customer.campaignGroup || '',
        paymentPlanGroup: customer.paymentPlanGroup || '',
        accountDiscountGroup: customer.accountDiscountGroup || '',
        retailPriceGroup: customer.retailPriceGroup || '',
        wholesalePriceGroup: customer.wholesalePriceGroup || '',
        markupGroup: customer.markupGroup || '',
        customerStoreGroup: customer.customerStoreGroup || '',
        bankCode: customer.bankCode || '',
        isVIP: Boolean(customer.isVIP),
        requiresCustomerOrderNumber: Boolean(customer.requiresCustomerOrderNumber),
        balance: customer.balance || 0,
        debit: customer.debit || 0,
        credit: customer.credit || 0,
        openRisk: customer.openRisk || 0,
        totalRisk: customer.totalRisk || 0,
        workPhone: workPhone,
        mobilePhone: mobilePhone,
        homePhone: homePhone,
        email: email,
        identityNum: customer.identityNum || '',
        birthDate: customer.birthDate || ''
      };
      
      console.log('Updated form data:', updatedFormData);
      setFormData(updatedFormData);
      setIsLoading(false);
    }
  }, [isNew, customer]);
  
  // Ayrı API çağrılarından gelen adres, iletişim ve kişi bilgilerini forma ekle
  useEffect(() => {
    if (!isNew && customerAddresses && customerAddresses.length > 0) {
      console.log('Adding customer addresses to form:', customerAddresses);
      
      // Adres verilerini işle ve ilk adresin bölge ve şehir bilgilerini ayarla
      if (customerAddresses[0]) {
        const firstAddress = customerAddresses[0];
        
        // Bölge kodu varsa ayarla
        if (firstAddress.regionCode) {
          setSelectedRegion(firstAddress.regionCode);
        }
        
        // Şehir kodu varsa ayarla
        if (firstAddress.cityCode) {
          setSelectedCity(firstAddress.cityCode);
        }
        
        // İlçe kodu varsa yeni adres verisine ekle
        if (firstAddress.districtCode) {
          setNewAddressData(prev => ({
            ...prev,
            districtCode: firstAddress.districtCode
          }));
        }
      }
      
      setFormData((prev: CustomerFormData) => ({
        ...prev,
        addresses: customerAddresses
      }));
    }
  }, [customerAddresses, isNew]);

  useEffect(() => {
    if (!isNew && customerCommunications && customerCommunications.length > 0) {
      console.log('Adding customer communications to form:', customerCommunications);
      setFormData((prev: CustomerFormData) => ({
        ...prev,
        communications: customerCommunications
      }));
    }
  }, [customerCommunications, isNew]);

  useEffect(() => {
    if (!isNew && customerContacts && customerContacts.length > 0) {
      console.log('Adding customer contacts to form:', customerContacts);
      setFormData((prev: CustomerFormData) => ({
        ...prev,
        contacts: customerContacts
      }));
    }
  }, [customerContacts, isNew]);

  useEffect(() => {
    if (isNew) {
      console.log('Yeni müşteri formu hazırlanıyor...');
      
      // Yeni müşteri için varsayılan değerleri ayarla
      setFormData({
        customerCode: '',
        customerName: '',
        customerTypeCode: 2, // Varsayılan olarak kurumsal (2)
        taxNumber: '',
        taxOffice: '',
        taxOfficeCode: '',
        addresses: [],
        communications: [],
        contacts: [],
        creditLimit: 0,
        paymentTerm: 0,
        isRealPerson: false, // Varsayılan olarak kurumsal
        officeCode: 'MERKEZ',
        accountCode: '',
        dataLanguageCode: 'TR',
        currencyCode: 'TRY',
        eInvoiceEnabled: false,
        eInvoiceStartDate: '',
        eArchiveEnabled: false,
        eArchiveStartDate: '',
        campaignGroup: '',
        paymentPlanGroup: '',
        accountDiscountGroup: '',
        retailPriceGroup: '',
        wholesalePriceGroup: '',
        markupGroup: '',
        customerStoreGroup: '',
        bankCode: '',
        isVIP: false,
        requiresCustomerOrderNumber: false,
        balance: 0,
        debit: 0,
        credit: 0,
        openRisk: 0,
        totalRisk: 0,
        workPhone: '',
        mobilePhone: '',
        homePhone: '',
        email: '',
        identityNum: '',
        birthDate: ''
      });
    }
  }, [isNew]);
  
  // Bölgeleri yükle
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regionsData = await customerApi.getRegions();
        console.log('Bölgeler yüklendi:', regionsData);
        setRegions(regionsData);
      } catch (error) {
        console.error('Bölgeler yüklenirken hata:', error);
      }
    };
    
    loadRegions();
  }, []);
  
  // Bölge değiştiğinde şehirleri yükle
  useEffect(() => {
    if (selectedRegion) {
      const loadCities = async () => {
        try {
          const citiesData = await customerApi.getCitiesByRegion(selectedRegion);
          console.log('Şehirler yüklendi:', citiesData);
          
          // Şehir verilerini işle
          let processedCities: any[] = [];
          
          try {
            processedCities = citiesData.map((city: any) => {
              if (typeof city === 'string') {
                try {
                  return JSON.parse(city);
                } catch (e) {
                  return { cityCode: city, cityDescription: city };
                }
              }
              return city;
            });
            
            console.log('İşlenmiş şehirler:', processedCities);
          } catch (error) {
            console.error('Şehirleri işlerken hata:', error);
          }
          
          setCities(processedCities);
          
          // Eğer düzenleme modundaysa ve müşterinin şehir kodu varsa, o şehri seç
          if (isEdit && customer && customer.cityCode) {
            setSelectedCity(customer.cityCode);
            
            // İlçeleri yükle
            try {
              const districtsData = await customerApi.getDistrictsByCity(customer.cityCode);
              setDistricts(districtsData);
            } catch (error) {
              console.error('İlçeler yüklenirken hata:', error);
            }
          } else {
            setSelectedCity(''); // Şehir seçimini sıfırla
            setNewAddressData(prev => ({ ...prev, cityCode: '', districtCode: '' }));
            setDistricts([]); // İlçeleri sıfırla
          }
        } catch (error) {
          console.error('Şehirler yüklenirken hata:', error);
        }
      };
      
      loadCities();
    } else {
      setCities([]);
      setSelectedCity('');
      setNewAddressData(prev => ({ ...prev, cityCode: '', districtCode: '' }));
      setDistricts([]);
    }
  }, [selectedRegion, isEdit, customer]);

  // Şehir değiştiğinde ilçeleri yükle
  useEffect(() => {
    if (selectedCity) {
      const loadDistricts = async () => {
        try {
          const districtsData = await customerApi.getDistrictsByCity(selectedCity);
          console.log('İlçeler yüklendi:', districtsData);
          setDistricts(districtsData);
          setNewAddressData(prev => ({ ...prev, districtCode: '' }));
        } catch (error) {
          console.error('İlçeler yüklenirken hata:', error);
        }
      };
      
      loadDistricts();
    } else {
      setDistricts([]);
      setNewAddressData(prev => ({ ...prev, districtCode: '' }));
    }
  }, [selectedCity]);
  
  // Adres tiplerini yükle
  useEffect(() => {
    const loadAddressTypes = async () => {
      try {
        // useAddressTypes hook'u kullandığımız için burada tekrar yüklemeye gerek yok
        // const addressTypesData = await customerApi.getAddressTypes();
        // console.log('Adres tipleri yüklendi:', addressTypesData);
        // setAddressTypes(addressTypesData);
      } catch (error) {
        console.error('Adres tipleri yüklenirken hata:', error);
      }
    };
    
    // loadAddressTypes();
  }, []);
  
  // Bölge değişikliğini işle
  const handleRegionChange = (e: SelectChangeEvent) => {
    const regionCode = e.target.value;
    setSelectedRegion(regionCode);
    setNewAddressData({...newAddressData, regionCode});
  };
  
  // Şehir değişikliğini işle
  const handleCityChange = (e: SelectChangeEvent) => {
    const cityCode = e.target.value;
    setSelectedCity(cityCode);
    setNewAddressData({...newAddressData, cityCode});
  };
  
  // İlçe değişikliğini işle
  const handleDistrictChange = (e: SelectChangeEvent) => {
    const districtCode = e.target.value;
    setNewAddressData({...newAddressData, districtCode});
  };
  
  // Adres ekleme işlevi
  const handleAddAddress = () => {
    const newAddress: CustomerAddress = {
      customerCode: formData.customerCode,
      addressTypeCode: "1", // Varsayılan adres tipi
      address: "",
      cityCode: "",
      districtCode: "",
      buildingNum: "",
      floorNum: 0,
      doorNum: 0,
      quarterCode: 0,
      streetCode: 0,
      addressID: "00000000-0000-0000-0000-000000000000",
      drivingDirections: "",
      isDefault: true,
      isBlocked: false
    };
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      addresses: [...prev.addresses, newAddress]
    }));
  };
  
  // İletişim bilgisi ekleme işlevi
  const handleAddCommunication = () => {
    const newCommunication: CustomerCommunication = {
      customerCode: formData.customerCode,
      communicationTypeCode: "3", // Varsayılan iletişim tipi
      communication: "",
      isDefault: true,
      isBlocked: false
    };
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      communications: [...prev.communications, newCommunication]
    }));
  };
  
  // Kişi ekleme işlevi
  const handleAddContact = () => {
    const newContact: CustomerContact = {
      customerCode: formData.customerCode,
      contactTypeCode: "1", // Varsayılan kişi tipi
      firstName: "",
      lastName: "",
      isAuthorized: true,
      isDefault: true,
      isBlocked: false
    };
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }));
  };
  
  // Adres güncelleme işlevi
  const handleUpdateAddress = (index: number, field: string, value: any) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses[index] = {
      ...updatedAddresses[index],
      [field]: value
    };
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      addresses: updatedAddresses
    }));
  };
  
  // İletişim bilgisi güncelleme işlevi
  const handleUpdateCommunication = (index: number, field: string, value: any) => {
    const updatedCommunications = [...formData.communications];
    updatedCommunications[index] = {
      ...updatedCommunications[index],
      [field]: value
    };
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      communications: updatedCommunications
    }));
  };
  
  // Kişi güncelleme işlevi
  const handleUpdateContact = (index: number, field: string, value: any) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      contacts: updatedContacts
    }));
  };
  
  // Adres silme işlevi
  const handleRemoveAddress = (index: number) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses.splice(index, 1);
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      addresses: updatedAddresses
    }));
  };
  
  // İletişim bilgisi silme işlevi
  const handleRemoveCommunication = (index: number) => {
    const updatedCommunications = [...formData.communications];
    updatedCommunications.splice(index, 1);
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      communications: updatedCommunications
    }));
  };
  
  // Kişi silme işlevi
  const handleRemoveContact = (index: number) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.splice(index, 1);
    
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      contacts: updatedContacts
    }));
  };

  // Input değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CustomerFormData) => ({
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
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev: CustomerFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  // Gerçek Kişi (Şahıs) checkbox değişikliğini işle
  const handleRealPersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    console.log('Gerçek Kişi (Şahıs) checkbox changed to:', value);
    
    setFormData(prev => ({
      ...prev,
      isRealPerson: value,
      customerTypeCode: value ? 1 : 2,
      // Gerçek kişi seçildiğinde vergi alanlarını temizle
      ...(value ? { 
        taxNumber: '', 
        taxOffice: '', 
        taxOfficeCode: '' 
      } : {})
    }));
  };

  // İletişim bilgisi değişikliğini işle
  const handleContactChange = (value: string) => {
    setFormData((prev: CustomerFormData) => ({
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
    setFormData((prev: CustomerFormData) => ({
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
    
    // Yeni müşteri eklerken müşteri kodu zorunlu değilse aşağıdaki kontrolü yapma
    if (!isNew && !formData.customerCode) {
      newErrors.customerCode = 'Müşteri kodu gereklidir';
    }
    
    if (!formData.customerName) {
      newErrors.customerName = 'Müşteri adı gereklidir';
    }
    
    // Gerçek kişi ise TC Kimlik No zorunlu
    if (formData.isRealPerson && !formData.identityNum) {
      newErrors.identityNum = 'TC Kimlik No zorunludur';
    }
    
    // Kurumsal ise vergi bilgileri zorunlu
    if (!formData.isRealPerson) {
      if (!formData.taxNumber) {
        newErrors.taxNumber = 'Vergi numarası zorunludur';
      }
      if (!formData.taxOfficeCode || formData.taxOfficeCode.trim() === '') {
        newErrors.taxOfficeCode = 'Vergi dairesi zorunludur';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Geçici müşteri kayıt linki oluşturma
  const handleCreateTempLink = async () => {
    try {
      setIsLoading(true);
      
      // API'ye istek gönder - ortam değişkeni kullanarak
      const response = await fetch(`${API_BASE_URL}/api/v1/Customer/create-temp-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customerCode: formData.customerCode,
          expiryMinutes: 10 // 10 dakika geçerli
        })
      });
      
      if (!response.ok) {
        throw new Error('Geçici link oluşturulurken bir hata oluştu');
      }
      
      const data = await response.json();
      
      // Gelen veriyi state'e kaydet
      setTempLink(data.tempLink);
      
      // QR kod URL'sini localhost yerine gerçek domain ile değiştir
      const qrCodeUrlFixed = data.qrCodeUrl.replace('http://localhost:3000', 'https://edikirovat.tr');
      console.log('Orijinal QR URL:', data.qrCodeUrl);
      console.log('Düzeltilmiş QR URL:', qrCodeUrlFixed);
      
      setQrCodeUrl(qrCodeUrlFixed);
      setShowQrCode(true);
      
      // Bitiş zamanını hesapla ve kaydet
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10);
      setLinkExpiryTime(expiryTime);
      setRemainingTime(10 * 60); // 10 dakika = 600 saniye
      
      // QR kod modalını aç
      setQrDialogOpen(true);
      
      // Geri sayım timer'ı başlat
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setNotification({
        open: true,
        message: 'Geçici müşteri kayıt linki oluşturuldu!',
        type: 'success'
      });
    } catch (error) {
      console.error('Geçici link oluşturma hatası:', error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Geçici link oluşturulurken bir hata oluştu',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kalan süreyi formatla (dakika:saniye)
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // QR kod modalını kapat
  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
  };
  
  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form gönderimi başlatıldı');
    
    // Form doğrulama
    const validationErrors: Record<string, string> = {};
    
    if (!formData.customerCode.trim()) {
      validationErrors.customerCode = 'Müşteri kodu zorunludur';
    }
    
    if (!formData.customerName.trim()) {
      validationErrors.customerName = 'Müşteri adı zorunludur';
    }
    
    // Gerçek kişi ise kimlik bilgileri zorunlu
    if (formData.isRealPerson && !formData.identityNum) {
      validationErrors.identityNum = 'TC Kimlik No zorunludur';
    }
    
    // Kurumsal ise vergi bilgileri zorunlu
    if (!formData.isRealPerson) {
      if (!formData.taxNumber) {
        validationErrors.taxNumber = 'Vergi numarası zorunludur';
      }
      if (!formData.taxOfficeCode || formData.taxOfficeCode.trim() === '') {
        validationErrors.taxOfficeCode = 'Vergi dairesi zorunludur';
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('Form doğrulama hataları:', validationErrors);
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    console.log('Form doğrulama başarılı, gönderim hazırlanıyor...');
    
    try {
      // İletişim bilgilerini hazırla
      const communications: CustomerCommunication[] = [];
      
      if (formData.workPhone) {
        communications.push({
          customerCode: formData.customerCode,
          communicationTypeCode: '1', // İş Telefonu
          communication: formData.workPhone,
          isDefault: true
        });
      }
      
      if (formData.mobilePhone) {
        communications.push({
          customerCode: formData.customerCode,
          communicationTypeCode: '2', // Cep Telefonu
          communication: formData.mobilePhone,
          isDefault: false
        });
      }
      
      if (formData.homePhone) {
        communications.push({
          customerCode: formData.customerCode,
          communicationTypeCode: '4', // Ev Telefonu
          communication: formData.homePhone,
          isDefault: false
        });
      }
      
      if (formData.email) {
        communications.push({
          customerCode: formData.customerCode,
          communicationTypeCode: '3', // E-posta
          communication: formData.email,
          isDefault: true
        });
      }
      
      // Adres bilgilerini hazırla
      const addresses: CustomerAddress[] = [];
      
      if (isNew && newAddressData.address) {
        addresses.push({
          customerCode: formData.customerCode,
          addressTypeCode: newAddressData.addressTypeCode || 'MERKEZ',
          address: newAddressData.address,
          cityCode: newAddressData.cityCode,
          districtCode: newAddressData.districtCode,
          addressID: crypto.randomUUID ? crypto.randomUUID() : 'new-address-' + Date.now(), // Benzersiz ID oluştur
          isDefault: true,
          postalCode: newAddressData.postalCode
        });
      } else if (formData.addresses && formData.addresses.length > 0) {
        addresses.push(...formData.addresses);
      }
      
      // API'nin beklediği formatta müşteri verilerini hazırla
      const customerData = {
        customerCode: formData.customerCode,
        customerName: formData.customerName,
        customerSurname: formData.isRealPerson ? "" : "",  // Gerçek kişi için soyad ayrıştırılabilir
        customerTypeCode: formData.customerTypeCode || 3, // Default 3 (Müşteri)
        isIndividualAcc: formData.isRealPerson || false,
        customerIdentityNumber: formData.identityNum || "",
        taxNumber: formData.taxNumber || "",
        taxOfficeCode: formData.taxOfficeCode || "", // taxOffice yerine taxOfficeCode kullanılmalı
        currencyCode: formData.currencyCode || "TRY",
        officeCode: formData.officeCode || "M",
        creditLimit: formData.creditLimit || 0,
        riskLimit: 0,
        regionCode: newAddressData.regionCode || "",
        cityCode: newAddressData.cityCode || "",
        districtCode: newAddressData.districtCode || "",
        isBlocked: false,
        communications: communications.map(comm => ({
          communicationTypeCode: comm.communicationTypeCode || "",
          communication: comm.communication || "",
          isDefault: comm.isDefault === undefined ? false : comm.isDefault
        })),
        addresses: addresses.map(address => ({
          addressTypeCode: address.addressTypeCode || "HOME",
          address: address.address || "",
          countryCode: "TR", // Varsayılan olarak Türkiye
          stateCode: "",
          cityCode: address.cityCode || "",
          districtCode: address.districtCode || "",
          postalCode: "",
          isDefault: address.isDefault || false,
          isBlocked: address.isBlocked || false
        })),
        contacts: formData.contacts ? formData.contacts.map(contact => ({
          contactTypeCode: contact.contactTypeCode || "",
          contact: contact.contact || "",
          isDefault: contact.isDefault || false
        })) : [],
        createdUserName: "SYSTEM",
        lastUpdatedUserName: "SYSTEM",
        companyCode: "1"
      };
      
      console.log('Gönderilecek müşteri verileri:', JSON.stringify(customerData, null, 2));
      
      if (isNew) {
        // Yeni müşteri oluştur
        console.log('Yeni müşteri oluşturuluyor...');
        await createCustomer(customerData);
        
        setNotification({
          open: true,
          message: 'Müşteri başarıyla oluşturuldu!',
          type: 'success'
        });
        
        // Yeni müşteri oluşturulduktan sonra müşteri listesine dön
        navigate('/customers');
      } else if (isEdit) {
        // Mevcut müşteriyi güncelle
        console.log('Müşteri güncelleniyor...');
        await updateCustomer(customerData);
        
        setNotification({
          open: true,
          message: 'Müşteri başarıyla güncellendi',
          type: 'success'
        });
        
        // Bir sonraki adıma geç (maksimum 3)
        const nextStep = Math.min(activeStep + 1, 3);
        setActiveStep(nextStep);
      }
    } catch (error: any) {
      console.error('Müşteri kaydetme hatası:', error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Müşteri kaydedilirken bir hata oluştu',
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

  // Sayfa başlığını belirle
  const pageTitle = isNew ? "Yeni Müşteri" : isEdit ? "Müşteri Düzenle" : "Müşteri Detayı";

  // Sekme navigasyonu için kullanılacak
  // const activeTab = tab || "customer";
  
  // Yeni müşteri ekleme durumunda isLoading kontrolünü atlayalım
  if (!isNew && isLoading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  // Yeni müşteri ekleme durumunda error kontrolünü atlayalım
  if (!isNew && error) {
    return <div className="p-4">Hata: {(error as Error).message}</div>;
  }

  // Temel Bilgiler Formu
  const renderBasicInfoForm = () => (
    <Box component="form" noValidate sx={{ mt: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField
          required
          fullWidth
          id="customerCode"
          label="Müşteri Kodu"
          name="customerCode"
          value={formData.customerCode}
          onChange={handleInputChange}
          disabled={!isNew} // Düzenleme modunda müşteri kodu değiştirilemez
        />
        <TextField
          required
          fullWidth
          id="customerName"
          label="Müşteri Adı"
          name="customerName"
          value={formData.customerName}
          onChange={handleInputChange}
        />
        <TextField
          fullWidth
          id="taxNumber"
          label="Vergi Numarası"
          name="taxNumber"
          value={formData.taxNumber}
          onChange={handleInputChange}
        />
        <FormControl fullWidth>
          <InputLabel id="taxOffice-label">Vergi Dairesi</InputLabel>
          <Select
            labelId="taxOffice-label"
            id="taxOfficeCode"
            name="taxOfficeCode"
            value={formData.taxOfficeCode || ''}
            onChange={(e) => {
              setFormData({
                ...formData,
                taxOfficeCode: e.target.value
              });
            }}
            label="Vergi Dairesi"
          >
            <MenuItem value="">
              <em>Seçiniz</em>
            </MenuItem>
            {taxOfficesData && taxOfficesData.map((office: any) => (
              <MenuItem key={office.code} value={office.code}>
                {office.description || office.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isRealPerson}
              onChange={handleRealPersonChange}
              name="isRealPerson"
            />
          }
          label="Gerçek Kişi"
        />
        <TextField
          fullWidth
          id="identityNum"
          label="TC Kimlik No"
          name="identityNum"
          value={formData.identityNum}
          onChange={handleInputChange}
        />
      </Box>
    </Box>
  );

  // İletişim Bilgileri Formu
  const renderCommunicationForm = () => (
    <Box component="form" noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        İletişim Bilgileri
      </Typography>
      
      {formData.communications.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>İletişim Tipi</TableCell>
                <TableCell>İletişim Bilgisi</TableCell>
                <TableCell>Varsayılan</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.communications.map((comm, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <FormControl fullWidth>
                      <Select
                        value={comm.communicationTypeCode}
                        onChange={(e) => handleUpdateCommunication(index, 'communicationTypeCode', e.target.value)}
                      >
                        <MenuItem key="PHONE" value="PHONE">Telefon</MenuItem>
                        <MenuItem key="EMAIL" value="EMAIL">E-posta</MenuItem>
                        <MenuItem key="MOBILE" value="MOBILE">Cep Telefonu</MenuItem>
                        <MenuItem key="FAX" value="FAX">Faks</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={comm.communication || comm.commAddress || ''}
                      onChange={(e) => handleUpdateCommunication(index, 'communication', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={comm.isDefault || false}
                      onChange={(e) => handleUpdateCommunication(index, 'isDefault', e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => handleRemoveCommunication(index)}
                    >
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
          Henüz iletişim bilgisi eklenmemiş.
        </Typography>
      )}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleAddCommunication}
        sx={{ mt: 2 }}
      >
        İletişim Bilgisi Ekle
      </Button>
    </Box>
  );

  // Adres Bilgileri Formu
  const renderAddressForm = () => (
    <Box component="form" noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        Adres Bilgileri
      </Typography>
      
      {formData.addresses.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Adres Tipi</TableCell>
                <TableCell>Adres</TableCell>
                <TableCell>Ülke/Bölge/Şehir/İlçe</TableCell>
                <TableCell>Varsayılan</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.addresses.map((address, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <FormControl fullWidth>
                      <Select
                        value={address.addressTypeCode}
                        onChange={(e) => handleUpdateAddress(index, 'addressTypeCode', e.target.value)}
                      >
                        <MenuItem key="WORK" value="WORK">İş Adresi</MenuItem>
                        <MenuItem key="HOME" value="HOME">Ev Adresi</MenuItem>
                        <MenuItem key="SHIPPING" value="SHIPPING">Sevkiyat Adresi</MenuItem>
                        <MenuItem key="BILLING" value="BILLING">Fatura Adresi</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={address.address || ''}
                      onChange={(e) => handleUpdateAddress(index, 'address', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Ülke</InputLabel>
                        <Select
                          value="TR" // Şimdilik sabit Türkiye
                          label="Ülke"
                          disabled
                        >
                          <MenuItem key="TR" value="TR">Türkiye</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth size="small">
                        <InputLabel>Bölge</InputLabel>
                        <Select
                          value={address.regionCode || ''}
                          onChange={(e) => {
                            handleUpdateAddress(index, 'regionCode', e.target.value);
                            handleRegionChange(e);
                          }}
                          label="Bölge"
                        >
                          <MenuItem value="">
                            <em>Seçiniz</em>
                          </MenuItem>
                          {regions.map((region: any) => (
                            <MenuItem key={region.code} value={region.code}>
                              {region.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth size="small">
                        <InputLabel>Şehir</InputLabel>
                        <Select
                          value={address.cityCode || ''}
                          onChange={(e) => {
                            handleUpdateAddress(index, 'cityCode', e.target.value);
                            handleCityChange(e);
                          }}
                          label="Şehir"
                        >
                          <MenuItem value="">
                            <em>Seçiniz</em>
                          </MenuItem>
                          {cities.map((city: any) => (
                            <MenuItem key={city.code} value={city.code}>
                              {city.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth size="small">
                        <InputLabel>İlçe</InputLabel>
                        <Select
                          value={address.districtCode || ''}
                          onChange={(e) => {
                            handleUpdateAddress(index, 'districtCode', e.target.value);
                            handleDistrictChange(e);
                          }}
                          label="İlçe"
                        >
                          <MenuItem value="">
                            <em>Seçiniz</em>
                          </MenuItem>
                          {districts.map((district: any) => (
                            <MenuItem key={district.code} value={district.code}>
                              {district.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={address.isDefault || false}
                      onChange={(e) => handleUpdateAddress(index, 'isDefault', e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => handleRemoveAddress(index)}
                    >
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
          Henüz adres bilgisi eklenmemiş.
        </Typography>
      )}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleAddAddress}
        sx={{ mt: 2 }}
      >
        Adres Bilgisi Ekle
      </Button>
    </Box>
  );

  // Kişi Bilgileri Formu
  const renderContactForm = () => (
    <Box component="form" noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        Kişi Bilgileri
      </Typography>
      
      {formData.contacts.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kişi Tipi</TableCell>
                <TableCell>Ad</TableCell>
                <TableCell>Soyad</TableCell>
                <TableCell>Unvan</TableCell>
                <TableCell>Varsayılan</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.contacts.map((contact, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <FormControl fullWidth>
                      <Select
                        value={contact.contactTypeCode}
                        onChange={(e) => handleUpdateContact(index, 'contactTypeCode', e.target.value)}
                      >
                        <MenuItem key="PRIMARY" value="PRIMARY">Birincil Kişi</MenuItem>
                        <MenuItem key="SECONDARY" value="SECONDARY">İkincil Kişi</MenuItem>
                        <MenuItem key="AUTHORIZED" value="AUTHORIZED">Yetkili Kişi</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={contact.firstName || ''}
                      onChange={(e) => handleUpdateContact(index, 'firstName', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={contact.lastName || ''}
                      onChange={(e) => handleUpdateContact(index, 'lastName', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={contact.isDefault || false}
                      onChange={(e) => handleUpdateContact(index, 'isDefault', e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => handleRemoveContact(index)}
                    >
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
          Henüz kişi bilgisi eklenmemiş.
        </Typography>
      )}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleAddContact}
        sx={{ mt: 2 }}
      >
        Kişi Bilgisi Ekle
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={goBack} 
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Geri
            </Button>
            <Typography variant="h5">{pageTitle}</Typography>
          </Box>
          
          {!isNew && !isEdit && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate(`/customers/${effectiveCustomerCode}/edit`)}
                startIcon={<EditIcon />}
              >
                Düzenle
              </Button>
            </Box>
          )}
        </Box>

        {/* Adım göstergesi */}
        {(isNew || isEdit) && (
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep}>
              <Step key="temel">
                <StepLabel>Temel Bilgiler</StepLabel>
              </Step>
              <Step key="iletisim">
                <StepLabel>İletişim Bilgileri</StepLabel>
              </Step>
              <Step key="adres">
                <StepLabel>Adres Bilgileri</StepLabel>
              </Step>
              <Step key="finansal">
                <StepLabel>Finansal Bilgiler</StepLabel>
              </Step>
            </Stepper>
          </Box>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            <Typography variant="subtitle1">Hata</Typography>
            <Typography variant="body2">
              {error instanceof Error ? error.message : 'Müşteri bilgileri alınırken bir hata oluştu'}
            </Typography>
          </Alert>
        )}

        {/* API error message */}
        {errors.form && (
          <Alert severity="error" sx={{ my: 2 }}>
            <Typography variant="subtitle1">Veritabanı Hatası</Typography>
            <Typography variant="body2">{errors.form}</Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                color="primary" 
                onClick={goBack} 
                startIcon={<ArrowBackIcon />}
              >
                Müşteri Listesine Dön
              </Button>
            </Box>
          </Alert>
        )}

        {!isNew && !isEdit && (
          <div className="mb-4">
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => {
                navigate(`/customers/${effectiveCustomerCode}/${newValue === "customer" ? "" : newValue}`);
              }}
            >
              <Tab value="customer" label="Genel" />
              <Tab value="addresses" label="Adresler" />
              <Tab value="contacts" label="Kişiler" />
              <Tab value="emails" label="E-Postalar" />
            </Tabs>

            {activeTab === "customer" && renderBasicInfoForm()}
            {activeTab === "addresses" && renderAddressForm()}
            {activeTab === "contacts" && renderContactForm()}
            {activeTab === "emails" && renderCommunicationForm()}
          </div>
        )}

        {/* Yeni müşteri ekleme veya düzenleme formu */}
        {(isNew || isEdit) && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {renderBasicInfoForm()}
            {renderCommunicationForm()}
            {renderAddressForm()}
            {renderContactForm()}
          </Box>
        )}
        
        {/* Müşteri detay görünümü */}
        {!isNew && !isEdit && !isLoading && customer && (
          <>
            {/* Adres formu */}
            {activeTab === "addresses" && showAddressForm && renderAddressForm()}
            
            {/* Adres ekleme butonu */}
            {activeTab === "addresses" && !showAddressForm && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setShowAddressForm(true)}
                sx={{ mt: 2 }}
              >
                Yeni Adres Ekle
              </Button>
            )}
            

            
            <Snackbar 
              open={notification.open} 
              autoHideDuration={6000} 
              onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            >
              <Alert severity={notification.type} sx={{ width: '100%' }}>
                {notification.message}
              </Alert>
            </Snackbar>
            
            {/* QR Kod Modal */}
            <Dialog
              open={qrDialogOpen}
              onClose={handleCloseQrDialog}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Geçici Müşteri Kayıt Linki</DialogTitle>
              <DialogContent>
                {qrCodeUrl && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Aşağıdaki QR kodu taratarak veya linki kullanarak geçici müşteri kayıt formuna ulaşabilirsiniz.
                    </Typography>
                    
                    <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1, mb: 2 }}>
                      <img src={qrCodeUrl} alt="QR Kod" style={{ width: '100%', maxWidth: '250px' }} />
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Kayıt Linki"
                      value={tempLink}
                      InputProps={{
                        readOnly: true,
                      }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        navigator.clipboard.writeText(tempLink);
                        setNotification({
                          open: true,
                          message: 'Link panoya kopyalandı!',
                          type: 'success'
                        });
                      }}
                    >
                      Linki Kopyala
                    </Button>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      Bu link {formatRemainingTime()} dakika daha geçerlidir.
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseQrDialog} color="primary">
                  Kapat
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Paper>

    </Container>
  );
};

export default CustomerDetail; 