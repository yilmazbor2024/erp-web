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
} from '@mui/material';
import { Grid } from '../../utils/muiGridAdapter';
import { RegionCitySelector } from './RegionCitySelector';
import { AddressType } from '../../types/address';

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

export interface AddressFormProps {
  initialValues?: Partial<AddressFormValues>;
  addressTypes: AddressType[];
  onSubmit: (values: AddressFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const validationSchema = Yup.object({
  addressTypeCode: Yup.string().required('Address type is required'),
  addressLine1: Yup.string().required('Address line 1 is required'),
  regionCode: Yup.string().required('Region is required'),
  cityCode: Yup.string().required('City is required'),
  districtCode: Yup.string().required('District is required'),
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
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      regionCode: '',
      cityCode: '',
      districtCode: '',
      ...initialValues,
    },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

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

        {/* Address Line 1 */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="addressLine1"
            name="addressLine1"
            label="Address Line 1"
            value={formik.values.addressLine1}
            onChange={formik.handleChange}
            error={formik.touched.addressLine1 && Boolean(formik.errors.addressLine1)}
            helperText={formik.touched.addressLine1 && formik.errors.addressLine1}
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
            label="Postal Code (Optional)"
            value={formik.values.postalCode}
            onChange={formik.handleChange}
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