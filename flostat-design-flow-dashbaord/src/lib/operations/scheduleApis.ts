
import { toast } from "sonner";
import { orgEndpoints } from "../endPoints";
import { apiClient } from "../httpClient";
import { Schedule } from "@/components/types/types";

// Extract endpoints
const {
  CREATE_SCHEDULES,
  UPDATE_SCHEDULES,
  DELETE_SCHEDULES,
  GET_SCHEDULES_BY_ORG_ID,
  GET_SCHEDULES_BY_ID,
} = orgEndpoints;

// ---------- Interfaces ---------- //

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  schedule?: T;
  schedules?: T[];
  logs?: any;
}

// ---------- CREATE SCHEDULE ---------- //
export const createSchedule = async (
  data: any,
  token: string
): Promise<Schedule | null> => {
  const toastId = toast.loading("Loading...");
  let result: Schedule | null = null;
  console.log("SEding data create: ",data)
  try {
    const res = await apiClient({
      method: "POST",
      url: CREATE_SCHEDULES,
      bodyData: data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("RESP of schedule create: ",res);
    const response: ApiResponse<Schedule> = res.data;

    if (!response.success) {
      toast.error(response.message || "Failed to create schedule");
      return null;
    }

    result = response.schedule || null;
    toast.success(response.message || "Schedule created successfully");
  } catch (error: any) {
    console.error("Error in createSchedule:", error);
    if (error?.response?.status === 409) {
      toast.error(("Schedule conflict: "+error?.response?.data?.message )|| "Schedule conflict: A schedule already exists for this time range.");
    } else {
      console.log("Show toast")
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Unexpected error while creating schedule"
      );
    }
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};

// ---------- UPDATE SCHEDULE ---------- //
export const updateSchedule = async (
  data: any,
  token: string
): Promise<Schedule | null> => {
  const toastId = toast.loading("Loading...");
  let result: Schedule | null = null;

  try {
    console.log("Sending data: ",data)
    const res = await apiClient({
      method: "PUT",
      url: UPDATE_SCHEDULES,
      bodyData: data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("REsponse: ",res);
    const response: ApiResponse<Schedule> = res.data;

    if (!response.success) {
      toast.error(response.message || "Failed to update schedule");
      return null;
    }

    result = response.schedule || null;
    toast.success(response.message || "Schedule updated successfully");
  } catch (error: any) {
    console.error("Error in updateScheduleApis:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error while updating schedule"
    );
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};

// ---------- DELETE SCHEDULE ---------- //
export const deleteScheduleCall = async (
  data: any,
  token: string
): Promise<Schedule | null> => {
  const toastId = toast.loading("Loading...");
  let result: Schedule | null = null;

  try {
    const res = await apiClient({
      method: "DELETE",
      url: DELETE_SCHEDULES,
      bodyData: data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const response: ApiResponse<Schedule> = res.data;

    if (!response.success) {
      toast.error(response.message || "Failed to delete schedule");
      return null;
    }

    result = response.schedule || null;
  } catch (error: any) {
    console.error("Error in deleteScheduleCall:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error while deleting schedule"
    );
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};

// ---------- GET SCHEDULES BY ORG ID ---------- //
export const getScheduleByOrgId = async (
  data: any,
  token: string
): Promise<Schedule[] | null> => {
  const toastId = toast.loading("Loading...");
  let result: Schedule[] | null = null;

  try {
    const res = await apiClient({
      method: "POST",
      url: GET_SCHEDULES_BY_ORG_ID,
      bodyData: data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const response: ApiResponse<Schedule> = res.data;

    if (!response.success) {
      toast.error(response.message || "Failed to fetch schedules");
      return null;
    }

    result = response.schedules || null;
    toast.success(response.message || "Schedules fetched successfully");
  } catch (error: any) {
    console.error("Error in getScheduleByOrgId:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error while fetching schedules"
    );
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};

// ---------- GET SCHEDULE BY ID ---------- //
export const getScheduleById = async (
  data: any,
  token: string
): Promise<any> => {
  const toastId = toast.loading("Loading...");
  let result: any = null;

  try {
    const res = await apiClient({
      method: "POST",
      url: GET_SCHEDULES_BY_ID,
      bodyData: data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const response: ApiResponse<any> = res.data;

    if (!response.success) {
      toast.error(response.message || "Failed to fetch schedule logs");
      return null;
    }

    result = response.logs || null;
  } catch (error: any) {
    console.error("Error in getScheduleById:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error while fetching schedule by ID"
    );
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};
