import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { Grid } from '../../utils/muiGridAdapter';
import { RegionCitySelector } from './RegionCitySelector';
import { AddressType } from '../../types/address';
import { useTaxOfficesByCity } from '../../hooks/useTaxOffices';

export interface AddressFormValues {
  addressTypeCode: string;
  isDefault: boolean;
  address: string; // Renamed from addressLine1 to match API
  addressLine2?: string;
  postalCode?: string; // Will be mapped to zipCode for API
  regionCode: string; // Will be mapped to stateCode for API
  cityCode: string;
  districtCode: string;
  taxOffice?: string; // Added for API
  taxNumber?: string; // Added for API
  customerCode?: string; // Added for API
}

export interface AddressFormProps {
  initialValues?: Partial<AddressFormValues>;
  addressTypes: AddressType[];
  onSubmit: (values: AddressFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const validationSchema = Yup.object({
  addressTypeCode: Yup.string().required('Address type is required'),
  address: Yup.string().required('Address is required'),
  regionCode: Yup.string().required('Region is required'),
  cityCode: Yup.string().required('City is required'),
  districtCode: Yup.string().required('District is required'),
  taxOffice: Yup.string().required('Tax office is required'),
  taxNumber: Yup.string().required('Tax number is required'),
});

export const AddressForm: React.FC<AddressFormProps> = ({
  initialValues = {},
  addressTypes = [],
  onSubmit,
  isSubmitting = false,
}) => {
  const formik = useFormik<AddressFormValues>({
    initialValues: {
      addressTypeCode: '',
      isDefault: false,
      address: '',
      addressLine2: '',
      postalCode: '',
      regionCode: '',
      cityCode: '',
      districtCode: '',
      taxOffice: '',
      taxNumber: '',
      customerCode: '',
      ...initialValues,
    },
    validationSchema,
    onSubmit: async (values) => {
      // Transform values to match API expectations
      const apiValues = {
        customerCode: values.customerCode,
        addressTypeCode: values.addressTypeCode,
        countryCode: 'TR', // Default to Turkey
        stateCode: values.regionCode,
        cityCode: values.cityCode,
        districtCode: values.districtCode,
        address: values.address,
        postalCode: values.postalCode,
        taxOffice: values.taxOffice,
        taxNumber: values.taxNumber,
        isDefault: values.isDefault
      };
      
      await onSubmit(values);
    },
  });
  
  // Get tax offices based on selected city
  const { data: taxOffices = [], isLoading: isLoadingTaxOffices } = useTaxOfficesByCity(
    formik.values.cityCode,
    'TR',
    !!formik.values.cityCode
  );

  // Set default address type if none selected and addressTypes available
  useEffect(() => {
    if (!formik.values.addressTypeCode && addressTypes.length > 0) {
      formik.setFieldValue('addressTypeCode', addressTypes[0].addressTypeCode);
    }
  }, [addressTypes, formik.values.addressTypeCode]);

  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        {/* Address Type */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            id="addressTypeCode"
            name="addressTypeCode"
            label="Address Type"
            value={formik.values.addressTypeCode}
            onChange={formik.handleChange}
            error={formik.touched.addressTypeCode && Boolean(formik.errors.addressTypeCode)}
            helperText={formik.touched.addressTypeCode && formik.errors.addressTypeCode}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Select Address Type</option>
            {addressTypes.map((type) => (
              <option key={type.addressTypeCode} value={type.addressTypeCode}>
                {type.addressTypeDescription}
              </option>
            ))}
          </TextField>
        </Grid>

        {/* Default Address Checkbox */}
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                id="isDefault"
                name="isDefault"
                checked={formik.values.isDefault}
                onChange={formik.handleChange}
                color="primary"
              />
            }
            label="Set as default address"
          />
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="address"
            name="address"
            label="Address"
            value={formik.values.address}
            onChange={formik.handleChange}
            error={formik.touched.address && Boolean(formik.errors.address)}
            helperText={formik.touched.address && formik.errors.address}
          />
        </Grid>

        {/* Address Line 2 */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="addressLine2"
            name="addressLine2"
            label="Address Line 2 (Optional)"
            value={formik.values.addressLine2}
            onChange={formik.handleChange}
          />
        </Grid>

        {/* Postal Code */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="postalCode"
            name="postalCode"
            label="Postal Code"
            value={formik.values.postalCode}
            onChange={formik.handleChange}
            error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
            helperText={formik.touched.postalCode && formik.errors.postalCode}
          />
        </Grid>
        
        {/* Tax Office */}
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth 
            error={formik.touched.taxOffice && Boolean(formik.errors.taxOffice)}
            disabled={!formik.values.cityCode || isLoadingTaxOffices}
          >
            <InputLabel id="tax-office-label">Tax Office</InputLabel>
            <Select
              labelId="tax-office-label"
              id="taxOffice"
              name="taxOffice"
              value={formik.values.taxOffice}
              label="Tax Office"
              onChange={formik.handleChange}
            >
              <MenuItem value="">
                <em>Select Tax Office</em>
              </MenuItem>
              {taxOffices.map((office: any) => (
                <MenuItem key={office.taxOfficeCode} value={office.taxOfficeCode}>
                  {office.taxOfficeDescription}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.taxOffice && formik.errors.taxOffice && (
              <FormHelperText>{formik.errors.taxOffice as string}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        {/* Tax Number */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="taxNumber"
            name="taxNumber"
            label="Tax Number"
            value={formik.values.taxNumber}
            onChange={formik.handleChange}
            error={formik.touched.taxNumber && Boolean(formik.errors.taxNumber)}
            helperText={formik.touched.taxNumber && formik.errors.taxNumber}
          />
        </Grid>

        {/* Region/City/District Selector */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Location
          </Typography>
          <RegionCitySelector
            selectedRegion={formik.values.regionCode}
            selectedCity={formik.values.cityCode}
            selectedDistrict={formik.values.districtCode}
            onRegionChange={(value) => {
              formik.setFieldValue('regionCode', value);
              formik.setFieldValue('cityCode', '');
              formik.setFieldValue('districtCode', '');
            }}
            onCityChange={(value) => {
              formik.setFieldValue('cityCode', value);
              formik.setFieldValue('districtCode', '');
            }}
            onDistrictChange={(value) => {
              formik.setFieldValue('districtCode', value);
            }}
            errors={{
              region: formik.touched.regionCode && formik.errors.regionCode ? String(formik.errors.regionCode) : undefined,
              city: formik.touched.cityCode && formik.errors.cityCode ? String(formik.errors.cityCode) : undefined,
              district: formik.touched.districtCode && formik.errors.districtCode ? String(formik.errors.districtCode) : undefined,
            }}
          />
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save Address'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}; 