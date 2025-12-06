// src/services/orgService.ts

import { toast } from "sonner";
import { orgEndpoints } from "../endPoints";
import { apiClient } from "../httpClient";
import { Log, ThresholdPayload } from "@/components/types/types";


// ------------------ TYPES ------------------
export interface Org {
  email: string;
  laptop_fcm?: string;
  orgName: string;
  status: string;
  org_id: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// export interface Topic {
//   id: string;
//   name: string;
// }





// ------------------ API FUNCTIONS ------------------

// Update Org Threshold
export const updateOrgThreshold = async (
  data: ThresholdPayload,
  token: string
): Promise<any | null> => {
  const toastId = toast.loading("Updating threshold...");

  try {
    const res = await apiClient({
      method: "PUT",
      url: orgEndpoints.UPDATE_ORG_THRESHOLD,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message);
    return res.data.updatedDevice;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update threshold"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get all users of org
export const getAllUsersForOrg = async (
  org_id: string,
  token: string
): Promise<User[] | null> => {
  const toastId = toast.loading("Fetching users...");
  const url = orgEndpoints.GET_ALL_USERS_FOR_ORG.replace(":org_id", org_id);

  try {
    const res = await apiClient({
      method: "GET",
      url,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message || "Users fetched successfully");
    return res.data.users;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch users"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Create org
export const createOrg = async (
  data: Partial<Org>,
  token: string
): Promise<Org | null> => {
  const toastId = toast.loading("Creating organization...");

  try {
    const res = await apiClient({
      method: "POST",
      url: orgEndpoints.CREATE_ORG,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message || "Organization created successfully");
    return res.data.orgs;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create organization"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Update org
export const updateOrg = async (
  org_id: string,
  data: Partial<Org>,
  token: string
): Promise<Org | null> => {
  const toastId = toast.loading("Updating organization...");
  const url = orgEndpoints.UPDATE_ORG.replace(":org_id", org_id);

  try {
    const res = await apiClient({
      method: "PUT",
      url,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message || "Organization updated successfully");
    return res.data.orgs;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update organization"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get single org
export const getSingleOrg = async (
  org_id: string,
  token: string
): Promise<Org | null> => {
  const toastId = toast.loading("Fetching organization...");
  const url = orgEndpoints.GET_SINGLE_ORG.replace(":org_id", org_id);

  try {
    const res = await apiClient({
      method: "GET",
      url,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message || "Organization fetched successfully");
    return res.data.orgs;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch organization"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Delete org
export const deleteOrg = async (
  org_id: string,
  token: string
): Promise<Org | null> => {
  const toastId = toast.loading("Deleting organization...");
  const url = orgEndpoints.DELETE_ORG.replace(":org_id", org_id);

  try {
    const res = await apiClient({
      method: "DELETE",
      url,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message || "Organization deleted successfully");
    return res.data.orgs;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete organization"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get org topics
export const getOrgTopics = async (
  org_id: string,
  token: string
): Promise<string[] | null> => {
  const toastId = toast.loading("Fetching topics...");
  const url = orgEndpoints.GET_ORG_TOPICS.replace(":org_id", org_id);

  try {
    const res = await apiClient({
      method: "GET",
      url,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    toast.success(res.data.message || "Topics fetched successfully");
    return res.data.topics;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch topics"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Logs org topics
export const logsOrgTopics = async (
  data: any,
  token: string
): Promise<Log[] | null> => {
  const toastId = toast.loading("Fetching logs...");

  try {
    const res = await apiClient({
      method: "POST",
      url: orgEndpoints.LOGS_ORG_TOPICS,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }

    return res.data.logs;

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch logs"
    );
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};
