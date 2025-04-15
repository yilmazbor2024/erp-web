import React, { useEffect } from 'react';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, Box } from '@mui/material';
import useRegions from '../../hooks/useRegions';
import useCities from '../../hooks/useCities';
import useDistricts from '../../hooks/useDistricts';

export interface RegionCitySelectorProps {
  selectedRegion: string;
  selectedCity: string;
  selectedDistrict: string;
  onRegionChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  errors?: {
    region?: string;
    city?: string;
    district?: string;
  };
}

export const RegionCitySelector: React.FC<RegionCitySelectorProps> = ({
  selectedRegion,
  selectedCity,
  selectedDistrict,
  onRegionChange,
  onCityChange,
  onDistrictChange,
  errors = {},
}) => {
  const { data: regions = [], isLoading: isLoadingRegions } = useRegions();
  const { data: cities = [], isLoading: isLoadingCities } = useCities(selectedRegion);
  const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(selectedCity);

  // Reset city when region changes
  useEffect(() => {
    if (selectedRegion && selectedCity) {
      const cityExists = cities.some((city: any) => city.cityCode === selectedCity);
      if (!cityExists && cities.length > 0) {
        onCityChange('');
      }
    }
  }, [selectedRegion, selectedCity, cities, onCityChange]);

  // Reset district when city changes
  useEffect(() => {
    if (selectedCity && selectedDistrict) {
      const districtExists = districts.some((district: any) => district.districtCode === selectedDistrict);
      if (!districtExists && districts.length > 0) {
        onDistrictChange('');
      }
    }
  }, [selectedCity, selectedDistrict, districts, onDistrictChange]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* Region Selector */}
        <Box sx={{ flex: 1 }}>
          <FormControl fullWidth error={!!errors.region}>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              id="region"
              value={selectedRegion}
              label="Region"
              onChange={(e) => onRegionChange(e.target.value as string)}
              disabled={isLoadingRegions}
            >
              <MenuItem value="">
                <em>Select Region</em>
              </MenuItem>
              {regions.map((region) => (
                <MenuItem key={region.regionCode} value={region.regionCode}>
                  {region.regionDescription}
                </MenuItem>
              ))}
            </Select>
            {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
          </FormControl>
        </Box>

        {/* City Selector */}
        <Box sx={{ flex: 1 }}>
          <FormControl fullWidth error={!!errors.city}>
            <InputLabel id="city-label">City</InputLabel>
            <Select
              labelId="city-label"
              id="city"
              value={selectedCity}
              label="City"
              onChange={(e) => onCityChange(e.target.value as string)}
              disabled={!selectedRegion || isLoadingCities}
            >
              <MenuItem value="">
                <em>Select City</em>
              </MenuItem>
              {cities.map((city: any) => (
                <MenuItem key={city.cityCode} value={city.cityCode}>
                  {city.cityName || city.cityDescription}
                </MenuItem>
              ))}
            </Select>
            {errors.city && <FormHelperText>{errors.city}</FormHelperText>}
          </FormControl>
        </Box>

        {/* District Selector */}
        <Box sx={{ flex: 1 }}>
          <FormControl fullWidth error={!!errors.district}>
            <InputLabel id="district-label">District</InputLabel>
            <Select
              labelId="district-label"
              id="district"
              value={selectedDistrict}
              label="District"
              onChange={(e) => onDistrictChange(e.target.value as string)}
              disabled={!selectedCity || isLoadingDistricts}
            >
              <MenuItem value="">
                <em>Select District</em>
              </MenuItem>
              {districts.map((district: any) => (
                <MenuItem key={district.districtCode} value={district.districtCode}>
                  {district.districtName || district.districtDescription}
                </MenuItem>
              ))}
            </Select>
            {errors.district && <FormHelperText>{errors.district}</FormHelperText>}
          </FormControl>
        </Box>
      </Stack>
    </Stack>
  );
}; 