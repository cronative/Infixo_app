/**
 * Standard Inflixo API Response contract:
 * status = 1 -> success
 * status = 0 -> failure
 */
export interface ApiResponse<T = Record<string, unknown>> {
  status: 0 | 1;
  message: string;
  data: T;
}
