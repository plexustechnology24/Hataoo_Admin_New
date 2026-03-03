export interface EmergencyDetails {
  emergencyContacts: string[];
  bloodGroup?: string | null;
  healthInsuranceCompany?: string | null;
  notes?: string | null;
}

export interface QrCodeResponse {
  _id: string;
  code: string;
  qrLink: string;
  qrImage: string;
  isActive: boolean;

  language?: string;
  carNumberPlate?: string;
  name?: string;
  contactNumber?: string;
  emergencyDetails?: EmergencyDetails;

  createdAt: string;
  updatedAt: string;
}