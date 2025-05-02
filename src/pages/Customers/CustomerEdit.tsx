import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  useMediaQuery,
  useTheme,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useCustomerDetail } from '../../hooks/useCustomerDetail';
import useCustomerUpdate from '../../hooks/useCustomerUpdate';
import CustomerForm from '../../components/features/customers/forms/CustomerForm';

// Wizard adımları
const steps = ['Temel Bilgiler', 'İletişim Bilgileri', 'Adres Bilgileri', 'Finansal Bilgileri'];

type CustomerEditParams = {
  customerCode: string;
}

interface UseCustomerDetailParams {
  customerCode: string;
}

const CustomerEdit: React.FC = () => {
  const params = useParams<{ customerCode: string }>();
  const customerCode = params.customerCode;
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useCustomerDetail({ customerCode: customerCode || '' });
  const { mutateAsync: updateCustomer, isPending: isUpdating, error: updateError } = useCustomerUpdate();
  
  // Müşteri verisi yüklendiğinde form verilerini ayarla
  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
        // Eğer iletişim bilgileri yoksa boş dizi olarak başlat
        communications: customer.communications || [],
        contacts: customer.contacts || [],
        addresses: customer.addresses || []
      });
    }
  }, [customer]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Son adımda, müşteri güncelle
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCancel = () => {
    navigate(`/customers/${customerCode}`);
  };
  
  const handleFormChange = (stepData: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      ...stepData
    }));
  };
  
  const handleSubmit = async () => {
    try {
      if (formData) {
        await updateCustomer(formData);
        navigate(`/customers/${customerCode}`);
      }
    } catch (err) {
      console.error('Müşteri güncelleme hatası:', err);
    }
  };
  
  const isStepValid = () => {
    if (!formData) return false;
    
    // Her adım için validasyon kontrolleri
    switch (activeStep) {
      case 0: // Temel Bilgiler
        return formData.customerName && 
               (formData.isRealPerson ? formData.identityNumber : (formData.taxNumber && formData.taxOfficeCode));
      case 1: // İletişim Bilgileri
        return true; // İletişim bilgileri opsiyonel olabilir
      case 2: // Adres Bilgileri
        return formData.addresses && formData.addresses.length > 0;
      case 3: // Finansal Bilgiler
        return true; // Finansal bilgiler varsayılan değerlerle gelebilir
      default:
        return false;
    }
  };
  
  // Her adım için ayrı form bileşenleri
  const renderBasicForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isUpdating}
      isEdit={true}
      activeSection="basic"
    />
  );
  
  const renderCommunicationForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isUpdating}
      isEdit={true}
      activeSection="communication"
    />
  );
  
  const renderAddressForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isUpdating}
      isEdit={true}
      activeSection="address"
    />
  );
  
  const renderFinancialForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isUpdating}
      isEdit={true}
      activeSection="financial"
    />
  );
  
  const renderStepContent = () => {
    if (!formData) return null;
    
    switch (activeStep) {
      case 0:
        return renderBasicForm();
      case 1:
        return renderCommunicationForm();
      case 2:
        return renderAddressForm();
      case 3:
        return renderFinancialForm();
      default:
        return null;
    }
  };
  
  if (isLoadingCustomer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (customerError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {customerError instanceof Error ? customerError.message : String(customerError)}
        </Alert>
      </Box>
    );
  }
  
  if (!customer) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">Müşteri bulunamadı.</Alert>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Müşteri Düzenle: {customer.customerName}</Typography>
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel={!isMobile} orientation={isMobile ? 'vertical' : 'horizontal'}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4, mb: 2 }}>
          {renderStepContent()}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Geri
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <NextIcon />}
            disabled={!isStepValid() || isUpdating}
          >
            {activeStep === steps.length - 1 ? 'Kaydet' : 'İleri'}
          </Button>
        </Box>
        
        {updateError && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error">
              {updateError instanceof Error ? updateError.message : String(updateError)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CustomerEdit;
