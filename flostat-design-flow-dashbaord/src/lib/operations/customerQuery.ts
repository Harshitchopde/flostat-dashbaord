// src/services/queryService.ts
import {toast} from "sonner";
import { querySupportEndpoints } from "../endPoints";
import { apiClient } from "../httpClient";

// ------------------ TYPES ------------------
export interface CustomerQuery {
  query_id: string;
  org_id: string;
  created_by: string;
  created_at: string;
  queryType: string;
  description: string;
  attachment?: string;
  status: string;
  messages?: ChatMessage[];
  updated_by?: string;
  updated_at?: string;
}

export interface ChatMessage {
  timestamp: string;
  user: string;
  userType: 'CUSTOMER' | 'FLOSTAT';
  message: string;
}

// ------------------ API FUNCTIONS ------------------
const {
  CREATE_QUERY_API,
  UPDATE_QUERY_API,
  DELETE_QUERY_API,
  GET_QUERY_API,
  GET_ALL_ORG_QUERY_API,
  CUSTOMER_SUPPORT_CHAT_API,
} = querySupportEndpoints;

// Create Query
export const createQuery = async (
  data: Partial<CustomerQuery>,
  org_id: string,
  token: string
): Promise<CustomerQuery | null> => {
  const toastId = toast.loading("Creating query...");
  try {
    const res = await apiClient({
      method: "POST",
      url: CREATE_QUERY_API,
      bodyData: data,
      headers: {
        Authorization: `Bearer ${token}`,
        org_id
      },
    });

    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }
    toast.success(res.data.message);
    return res.data.customerQuery;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || "Failed to create query");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Update Query
export const updateQuery = async (
  data: Partial<CustomerQuery>,
  token: string
): Promise<CustomerQuery | null> => {
  const toastId = toast.loading("Updating query...");
  try {
    const res = await apiClient({
      method: "PUT",
      url: UPDATE_QUERY_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }
    toast.success(res.data.message);
    return res.data.customerQuery;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || "Failed to update query");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Delete Query
export const deleteQuery = async (
  data: { id: string },
  token: string
): Promise<CustomerQuery | null> => {
  const toastId = toast.loading("Deleting query...");
  try {
    const res = await apiClient({
      method: "DELETE",
      url: DELETE_QUERY_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }
    toast.success(res.data.message);
    return res.data.customerQuery ?? null;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || "Failed to delete query");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get Query
export const getQuery = async (
  data: { id: string },
  token: string
): Promise<CustomerQuery | null> => {
  const toastId = toast.loading("Fetching query...");
  try {
    const res = await apiClient({
      method: "POST",
      url: GET_QUERY_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }
    toast.success(res.data.message);
    return res.data.customerQuery ?? null;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || "Failed to fetch query");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get all queries of an org
export const getAllOrgQuery = async (
  data: { org_id: string },
  token: string
): Promise<CustomerQuery[] | null> => {
  const toastId = toast.loading("Fetching all queries...");
  try {
    const res = await apiClient({
      method: "POST",
      url: GET_ALL_ORG_QUERY_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }
    toast.success(res.data.message);
    return res.data.customerQuerys ?? [];
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || "Failed to fetch queries");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Customer Support Chat
export const customerSupportChat = async (
  data: { query_id: string; message: string },
  token: string
): Promise<ChatMessage[] | null> => {
  const toastId = toast.loading("Sending message...");
  try {
    const res = await apiClient({
      method: "POST",
      url: CUSTOMER_SUPPORT_CHAT_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.data.success) {
      toast.error(res.data.message);
      return null;
    }
    toast.success(res.data.message);
    return res.data.chats ?? [];
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || "Failed to send message");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};
