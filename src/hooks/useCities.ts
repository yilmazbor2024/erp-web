import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

export interface CityResponse {
  cityCode: string;
  cityName?: string;
  cityDescription?: string;
  regionCode?: string;
  stateCode?: string;
}

const useCities = (regionCode: string) => {
  return useQuery<CityResponse[]>({
    queryKey: ['cities', regionCode],
    queryFn: () => regionCode ? customerApi.getCitiesByRegion(regionCode) : Promise.resolve([]),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!regionCode,
  });
};

export default useCities; 