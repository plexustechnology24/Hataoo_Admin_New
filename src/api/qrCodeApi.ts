import { api } from "../lib/api-client";
import { QrCodeResponse } from "../types/qr.types";

interface GetAllQrCodesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const generateQrCodes = async (
  quantity: number
): Promise<QrCodeResponse[]> => {
  const response = await api.post("/qr-code/generate", { quantity });

  return response.data?.data ?? response.data;
};

export const getAllQrCodes = async (
  params?: GetAllQrCodesParams
): Promise<{ data: QrCodeResponse[]; meta: any }> => {
  const response = await api.get("/qr-code", { params });
  return response.data ?? { data: [], meta: {} };
};

export const getQrCodeById = async (code: string): Promise<QrCodeResponse> => {
  const response = await api.get(`/qr-code/${code}`);
  return response.data ?? response.data;
};

export const deleteQrCode = async (id: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/qr-code/${id}`);
  return response.data ?? { success: false };
};