export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string | Record<string, any>;
  timestamp: string;
}
