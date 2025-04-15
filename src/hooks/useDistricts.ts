import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

export interface DistrictResponse {
  districtCode: string;
  districtName?: string;
  districtDescription?: string;
  cityCode: string;
}

const useDistricts = (cityCode: string) => {
  return useQuery<DistrictResponse[]>({
    queryKey: ['districts', cityCode],
    queryFn: () => cityCode ? customerApi.getDistrictsByCity(cityCode) : Promise.resolve([]),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!cityCode,
  });
};

export default useDistricts; 