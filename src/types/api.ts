export interface ApiResponse<T = any> {
  isSuccess: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  statusCode?: number;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
