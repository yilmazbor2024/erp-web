import React, { useEffect, useState } from 'react';
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
  FormHelperText
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Save as SaveIcon, 
  Edit as EditIcon,
  Phone as PhoneIcon,
  Smartphone as SmartphoneIcon,
  Home as HomeIcon,
  Email as EmailIcon
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
  buildingNum?: string;
  floorNum?: number;
  doorNum?: number;
  quarterCode?: number;
  streetCode?: number;
  addressID: string;
  drivingDirections?: string;
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
  titleCode?: string;
  jobTitleCode?: string;
  identityNum?: string;
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
  const { data: cityTaxOffices } = useTaxOfficesByCity(selectedCity, 'TR', !!selectedCity);

  // Doğrulama ve UI durumu
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
            workPhone = comm.communication || '';
          } else if (comm.communicationTypeCode === '2' || comm.communicationTypeCode === 'CEPTEL') {
            mobilePhone = comm.communication || '';
          } else if (comm.communicationTypeCode === '4' || comm.communicationTypeCode === 'EVTEL') {
            homePhone = comm.communication || '';
          } else if (comm.communicationTypeCode === '3' || 
                    comm.communicationTypeCode === 'EMAIL' || 
                    (comm.commAddress && comm.commAddress.includes('@'))) {
            email = comm.communication || '';
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
          setSelectedCity(''); // Şehir seçimini sıfırla
          setNewAddressData(prev => ({ ...prev, cityCode: '', districtCode: '' }));
          setDistricts([]); // İlçeleri sıfırla
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
  }, [selectedRegion]);
  
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
      titleCode: "",
      jobTitleCode: "",
      identityNum: "",
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
        
        // Başarılı güncelleme sonrası müşteri detay sayfasına dön
        setTimeout(() => {
          navigate(`/customers/${formData.customerCode}`);
        }, 1500);
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

  // Adres formu için ortak render fonksiyonu
  const renderAddressSelectionFields = () => {
    return (
      <>
        <FormControl fullWidth margin="normal">
          <InputLabel>Adres Tipi</InputLabel>
          <Select
            name="addressTypeCode"
            value={newAddressData.addressTypeCode || ""}
            onChange={(e: SelectChangeEvent) => setNewAddressData({...newAddressData, addressTypeCode: e.target.value})}
            label="Adres Tipi"
            sx={{ backgroundColor: 'white', color: 'black' }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  zIndex: 9999
                }
              }
            }}
          >
            <MenuItem key="empty-type" value="">Seçiniz</MenuItem>
            {addressTypesData && addressTypesData.length > 0 ? (
              addressTypesData.map((type: any, index: number) => (
                <MenuItem key={index} value={type.addressTypeCode || type.code}>
                  {type.addressTypeDescription || type.description || type.name || type.addressTypeCode || type.code}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>Adres tipi bulunamadı</MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Bölge</InputLabel>
          <Select
            name="regionCode"
            value={selectedRegion}
            onChange={handleRegionChange}
            label="Bölge"
            sx={{ backgroundColor: 'white', color: 'black' }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  zIndex: 9999
                }
              }
            }}
          >
            <MenuItem key="empty-region" value="">Seçiniz</MenuItem>
            {regions.map((region: any, index: number) => {
              // Bölge verilerini kontrol et ve doğru alanları kullan
              let regionCode = '';
              let regionName = '';
              
              if (typeof region === 'string') {
                try {
                  const regionObj = JSON.parse(region);
                  regionCode = regionObj.stateCode || regionObj.regionCode || '';
                  regionName = regionObj.stateDescription || regionObj.regionDescription || regionObj.stateName || regionObj.regionName || regionCode;
                } catch (e) {
                  regionCode = region;
                  regionName = region;
                }
              } else {
                regionCode = region.stateCode || region.regionCode || '';
                regionName = region.stateDescription || region.regionDescription || region.stateName || region.regionName || regionCode;
              }
              
              // Boş değerleri kontrol et
              if (!regionName || regionName === '') {
                regionName = regionCode || `Bölge ${index + 1}`;
              }
              
              return (
                <MenuItem key={index} value={regionCode}>
                  {regionName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Şehir</InputLabel>
          <Select
            name="cityCode"
            value={selectedCity}
            onChange={handleCityChange}
            label="Şehir"
            disabled={!selectedRegion}
            sx={{ backgroundColor: 'white', color: 'black' }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  zIndex: 9999
                }
              }
            }}
          >
            <MenuItem key="empty-city" value="">Seçiniz</MenuItem>
            {cities.map((city: any, index: number) => {
              let cityCode = '';
              let cityName = '';
              
              if (typeof city === 'string') {
                try {
                  const cityObj = JSON.parse(city);
                  cityCode = cityObj.cityCode || '';
                  cityName = cityObj.cityDescription || cityObj.cityName || cityCode;
                } catch (e) {
                  cityCode = city;
                  cityName = city;
                }
              } else {
                cityCode = city.cityCode || '';
                cityName = city.cityDescription || city.cityName || cityCode;
              }
              
              if (!cityName || cityName === '') {
                cityName = cityCode || `Şehir ${index + 1}`;
              }
              
              return (
                <MenuItem key={index} value={cityCode}>
                  {cityName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>İlçe</InputLabel>
          <Select
            name="districtCode"
            value={newAddressData.districtCode || ""}
            onChange={handleDistrictChange}
            label="İlçe"
            disabled={!selectedCity}
            sx={{ backgroundColor: 'white', color: 'black' }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  zIndex: 9999
                }
              }
            }}
          >
            <MenuItem key="empty-district" value="">Seçiniz</MenuItem>
            {districts.map((district: any, index: number) => {
              let districtCode = '';
              let districtName = '';
              
              if (typeof district === 'string') {
                try {
                  const districtObj = JSON.parse(district);
                  districtCode = districtObj.districtCode || '';
                  districtName = districtObj.districtDescription || districtObj.districtName || districtCode;
                } catch (e) {
                  districtCode = district;
                  districtName = district;
                }
              } else {
                districtCode = district.districtCode || '';
                districtName = district.districtDescription || district.districtName || districtCode;
              }
              
              if (!districtName || districtName === '') {
                districtName = districtCode || `İlçe ${index + 1}`;
              }
              
              return (
                <MenuItem key={index} value={districtCode}>
                  {districtName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </>
    );
  };

  // Müşteri formu - Hem yeni ekleme hem de düzenleme için kullanılır
  const renderCustomerForm = () => {
    return (
      <Box component="div">
        <Typography variant="h6" gutterBottom>Temel Bilgiler</Typography>
        
        {/* Gerçek Kişi (Şahıs) Checkbox */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isRealPerson}
                onChange={handleRealPersonChange}
                name="isRealPerson"
              />
            }
            label="Gerçek Kişilik (Şahıs)"
          />
        </Box>
        
        {/* Müşteri Kodu */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <TextField
              fullWidth
              label="Müşteri Kodu *"
              name="customerCode"
              value={formData.customerCode}
              onChange={handleInputChange}
              error={!!errors.customerCode}
              helperText={errors.customerCode || "Müşteri kodu benzersiz olmalıdır"}
              disabled={isEdit}
              required
              margin="normal"
              placeholder={formData.isRealPerson ? "Örn: A001" : "Örn: 120.001"}
            />
          </Box>
          
          {/* Gerçek kişi ise isim/soyad, değilse şirket adı */}
          <Box sx={{ flex: '1 1 300px' }}>
            <TextField
              fullWidth
              label={formData.isRealPerson ? "Müşteri Adı Soyadı *" : "Şirket Adı *"}
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              error={!!errors.customerName}
              helperText={errors.customerName}
              required
              margin="normal"
              placeholder={formData.isRealPerson ? "Ad Soyad" : "Şirket Ünvanı"}
            />
          </Box>
        </Box>
        
        {/* Gerçek kişi ise kimlik bilgileri */}
        {formData.isRealPerson && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <TextField
                fullWidth
                label="TC Kimlik No *"
                name="identityNum"
                value={formData.identityNum || ""}
                onChange={handleInputChange}
                margin="normal"
                inputProps={{ maxLength: 11, minLength: 11 }}
                placeholder="11 haneli TC Kimlik No"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <TextField
                fullWidth
                label="Doğum Tarihi"
                name="birthDate"
                type="date"
                value={formData.birthDate || ""}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        )}
        
        {/* Vergi Bilgileri - Gerçek kişi değilse daha belirgin göster */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          {!formData.isRealPerson ? "Şirket Vergi Bilgileri" : "Vergi Bilgileri"}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              fullWidth
              label={!formData.isRealPerson ? "Şirket Vergi Numarası *" : "Vergi Numarası"}
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              required={!formData.isRealPerson}
              margin="normal"
              placeholder={!formData.isRealPerson ? "10 haneli vergi numarası" : ""}
              inputProps={{ maxLength: 10, minLength: !formData.isRealPerson ? 10 : 0 }}
              error={!!errors.taxNumber}
              helperText={errors.taxNumber}
            />
          </Box>
          <Box sx={{ flex: '1 1 250px' }}>
            <FormControl fullWidth margin="normal" error={!!errors.taxOfficeCode}>
              <InputLabel>Vergi Dairesi {!formData.isRealPerson ? "*" : ""}</InputLabel>
              <Select
                name="taxOfficeCode"
                value={formData.taxOfficeCode || ""}
                onChange={handleSelectChange}
                label="Vergi Dairesi"
                sx={{ backgroundColor: 'white', color: 'black' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      zIndex: 9999
                    }
                  }
                }}
              >
                <MenuItem key="empty-tax-office" value="">Seçiniz</MenuItem>
                {taxOfficesData && taxOfficesData.length > 0 ? (
                  taxOfficesData.map((office: any, index: number) => (
                    <MenuItem key={office.taxOfficeCode || index} value={office.taxOfficeCode}>
                      {office.taxOfficeDescription || office.taxOfficeCode}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Vergi dairesi bulunamadı</MenuItem>
                )}
              </Select>
              {errors.taxOfficeCode && (
                <FormHelperText>{errors.taxOfficeCode}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </Box>
        
        {/* İletişim Bilgileri */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>İletişim Bilgileri</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              fullWidth
              label="İş Telefonu"
              name="workPhone"
              value={formData.workPhone || ""}
              onChange={handleInputChange}
              margin="normal"
              placeholder="Örn: 0212 123 4567"
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              fullWidth
              label="Cep Telefonu"
              name="mobilePhone"
              value={formData.mobilePhone || ""}
              onChange={handleInputChange}
              margin="normal"
              placeholder="Örn: 0532 123 4567"
              InputProps={{
                startAdornment: <InputAdornment position="start"><SmartphoneIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              fullWidth
              label="Ev Telefonu"
              name="homePhone"
              value={formData.homePhone || ""}
              onChange={handleInputChange}
              margin="normal"
              placeholder="Örn: 0216 123 4567"
              InputProps={{
                startAdornment: <InputAdornment position="start"><HomeIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 100%' }}>
            <TextField
              fullWidth
              label="E-posta"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              margin="normal"
              placeholder="ornek@sirket.com"
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Box>
        </Box>
        
        {/* Adres Bilgileri */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Adres Bilgisi</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
          {renderAddressSelectionFields()}
          
          <TextField
            fullWidth
            label="Adres"
            name="address"
            multiline
            rows={3}
            value={newAddressData.address || ""}
            onChange={(e) => setNewAddressData({...newAddressData, address: e.target.value})}
            margin="normal"
            placeholder="Adres bilgilerini giriniz"
            sx={{ backgroundColor: 'white' }}
          />
          
          <TextField
            fullWidth
            label="Posta Kodu"
            name="postalCode"
            value={newAddressData.postalCode || ""}
            onChange={(e) => setNewAddressData({...newAddressData, postalCode: e.target.value})}
            margin="normal"
            placeholder="Posta kodu giriniz"
            sx={{ backgroundColor: 'white' }}
          />
        </Box>
        
        {/* Finansal Bilgiler */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Finansal Bilgiler</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              fullWidth
              label="Kredi Limiti"
              name="creditLimit"
              type="number"
              value={formData.creditLimit}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">₺</InputAdornment>,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              fullWidth
              label="Ödeme Süresi (Gün)"
              name="paymentTerm"
              type="number"
              value={formData.paymentTerm}
              onChange={handleInputChange}
              margin="normal"
            />
          </Box>
          <Box sx={{ flex: '1 1 250px' }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Para Birimi</InputLabel>
              <Select
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleSelectChange}
                label="Para Birimi"
                sx={{ backgroundColor: 'white', color: 'black' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      zIndex: 9999
                    }
                  }
                }}
              >
                <MenuItem value="TRY">Türk Lirası (TRY)</MenuItem>
                <MenuItem value="USD">Amerikan Doları (USD)</MenuItem>
                <MenuItem value="EUR">Euro (EUR)</MenuItem>
                <MenuItem value="GBP">İngiliz Sterlini (GBP)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {/* E-Devlet Parametreleri */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>E-Devlet Parametreleri</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.eInvoiceEnabled}
                  onChange={(e) => setFormData({...formData, eInvoiceEnabled: e.target.checked})}
                  name="eInvoiceEnabled"
                />
              }
              label="E-Faturaya Tabidir"
            />
            <TextField
              fullWidth
              label="E-Fatura Başlangıç Tarihi"
              name="eInvoiceStartDate"
              type="date"
              value={formData.eInvoiceStartDate}
              onChange={handleInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={!formData.eInvoiceEnabled}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.eArchiveEnabled}
                  onChange={(e) => setFormData({...formData, eArchiveEnabled: e.target.checked})}
                  name="eArchiveEnabled"
                />
              }
              label="E-Arşivlemeye Tabidir"
            />
            <TextField
              fullWidth
              label="E-Arşiv Başlangıç Tarihi"
              name="eArchiveStartDate"
              type="date"
              value={formData.eArchiveStartDate}
              onChange={handleInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={!formData.eArchiveEnabled}
            />
          </Box>
        </Box>
        
        {/* Diğer Bilgiler */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Diğer Bilgiler</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Ofis</InputLabel>
              <Select
                name="officeCode"
                value={formData.officeCode}
                onChange={handleSelectChange}
                label="Ofis"
                sx={{ backgroundColor: 'white', color: 'black' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      zIndex: 9999
                    }
                  }
                }}
              >
                <MenuItem value="MERKEZ">Merkez Ofis</MenuItem>
                <MenuItem value="SUBE1">Şube 1</MenuItem>
                <MenuItem value="SUBE2">Şube 2</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Veri Dil Kodu</InputLabel>
              <Select
                name="dataLanguageCode"
                value={formData.dataLanguageCode}
                onChange={handleSelectChange}
                label="Veri Dil Kodu"
                sx={{ backgroundColor: 'white', color: 'black' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      zIndex: 9999
                    }
                  }
                }}
              >
                <MenuItem value="TR">Türkçe</MenuItem>
                <MenuItem value="EN">İngilizce</MenuItem>
                <MenuItem value="DE">Almanca</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {/* Bakiye Bilgileri (Sadece görüntüleme) */}
        {isEdit && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Bakiye Bilgileri</Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Borç</TableCell>
                    <TableCell>Alacak</TableCell>
                    <TableCell>Bakiye</TableCell>
                    <TableCell>Açık Ç/R Riski</TableCell>
                    <TableCell>Bakiye + Risk</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{formData.debit.toLocaleString('tr-TR')} ₺</TableCell>
                    <TableCell>{formData.credit.toLocaleString('tr-TR')} ₺</TableCell>
                    <TableCell>{formData.balance.toLocaleString('tr-TR')} ₺</TableCell>
                    <TableCell>{formData.openRisk.toLocaleString('tr-TR')} ₺</TableCell>
                    <TableCell>{formData.totalRisk.toLocaleString('tr-TR')} ₺</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        
        {/* Butonlar */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/customers')}
            sx={{ mr: 1 }}
          >
            İPTAL
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : (isNew ? 'KAYDET' : 'GÜNCELLE')}
          </Button>
        </Box>
      </Box>
    );
  };

  // Adres ekleme formu
  const renderAddressForm = () => (
    <div>
      <Typography variant="h6" gutterBottom>Adres Bilgileri</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        {renderAddressSelectionFields()}
        
        <TextField
          fullWidth
          label="Adres"
          name="address"
          multiline
          rows={4}
          value={newAddressData.address || ""}
          onChange={(e) => setNewAddressData({...newAddressData, address: e.target.value})}
          sx={{ mb: 2, backgroundColor: 'white' }}
        />
        
        <TextField
          fullWidth
          label="Posta Kodu"
          name="postalCode"
          value={newAddressData.postalCode || ""}
          onChange={(e) => setNewAddressData({...newAddressData, postalCode: e.target.value})}
          sx={{ mb: 2, backgroundColor: 'white' }}
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
    </div>
  );

  // Detay görünümü - Sadece görüntüleme modu
  const renderDetailView = () => {
    // Adres metnini getir
    const getAddressText = (address: any) => {
      if (!address) return '';
      return address.address || '';
    };
    
    // Helper function to get address type with fallbacks
    const getAddressType = (address: any) => {
      if (!address) return '';
      
      // Adres tipi açıklaması varsa onu kullan
      if (address.addressTypeDescription) {
        return address.addressTypeDescription;
      }
      
      // Adres tipi kodu varsa ona göre açıklama döndür
      switch (address.addressTypeCode) {
        case '1':
          return 'Fatura Adresi';
        case '2':
          return 'Sevkiyat Adresi';
        case '3':
          return 'İş Adresi';
        case '4':
          return 'Ev Adresi';
        default:
          return `Adres (${address.addressTypeCode || 'Belirtilmemiş'})`;
      }
    };
    
    // Helper function to get communication type with fallbacks
    const getCommunicationType = (communication: any) => {
      if (!communication) return '';
      
      // İletişim tipi açıklaması varsa onu kullan
      if (communication.communicationTypeDescription) {
        return communication.communicationTypeDescription;
      }
      
      // İletişim tipi kodu varsa ona göre açıklama döndür
      switch (communication.communicationTypeCode) {
        case '1':
          return 'Telefon';
        case '2':
          return 'Cep Telefonu';
        case '3':
          return 'E-posta';
        case '4':
          return 'Faks';
        case '5':
          return 'Web Sitesi';
        default:
          return `İletişim (${communication.communicationTypeCode || 'Belirtilmemiş'})`;
      }
    };
    
    // Aktif sekmeye göre içerik göster
    if (activeTab === 'addresses' && customerAddresses && customerAddresses.length > 0) {
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Adres Bilgileri</Typography>
          <Divider sx={{ mb: 2 }} />
          
          {customerAddresses.map((address: any, index: number) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{getAddressType(address)}</Typography>
              <Typography variant="body2">{getAddressText(address)}</Typography>
              <Typography variant="body2">
                {address.cityDescription || address.cityCode} / 
                {address.districtDescription || address.districtCode}
              </Typography>
              {address.isDefault && (
                <Typography variant="caption" color="primary">Varsayılan Adres</Typography>
              )}
            </Paper>
          ))}
        </Paper>
      );
    }
    
    if (activeTab === 'emails' && customerCommunications && customerCommunications.length > 0) {
      // E-posta iletişim bilgilerini filtrele (communicationTypeCode = 3)
      const emailCommunications = customerCommunications.filter(
        comm => comm.communicationTypeCode === '3' || 
                getCommunicationType(comm).toLowerCase().includes('e-posta') || 
                getCommunicationType(comm).toLowerCase().includes('email')
      );
      
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>E-posta Bilgileri</Typography>
          <Divider sx={{ mb: 2 }} />
          
          {emailCommunications.length > 0 ? (
            <List>
              {emailCommunications.map((communication: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${getCommunicationType(communication)}: ${communication.communication || communication.commAddress || ''}`}
                    secondary={communication.isDefault ? 'Varsayılan E-posta' : ''}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">Bu müşteri için kayıtlı e-posta adresi bulunamadı.</Typography>
          )}
        </Paper>
      );
    }
    
    // Varsayılan olarak müşteri bilgilerini göster
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Müşteri Bilgileri</Typography>
        <List>
          <ListItem>
            <ListItemText primary="Müşteri Kodu" secondary={customer.customerCode} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Müşteri Adı" secondary={customer.customerName} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Vergi Numarası" secondary={customer.taxNumber || 'Belirtilmemiş'} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Vergi Dairesi" secondary={customer.taxOfficeDescription || customer.taxOfficeCode || 'Belirtilmemiş'} />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Müşteri Tipi" 
              secondary={customer.customerTypeCode === 1 ? 'Bireysel' : customer.customerTypeCode === 2 ? 'Kurumsal' : 'Diğer'} 
            />
          </ListItem>
        </List>
      </Paper>
    );
  };

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
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate(`/customers/${effectiveCustomerCode}/edit`)}
              startIcon={<EditIcon />}
            >
              Düzenle
            </Button>
          )}
        </Box>

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
              <Tab value="customer" label="Müşteri Bilgileri" />
              <Tab value="addresses" label="Adresler" />
              <Tab value="contacts" label="İletişim Kişileri" />
              <Tab value="emails" label="E-postalar" />
            </Tabs>
          </div>
        )}

        {/* Yeni müşteri ekleme veya düzenleme formu */}
        {(isNew || isEdit) && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {renderCustomerForm()}
          </Box>
        )}
        
        {/* Müşteri detay görünümü */}
        {!isNew && !isEdit && !isLoading && customer && (
          <>
            {renderDetailView()}
            
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
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CustomerDetail; 