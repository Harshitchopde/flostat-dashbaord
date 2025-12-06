// src/services/authService.ts

import { apiClient } from "../httpClient";
import { authEndpoints } from "../endPoints";
import { setSignUpData, setToken } from "@/slice/authSlice";
import { RootState } from "@/store";
import { AnyAction, ThunkAction } from "@reduxjs/toolkit";
import { GoogleOuthResponse, SignUpPayload } from "@/components/types/types";
import { toast } from "sonner";


// ------------------ TYPES ------------------
export interface SendOtpPayload {
  phoneNumber: string;
}

export interface VerifyOtpPayload {
  phoneNumber: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}



export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Helper (optional but clean) — no token needed for public auth endpoints
const apiPost = async (url: string, bodyData: any) => {
  return apiClient({
    method: "POST",
    url,
    bodyData,
  });
};

// ------------------ API FUNCTIONS ------------------

// Send OTP
export const sendOtp = async (payload: SendOtpPayload): Promise<boolean> => {
  const toastId = toast.loading("Sending OTP...");
  try {
    const res = await apiPost(authEndpoints.SEND_OTP_API, payload);

    if (!res.data.success) {
      toast.error(res.data.message || "Failed to send OTP");
      return false;
    }

    toast.success(res.data.message || "OTP sent successfully");
    return true;
  } catch (error: any) {
    console.error("Send OTP error:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to send OTP");
    return false;
  } finally {
    toast.dismiss(toastId);
  }
};

// Verify OTP
export const verifyOtp = async (payload: VerifyOtpPayload): Promise<boolean> => {
  const toastId = toast.loading("Verifying OTP...");
  try {
    const res = await apiPost(authEndpoints.VERIFY_OTP_API, payload);

    if (!res.data.success) {
      toast.error(res.data.message || "Invalid or expired OTP");
      return false;
    }

    toast.success(res.data.message || "OTP verified successfully");
    return true;
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to verify OTP");
    return false;
  } finally {
    toast.dismiss(toastId);
  }
};

// Login
export const login = async (payload: LoginPayload): Promise<LoginResponse | null> => {
  const toastId = toast.loading("Logging in...");
  try {
    const res = await apiPost(authEndpoints.LOGIN_API, payload);

    if (!res.data.success) {
      toast.error(res.data.message || "Invalid credentials");
      return null;
    }

    toast.success(res.data.message || "Login successful");
    return res.data.data as LoginResponse;
  } catch (error: any) {
    console.error("Login error:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to login");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Sign Up
export const signUp = async (payload: SignUpPayload): Promise<LoginResponse | null> => {
  const toastId = toast.loading("Creating account...");
  try {
    const res = await apiPost(authEndpoints.SIGN_UP_API, payload);
    if (!res.data.success) {
      toast.error(res.data.message || "Failed to sign up");
      return null;
    }

    toast.success(res.data.message || "Account created successfully");
    return res.data.data as LoginResponse;
  } catch (error: any) {
    console.error("Sign up error:", error);
    toast.error(error?.response?.data?.message || error?.message || "Failed to sign up");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

// Google OAuth Login
export const googleOAuthLogin = async (token: string): Promise<LoginResponse | null> => {
  const toastId = toast.loading("Logging in with Google...");
  try {
    const res = await apiPost(authEndpoints.GOOGLE_OUTH_API, { token });

    if (!res.data.success) {
      toast.error(res.data.message || "Google login failed");
      return null;
    }

    toast.success(res.data.message || "Logged in with Google");
    return res.data.data as LoginResponse;
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    toast.error(error?.response?.data?.message || error?.message || "Google login failed");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
};

type NavigateFunction = (path: string) => void;
export const googleOuth = (
  email: string,
  user: any, // You can refine the user type if needed
  navigate: NavigateFunction
): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");


    try {
      const res = await apiPost(authEndpoints.GOOGLE_OUTH_API,{email});
      console.log("REspon:outh ",res);

      if (!res.data?.success) {
        toast.error("Error during Google authentication");
        return;
      }

      dispatch(setSignUpData({ email }));

      if (res.data.state === "login") {
        console.log("Login state: ",res.data)
        if (res.data.token) {
          const userData = res.data?.user;
          const userObj = {
          id: userData?.id || userData?.email, // Use server-provided ID if available
          email: userData?.email,
          name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'User'
        };
          localStorage.setItem('user', JSON.stringify(userObj));
          dispatch(setToken(res.data.token));
          localStorage.setItem("flostatToken", JSON.stringify(res.data.token));
          console.log("Now navigate to org")
          navigate("/organizations");
        } else {
          toast.error("Token missing in response");
        }
      } else {
        navigate("/complete-profile");
      }
    } catch (error: any) {
      console.error("Error in googleOuth:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to authenticate with Google";
      toast.error(errorMessage);
    } finally {
      
      toast.dismiss(toastId);
    }
  };
};