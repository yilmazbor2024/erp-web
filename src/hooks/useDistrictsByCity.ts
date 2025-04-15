import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

export interface DistrictResponse {
  districtCode: string;
  districtDescription: string;
  cityCode: string;
  isBlocked: boolean;
}

export const useDistrictsByCity = (cityCode: string | undefined | null) => {
  return useQuery<DistrictResponse[]>({
    queryKey: ['districts', cityCode],
    queryFn: () => cityCode ? customerApi.getDistrictsByCity(cityCode) : Promise.resolve([]),
    enabled: !!cityCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export default useDistrictsByCity; 