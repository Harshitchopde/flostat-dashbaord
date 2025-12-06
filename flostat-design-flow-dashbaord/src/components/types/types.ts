export interface AppSidebarProps {
  components: string;
  setComponents: React.Dispatch<React.SetStateAction<string>>;
}

export interface CreateUserModalProps {
  setUserModel: (open: boolean) => void;
  mode?: "add" | "remove" | "update";
  user?: { email?: string; role?: string } | null;
}

export interface User {
  org_id: string;
  email: string;
  orgName: string;
  role?: "admin" | "controller" | "guest"; // Make role optional
 status: string;
}
export interface Block{
    org_id: string;
    block_name: string;
    block_id:  string;
    location?: string;
    description?: string;
}
export interface Device {
  device_id: string;
  device_name?: string;
  device_type?: string;
  org_id?: string;
  status?: any;
  hardware_status?: string;
  current_level?: number;
  min_threshold?: number;
  max_threshold?: number;
  [key: string]: any;
}

export interface Log {
  uuid: string;
  device_type: string;
  status: string;
  last_updated?: string;
  updated_at?: string;
  timestamp?: string;
  org_id: string;
  device_id: string;
updated_by: string;
  [key: string]: any;
}
export interface ThresholdPayload {
  org_id?: string;
  device_id?: string;
  block_id?: string;
  min_threshold?: number;
  max_threshold?: number;
}

export interface OrgData {
  orgName: string;
  orgDesc?: string;
  location?: string;
}
export interface BlockModePayload {
  block_id: string;
  org_id: string;
  mode: string;
}

export interface Report {
  uuid: string;
  device_type: string;
  status: string | null;
  level: string | null;
  lastUpdated: string;
  timestamp: number;
  updatedBy: string;
  device_id?: string;
  device_name?: string;
   [key: string]: any;
}

export interface GoogleOuthResponse {
  user?: any;
  navigateTo: string;
  message: string;
  success: boolean;
  token?: string;
  state: string;
}
export interface UpdateDeviceStatusPayload {
  device_id: string;
  status?: string;
   org_id?: string;
   current_level?: string;
   device_type: string;
}

export interface Schedule {
schedule_id?: string;
 org_id?: string;
  device_id?: string;
  block_id?: string;
  device_type?: string;
  start_time?: string;
  end_time?: string;
   pump_ack?: boolean;
  valve_ack?: boolean;
  schedule_status?: string;
  ack?:boolean;
  [key: string]: any;
}



export interface SignUpPayload {
  email: string;
  password: string;
 firstName:string;
  lastName: string;
  conformPassword: string;
}
