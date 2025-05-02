import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';
import useCustomerCreate from '../../hooks/useCustomerCreate';
import CustomerForm from '../../components/features/customers/forms/CustomerForm';

// Wizard adımları
const steps = ['Temel Bilgiler', 'İletişim Bilgileri', 'Adres Bilgileri', 'Finansal Bilgileri'];

const CustomerCreate: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    // Temel bilgiler
    customerCode: '',
    customerName: '',
    customerTypeCode: 1, // Varsayılan olarak şirket
    taxNumber: '',
    taxOfficeCode: '',
    isRealPerson: false,
    identityNumber: '',
    
    // İletişim bilgileri
    communications: [],
    contacts: [],
    
    // Adres bilgileri
    addresses: [],
    
    // Finansal bilgiler
    creditLimit: 0,
    paymentTerm: 30,
    currency: 'TRY',
    isVIP: false,
    isBlocked: false,
    
    // Diğer varsayılan değerler
    officeCode: '001',
    dataLanguageCode: 'TR'
  });
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { mutateAsync: createCustomer, isPending: isLoading, error } = useCustomerCreate();
  
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Son adımda, müşteri oluştur
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCancel = () => {
    navigate('/customers');
  };
  
  const handleFormChange = (stepData: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      ...stepData
    }));
  };
  
  const handleSubmit = async () => {
    try {
      await createCustomer(formData);
      navigate('/customers');
    } catch (err) {
      console.error('Müşteri oluşturma hatası:', err);
    }
  };
  
  const isStepValid = () => {
    // Her adım için validasyon kontrolleri
    switch (activeStep) {
      case 0: // Temel Bilgiler
        return formData.customerName && 
               (formData.isRealPerson ? formData.identityNumber : (formData.taxNumber && formData.taxOfficeCode));
      case 1: // İletişim Bilgileri
        return true; // İletişim bilgileri opsiyonel olabilir
      case 2: // Adres Bilgileri
        return formData.addresses.length > 0;
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
      isLoading={isLoading}
      isEdit={false}
      activeSection="basic"
    />
  );
  
  const renderCommunicationForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isLoading}
      isEdit={false}
      activeSection="communication"
    />
  );
  
  const renderAddressForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isLoading}
      isEdit={false}
      activeSection="address"
    />
  );
  
  const renderFinancialForm = () => (
    <CustomerForm 
      initialData={formData}
      onSubmit={handleFormChange}
      isLoading={isLoading}
      isEdit={false}
      activeSection="financial"
    />
  );
  
  const renderStepContent = () => {
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
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Yeni Müşteri Ekle</Typography>
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
            endIcon={activeStep === steps.length - 1 ? undefined : <NextIcon />}
            disabled={!isStepValid() || isLoading}
          >
            {activeStep === steps.length - 1 ? 'Kaydet' : 'İleri'}
          </Button>
        </Box>
        
        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error">
              {error instanceof Error ? error.message : String(error)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CustomerCreate;
