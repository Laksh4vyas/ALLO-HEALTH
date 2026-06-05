import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400, code?: string) {
  return NextResponse.json<ApiError>(
    { success: false, error, ...(code ? { code } : {}) },
    { status }
  );
}
