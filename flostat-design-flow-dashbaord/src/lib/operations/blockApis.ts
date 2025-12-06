// src/services/deviceService.ts

import { toast } from "sonner";
import { deviceEndpoints } from "../endPoints";
import { apiClient } from "../httpClient";
import { Block, BlockModePayload } from "@/components/types/types";


// ------------------ TYPES ------------------




export interface UpdateBlockThresholdPayload {
  block_id: string;
  threshold: number;
}

// ------------------ ENDPOINTS ------------------
const {
  CREATE_BLOCK_API,
  UPDATE_BLOCK_API,
  DELETE_BLOCK_API,
  GET_BLOCKS_OF_ORGID,
  GET_BLOCK_BY_ID,
  GET_BLOCK_MODE,
  CHANGE_BLOCK_MODE,
  UPDATE_BLOCK_THRESHOLD,
} = deviceEndpoints;

// Helper to avoid repeating Authorization header
const apiClientWithAuth = async (config: any, token: string) => {
  return apiClient({
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
};

// ------------------ API FUNCTIONS ------------------

// Create Block
export const createBlock = async (data: Partial<Block>, token: string): Promise<Block | null> => {
  const toastId = toast.loading("Creating block...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "POST",
        url: CREATE_BLOCK_API,
        bodyData: data,
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to create block");
      return null;
    }

    toast.success(res.data.message || "Block created successfully");
    return res.data.block || res.data.blocks?.[0] || null;
  } catch (error: any) {
    console.error("Error creating block:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to create block");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Update Block
export const updateBlock = async (data: Partial<Block>, token: string): Promise<Block | null> => {
  const toastId = toast.loading("Updating block...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "POST",
        url: UPDATE_BLOCK_API,
        bodyData: data,
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to update block");
      return null;
    }

    toast.success(res.data.message || "Block updated successfully");
    return res.data.block || res.data.blocks?.[0] || null;
  } catch (error: any) {
    console.error("Error updating block:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to update block");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Delete Block
export const deleteBlock = async (block_id: string, token: string): Promise<boolean> => {
  const toastId = toast.loading("Deleting block...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "POST",
        url: DELETE_BLOCK_API,
        bodyData: { block_id },
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to delete block");
      return false;
    }

    toast.success(res.data.message || "Block deleted successfully");
    return true;
  } catch (error: any) {
    console.error("Error deleting block:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to delete block");
    return false;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get Block by ID
export const getBlockById = async (block_id: string, token: string): Promise<Block | null> => {
  const toastId = toast.loading("Fetching block...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "POST",
        url: GET_BLOCK_BY_ID,
        bodyData: { block_id },
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to fetch block");
      return null;
    }

    return res.data.block || res.data.blocks?.[0] || null;
  } catch (error: any) {
    console.error("Error fetching block:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to fetch block");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get all blocks of an organization
export const getBlocksOfOrgId = async (org_id: string, token: string): Promise<Block[] | null> => {
  const toastId = toast.loading("Fetching blocks...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "POST",
        url: GET_BLOCKS_OF_ORGID,
        bodyData: { org_id },
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to fetch blocks");
      return null;
    }

    return res.data.blocks ?? [];
  } catch (error: any) {
    console.error("Error fetching blocks:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to fetch blocks");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Get Block Mode
export const getBlockMode = async (data: any, token: string): Promise<any | null> => {
  const toastId = toast.loading("Fetching block mode...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "POST",
        url: GET_BLOCK_MODE,
        bodyData: data,
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to fetch block mode");
      return null;
    }

    return res.data.block|| res.data.mode || null;
  } catch (error: any) {
    console.error("Error fetching block mode:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to fetch block mode");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Change Block Mode
export const changeMode = async (data: BlockModePayload, token: string): Promise<Block | null> => {
  const toastId = toast.loading("Changing block mode...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "PUT",
        url: CHANGE_BLOCK_MODE,
        bodyData: data,
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to change block mode");
      return null;
    }

    toast.success(res.data.message || "Block mode changed successfully");
    return res.data.block || null;
  } catch (error: any) {
    console.error("Error changing block mode:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to change block mode");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Update Block Threshold
export const updateBlockThreshold = async (
  data: UpdateBlockThresholdPayload,
  token: string
): Promise<Block | null> => {
  const toastId = toast.loading("Updating block threshold...");
  try {
    const res = await apiClientWithAuth(
      {
        method: "PUT",
        url: UPDATE_BLOCK_THRESHOLD,
        bodyData: data,
      },
      token
    );

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to update threshold");
      return null;
    }

    toast.success(res.data.message || "Threshold updated successfully");
    return res.data.updatedDevice || res.data.block || res.data.device || null;
  } catch (error: any) {
    console.error("Error updating block threshold:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to update threshold");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};