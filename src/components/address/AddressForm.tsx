import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { RegionCitySelector } from './RegionCitySelector';
import { useAddressTypes } from '../../hooks/useAddressTypes';

export interface AddressFormValues {
  addressTypeCode: string;
  isDefault: boolean;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  regionCode: string;
  cityCode: string;
  districtCode: string;
}

interface AddressFormProps {
  initialValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  isSubmitting?: boolean;
  isEdit?: boolean;
  customerCode?: string;
}

const defaultInitialValues: AddressFormValues = {
  addressTypeCode: '',
  isDefault: false,
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  regionCode: '',
  cityCode: '',
  districtCode: '',
};

const validationSchema = Yup.object({
  addressTypeCode: Yup.string().required('Address type is required'),
  addressLine1: Yup.string().required('Address line 1 is required'),
  addressLine2: Yup.string(),
  postalCode: Yup.string(),
  regionCode: Yup.string().required('Region is required'),
  cityCode: Yup.string().required('City is required'),
  districtCode: Yup.string().required('District is required'),
  isDefault: Yup.boolean(),
});

export const AddressForm: React.FC<AddressFormProps> = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  isEdit = false,
  customerCode,
}) => {
  const { addressTypes, isLoading: isLoadingAddressTypes } = useAddressTypes();
  
  const formik = useFormik({
    initialValues: { ...defaultInitialValues, ...initialValues },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
    },
    enableReinitialize: true,
  });

  // Set default address type if none is selected and options are loaded
  useEffect(() => {
    if (!formik.values.addressTypeCode && addressTypes && addressTypes.length > 0) {
      formik.setFieldValue('addressTypeCode', addressTypes[0].addressTypeCode);
    }
  }, [addressTypes, formik.values.addressTypeCode, formik]);

  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        {isEdit ? 'Edit Address' : 'Add New Address'}
      </Typography>
      
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Address Type */}
          <Box sx={{ width: '100%' }}>
            <TextField
              select
              fullWidth
              id="addressTypeCode"
              name="addressTypeCode"
              label="Address Type"
              value={formik.values.addressTypeCode}
              onChange={formik.handleChange}
              error={formik.touched.addressTypeCode && Boolean(formik.errors.addressTypeCode)}
              helperText={(formik.touched.addressTypeCode && formik.errors.addressTypeCode) || ''}
              SelectProps={{
                native: true,
              }}
              disabled={isLoadingAddressTypes}
            >
              <option value="">Select Address Type</option>
              {addressTypes?.map((type) => (
                <option key={type.addressTypeCode} value={type.addressTypeCode}>
                  {type.addressTypeDescription}
                </option>
              ))}
            </TextField>
          </Box>
          
          {/* Is Default */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="isDefault"
                  name="isDefault"
                  checked={formik.values.isDefault}
                  onChange={formik.handleChange}
                />
              }
              label="Set as Default Address"
            />
          </Box>
        </Stack>
        
        {/* Address Line 1 */}
        <TextField
          fullWidth
          id="addressLine1"
          name="addressLine1"
          label="Address Line 1"
          value={formik.values.addressLine1}
          onChange={formik.handleChange}
          error={formik.touched.addressLine1 && Boolean(formik.errors.addressLine1)}
          helperText={(formik.touched.addressLine1 && formik.errors.addressLine1) || ''}
        />
        
        {/* Address Line 2 */}
        <TextField
          fullWidth
          id="addressLine2"
          name="addressLine2"
          label="Address Line 2 (Optional)"
          value={formik.values.addressLine2}
          onChange={formik.handleChange}
          error={formik.touched.addressLine2 && Boolean(formik.errors.addressLine2)}
          helperText={(formik.touched.addressLine2 && formik.errors.addressLine2) || ''}
        />
        
        {/* Postal Code */}
        <TextField
          fullWidth
          id="postalCode"
          name="postalCode"
          label="Postal Code (Optional)"
          value={formik.values.postalCode}
          onChange={formik.handleChange}
          error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
          helperText={(formik.touched.postalCode && formik.errors.postalCode) || ''}
        />
        
        {/* Region, City, District Selector */}
        <RegionCitySelector
          selectedRegion={formik.values.regionCode}
          selectedCity={formik.values.cityCode}
          selectedDistrict={formik.values.districtCode}
          onRegionChange={(value: string) => {
            formik.setFieldValue('regionCode', value);
            formik.setFieldValue('cityCode', '');
            formik.setFieldValue('districtCode', '');
          }}
          onCityChange={(value: string) => {
            formik.setFieldValue('cityCode', value);
            formik.setFieldValue('districtCode', '');
          }}
          onDistrictChange={(value: string) => {
            formik.setFieldValue('districtCode', value);
          }}
          errors={{
            region: formik.touched.regionCode && formik.errors.regionCode ? formik.errors.regionCode as string : undefined,
            city: formik.touched.cityCode && formik.errors.cityCode ? formik.errors.cityCode as string : undefined,
            district: formik.touched.districtCode && formik.errors.districtCode ? formik.errors.districtCode as string : undefined,
          }}
        />
        
        {/* Submit Button */}
        <Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : isEdit ? 'Update Address' : 'Add Address'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}; 