import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CustomerDetail from './CustomerDetail';

const CustomerForm: React.FC = () => {
  const { customerCode } = useParams<{ customerCode: string }>();
  const location = useLocation();
  
  // URL'yi analiz et
  const pathParts = location.pathname.split('/');
  
  // Check if the path is for a new customer
  const isNewPath = location.pathname === '/customers/new';
  
  // Edit path kontrolü: /customers/edit/CODE veya /customers/CODE/edit
  const isEditPath = pathParts.includes('edit');
  
  // Müşteri kodunu belirle
  let actualCustomerCode = customerCode;
  if (isEditPath && pathParts.length > 3 && pathParts[2] === 'edit') {
    // /customers/edit/CODE formatı
    actualCustomerCode = pathParts[3];
  }
  
  // If customerCode exists, we're in edit mode, otherwise we're in new mode
  const isNew = isNewPath || !actualCustomerCode;
  const isEdit = isEditPath || (!isNewPath && !!actualCustomerCode && location.pathname.includes('/edit'));
  
  console.log('CustomerForm: path:', location.pathname, 'pathParts:', pathParts, 'isEditPath:', isEditPath, 
              'actualCustomerCode:', actualCustomerCode, 'isNew:', isNew, 'isEdit:', isEdit);

  return (
    <CustomerDetail 
      isNew={isNew} 
      isEdit={isEdit}
      customerCodeOverride={actualCustomerCode}
    />
  );
};

export default CustomerForm;
