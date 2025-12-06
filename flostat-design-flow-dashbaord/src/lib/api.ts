import { OrgData } from "@/components/types/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  conformPassword?: string;
}



interface CreateDeviceData {
  name: string;
  type: string;
  location: string;
  blockId: string;
}

// Report interfaces
interface TankRelatedReportParams {
  org_id: string;
  date: string;
  tank_id: string;
}

interface DeviceReportParams {
  org_id: string;
  from_date: string;
  to_date: string;
  device_id: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  }

  async signUp(data: SignUpData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/signUp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Sign up failed');
    }

    return response.json();
  }

  // Organization endpoints
  async getOrganizations(): Promise<any> {
    // This would typically require authentication
    // For now, returning mock data
    return Promise.resolve({
      success: true,
      data: []
    });
  }

  async getUserOrganizations(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/user/getOrgsUser`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user organizations');
    }

    return response.json();
  }

  async createOrganization(orgData: OrgData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/org/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orgData),
    });

    if (!response.ok) {
      throw new Error('Failed to create organization');
    }

    return response.json();
  }

  // Device endpoints
  async getDevices(orgId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/device/getOrgDevices`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ org_id: orgId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    return response.json();
  }

  async createDevice(deviceData: CreateDeviceData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/device/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(deviceData),
    });

    if (!response.ok) {
      throw new Error('Failed to create device');
    }

    return response.json();
  }

  // User endpoints
  async getUsers(orgId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/user/getOrgsUser`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  // Report endpoints
  async getTankRelatedReport(params: TankRelatedReportParams): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/report/tankRelatedReport`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    // console.log("")

    if (!response.ok) {
      throw new Error('Failed to fetch tank related report');
    }

    return response.json();
  }

  async getDeviceReport(params: DeviceReportParams): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/report/deviceReport`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch device report');
    }

    return response.json();
  }

  // SCADA endpoints
  async getSCADAData(orgId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/device/scada/${orgId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch SCADA data');
    }

    return response.json();
  }

  async updateDeviceState(deviceId: string, orgId: string, isOn: boolean): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/device/scada/updateState`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ device_id: deviceId, org_id: orgId, isOn }),
    });

    if (!response.ok) {
      throw new Error('Failed to update device state');
    }

    return response.json();
  }

  async updateSCADAMode(orgId: string, mode: 'auto' | 'manual'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/device/scada/mode`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ org_id: orgId, mode }),
    });

    if (!response.ok) {
      throw new Error('Failed to update SCADA mode');
    }

    return response.json();
  }
}

export const apiService = new ApiService();