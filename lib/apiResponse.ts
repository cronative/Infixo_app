import { NextResponse } from "next/server";

export interface StandardApiResponse<T = Record<string, unknown>> {
  status: 0 | 1;
  message: string;
  data: T;
}

/**
 * Returns a standardized success response:
 * {
 *   status: 1,
 *   message: string,
 *   data: T
 * }
 */
export function apiSuccess<T = Record<string, unknown>>(
  data: T = {} as T,
  message: string = "Operation completed successfully.",
  init?: ResponseInit
): NextResponse<StandardApiResponse<T>> {
  return NextResponse.json(
    {
      status: 1,
      message,
      data: data ?? ({} as T),
    },
    {
      status: init?.status ?? 200,
      headers: init?.headers,
    }
  );
}

/**
 * Returns a standardized failure response:
 * {
 *   status: 0,
 *   message: string,
 *   data: T
 * }
 */
export function apiError<T = Record<string, unknown>>(
  message: string = "Something went wrong. Please try again.",
  statusCode: number = 400,
  data: T = {} as T,
  init?: ResponseInit
): NextResponse<StandardApiResponse<T>> {
  return NextResponse.json(
    {
      status: 0,
      message,
      data: data ?? ({} as T),
    },
    {
      status: statusCode,
      headers: init?.headers,
    }
  );
}
