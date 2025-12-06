// src/services/tankReportService.ts
import {toast} from "sonner";
import { deviceEndpoints, reportEndpoints } from "../endPoints";
import { apiClient } from "../httpClient";


const { TANK_RELATED_REPORT } = reportEndpoints;
const { GET_TANK_OF_ORG } = deviceEndpoints;

// ------------------ TYPES ------------------
export interface TankReportPayload {
  org_id?: string;
  [key: string]: any;
}

export interface TankDevice {
  id: string;
  org_id: string;
  name: string;
  status?: string;
  [key: string]: any;
}

// ------------------ API FUNCTIONS ------------------

// Fetch tank-related reports
export const getTankDeviceReports = async (
  data: TankReportPayload,
  token?: string
): Promise<any> => {
  const toastId = toast.loading("Loading...");

  try {
    const res = await apiClient({
      method: "POST",
      url: TANK_RELATED_REPORT,
      bodyData: data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.data?.success) {
      console.error(res.data.message || "Error in getTankDeviceReports");
      return null;
    }

    return res.data;
  } catch (error: any) {
    console.error("Error in getTankDeviceReports:", error);

    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Error in getTankDeviceReports"
    );

    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};

// Fetch all tanks for an organization
export const getTankOfOrg = async (
  data: TankReportPayload,
  token?: string
): Promise<TankDevice[] | null> => {
  const toastId = toast.loading("Loading...");

  try {
    const res = await apiClient({
      method: "POST",
      url: GET_TANK_OF_ORG,
      bodyData: data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.data?.success) {
      console.error(res.data.message || "Error in getTankOfOrg");
      return null;
    }

    return res.data?.device ?? [];
  } catch (error: any) {
    console.error("Error in getTankOfOrg:", error);

    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Error in getTankOfOrg"
    );

    return null;
  } finally {
    toast.dismiss(toastId);
  }
};
