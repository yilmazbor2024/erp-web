import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

export interface RegionResponse {
  regionCode: string;  // This comes from StateCode in the backend
  regionDescription: string;  // This comes from StateDescription in the backend
}

export const useRegions = () => {
  return useQuery<RegionResponse[]>({
    queryKey: ['regions'],
    queryFn: () => customerApi.getRegions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export default useRegions; 