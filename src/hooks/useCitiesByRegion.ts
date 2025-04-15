import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

export interface CityResponse {
  cityCode: string;
  cityName: string;
  regionCode: string;
}

export const useCitiesByRegion = (regionCode: string | undefined | null) => {
  return useQuery<CityResponse[]>({
    queryKey: ['cities', regionCode],
    queryFn: () => regionCode ? customerApi.getCitiesByRegion(regionCode) : Promise.resolve([]),
    enabled: !!regionCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export default useCitiesByRegion; 