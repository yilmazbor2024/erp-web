import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { Customer, CustomerAddress, CustomerCommunication, CustomerContact } from '../../types/customer';
import { useCustomerDetail } from '../../hooks/useCustomerDetail';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface UseCustomerDetailParams {
  customerCode: string;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const CustomerView = () => {
  const params = useParams<{ customerCode: string }>();
  const customerCode = params.customerCode;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);

  // useCustomerDetail hook'unu kullanarak gerçek verileri al
  const { data: customerData, isLoading, error } = useCustomerDetail({ customerCode });

  // API'den gelen verileri state'e aktar
  useEffect(() => {
    if (customerData) {
      setCustomer(customerData);
    }
  }, [customerData]);

  const [customer, setCustomer] = useState<Customer>({
    customerCode: '',
    customerName: '',
    customerTypeCode: 0,
    isActive: true,
    isBlocked: false,
    communications: [],
    addresses: [],
    contacts: []
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/customers/edit/${customerCode}`);
  };

  // Mobil görünüm için iletişim bilgilerini render eden fonksiyon
  const renderCommunications = () => {
    if (!customer.communications || customer.communications.length === 0) {
      return <Typography variant="body2">İletişim bilgisi bulunamadı.</Typography>;
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        {customer.communications.map((comm: CustomerCommunication, index: number) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {comm.communicationTypeCode === 'PHONE' || comm.communicationTypeCode === 'TEL' ? (
              <PhoneIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
            ) : comm.communicationTypeCode === 'EMAIL' || comm.communicationTypeCode === 'MAIL' ? (
              <EmailIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
            ) : (
              <DescriptionIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">
              {comm.communication} 
              {comm.isDefault && <Chip size="small" label="Varsayılan" color="primary" sx={{ ml: 1, height: 20 }} />}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Mobil görünüm için adres bilgilerini render eden fonksiyon
  const renderAddresses = () => {
    if (!customer.addresses || customer.addresses.length === 0) {
      return <Typography variant="body2">Adres bilgisi bulunamadı.</Typography>;
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        {customer.addresses.map((addr: CustomerAddress, index: number) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <LocationIcon fontSize="small" color="primary" sx={{ mr: 1, mt: 0.5 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: addr.isDefault ? 'bold' : 'normal' }}>
                {addr.addressType || addr.addressTypeCode}
                {addr.isDefault && <Chip size="small" label="Varsayılan" color="primary" sx={{ ml: 1, height: 20 }} />}
              </Typography>
              <Typography variant="body2">
                {addr.address}
                {addr.districtDescription || addr.district ? `, ${addr.districtDescription || addr.district}` : ''}
                {addr.cityDescription || addr.city ? `, ${addr.cityDescription || addr.city}` : ''}
                {addr.countryDescription || addr.country ? `, ${addr.countryDescription || addr.country}` : ''}
                {addr.postalCode ? ` (${addr.postalCode})` : ''}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ pb: 8 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ pb: 8 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Hata oluştu: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Mobil görünüm */}
      {isMobile ? (
        <Box>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <IconButton component={Link} to="/customers" edge="start" color="inherit" aria-label="back">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>
              Müşteri Detayı
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color="primary" onClick={handleEdit}>
              <EditIcon />
            </IconButton>
          </Box>

          <Card sx={{ mx: 2, mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: customer.isRealPerson ? 'primary.main' : 'secondary.main', mr: 2 }}>
                  {customer.isRealPerson ? <PersonIcon /> : <BusinessIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">{customer.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.customerCode}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary">
                Müşteri Tipi
              </Typography>
              <Typography variant="body1" gutterBottom>
                {customer.isRealPerson ? "Bireysel" : "Kurumsal"}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">
                Vergi/TC No
              </Typography>
              <Typography variant="body1" gutterBottom>
                {customer.isRealPerson ? customer.identityNum : customer.taxNumber}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">
                Vergi Dairesi
              </Typography>
              <Typography variant="body1" gutterBottom>
                {customer.taxOffice || "-"}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                İletişim Bilgileri
              </Typography>
              {renderCommunications()}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Adres Bilgileri
              </Typography>
              {renderAddresses()}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Bakiye
                </Typography>
                <Typography 
                  variant="h6" 
                  color={customer.balance && customer.balance < 0 ? "error.main" : "success.main"}
                >
                  {customer.balance !== undefined 
                    ? customer.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                    : "-"}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Kredi Limiti
                </Typography>
                <Typography variant="body1">
                  {customer.creditLimit !== undefined 
                    ? customer.creditLimit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                    : "-"}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Risk
                </Typography>
                <Typography variant="body1">
                  {customer.totalRisk !== undefined 
                    ? customer.totalRisk.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                    : "-"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        // Masaüstü görünüm
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              component={Link}
              to="/customers"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Müşteri Listesi
            </Button>
            <Typography variant="h5">{customer.customerName}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Düzenle
            </Button>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer tabs">
              <Tab label="Genel Bilgiler" id="customer-tab-0" aria-controls="customer-tabpanel-0" />
              <Tab label="İletişim" id="customer-tab-1" aria-controls="customer-tabpanel-1" />
              <Tab label="Finansal" id="customer-tab-2" aria-controls="customer-tabpanel-2" />
              <Tab label="Belgeler" id="customer-tab-3" aria-controls="customer-tabpanel-3" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Müşteri Bilgileri</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Müşteri Tipi</Typography>
                        <Typography variant="body1">{customer.isRealPerson ? "Bireysel" : "Kurumsal"}</Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Vergi Dairesi</Typography>
                        <Typography variant="body1">{customer.taxOffice || "-"}</Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Vergi/TC No</Typography>
                        <Typography variant="body1">{customer.isRealPerson ? customer.identityNum : customer.taxNumber}</Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Ödeme Vadesi</Typography>
                        <Typography variant="body1">{customer.paymentTerm || 0} gün</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Finansal Bilgiler</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Bakiye</Typography>
                        <Typography variant="body1" color={customer.balance && customer.balance < 0 ? "error.main" : "success.main"}>
                          {customer.balance !== undefined 
                            ? customer.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                            : "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Kredi Limiti</Typography>
                        <Typography variant="body1">
                          {customer.creditLimit !== undefined 
                            ? customer.creditLimit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                            : "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                        <Typography variant="body2" color="text.secondary">Risk</Typography>
                        <Typography variant="body1">
                          {customer.totalRisk !== undefined 
                            ? customer.totalRisk.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                            : "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>İletişim Bilgileri</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {customer.communications?.map((comm: CustomerCommunication, index: number) => (
                    <Box key={index} sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                      <Typography variant="body2" color="text.secondary">{comm.communicationType}</Typography>
                      <Typography variant="body1">{comm.communication}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Finansal Detaylar</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                    <Typography variant="body2" color="text.secondary">Borç</Typography>
                    <Typography variant="body1">
                      {customer.debit !== undefined 
                        ? customer.debit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                        : "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                    <Typography variant="body2" color="text.secondary">Alacak</Typography>
                    <Typography variant="body1">
                      {customer.credit !== undefined 
                        ? customer.credit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                        : "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                    <Typography variant="body2" color="text.secondary">Açık Risk</Typography>
                    <Typography variant="body1">
                      {customer.openRisk !== undefined 
                        ? customer.openRisk.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                        : "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                    <Typography variant="body2" color="text.secondary">Toplam Risk</Typography>
                    <Typography variant="body1">
                      {customer.totalRisk !== undefined 
                        ? customer.totalRisk.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                        : "-"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Belgeler</Typography>
                <Typography variant="body2" color="text.secondary">
                  Bu müşteriye ait belge bulunamadı.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};

export default CustomerView;
