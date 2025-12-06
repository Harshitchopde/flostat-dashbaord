import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Droplets,
  Gauge,
  ThermometerSun,
  Power,
  AlertTriangle,
  Settings,
  Waves,
  Container,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { BlockSelector } from "@/components/BlockSelector";
import { Block, Device } from "@/components/types/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { changeMode, getBlockMode, getBlocksOfOrgId } from "@/lib/operations/blockApis";
import { setBlockMode, setBlocks, setBlocksName, setCurrentBlock } from "@/slice/orgSlice";
import { AppDispatch, RootState } from "@/store";
import ScadaFlow from "@/components/scada/ScadaFlow";
import { stat } from "fs";
import { DEVICE_TYPE, PUMP_STATUS, VALVE_STATUS } from "@/utils/constants";
import { SingleBlockSelector } from "@/components/SingleBlockSelector";
import { StatusDeviceBadge } from "@/components/StatusDeviceBadge";
import { handleDeviceUpdate } from "@/utils/handlers";

const tanks = [
  {
    id: 1,
    name: "Tank 4",
    level: 1,
    status: "error" as const,
    position: { top: 20, left: 8 },
  },
  {
    id: 2,
    name: "Tank Staff gas",
    level: 5,
    status: "error" as const,
    position: { top: 20, left: 16 },
  },
  {
    id: 3,
    name: "Tank AHub",
    level: 23,
    status: "error" as const,
    position: { top: 20, left: 24 },
  },
  {
    id: 4,
    name: "Tank 4",
    level: 45,
    status: "active" as const,
    position: { top: 20, left: 32 },
  },
  {
    id: 5,
    name: "Tank 5",
    level: 56,
    status: "active" as const,
    position: { top: 20, left: 40 },
  },
  {
    id: 6,
    name: "Tank 6",
    level: 67,
    status: "active" as const,
    position: { top: 20, left: 48 },
  },
  {
    id: 7,
    name: "Tank 1",
    level: 78,
    status: "active" as const,
    position: { top: 20, left: 56 },
  },
  {
    id: 8,
    name: "Tank 3",
    level: 89,
    status: "error" as const,
    position: { top: 20, left: 64 },
  },
  {
    id: 9,
    name: "Tank 2",
    level: 34,
    status: "active" as const,
    position: { top: 20, left: 72 },
  },
  {
    id: 10,
    name: "Tank 10",
    level: 100,
    status: "active" as const,
    position: { top: 20, left: 80 },
  },
  {
    id: 11,
    name: "device 7",
    level: 77,
    status: "active" as const,
    position: { top: 20, left: 88 },
  },
  {
    id: 12,
    name: "Tank 17",
    level: 46,
    status: "error" as const,
    position: { top: 20, left: 96 },
  },
  {
    id: 13,
    name: "Tank 9",
    level: 73,
    status: "active" as const,
    position: { top: 20, left: 104 },
  },
];

const pumps = [
  {
    id: 1,
    name: "Pump 1",
    rpm: 0,
    status: "inactive" as const,
    position: { top: 55, left: 30 },
  },
  {
    id: 2,
    name: "Pump 4",
    rpm: 0,
    status: "inactive" as const,
    position: { top: 55, left: 45 },
  },
  {
    id: 3,
    name: "Pump 3",
    rpm: 0,
    status: "active" as const,
    position: { top: 55, left: 60 },
  },
  {
    id: 4,
    name: "Pump 5",
    rpm: 0,
    status: "error" as const,
    position: { top: 55, left: 75 },
  },
];

const motors = [
  {
    id: 1,
    name: "motor 10PP",
    status: "active" as const,
    position: { top: 40, left: 30 },
  },
  {
    id: 2,
    name: "motor DOWN",
    status: "active" as const,
    position: { top: 40, left: 45 },
  },
  {
    id: 3,
    name: "motor DOWN",
    status: "active" as const,
    position: { top: 40, left: 60 },
  },
  {
    id: 4,
    name: "motor X10SS",
    status: "error" as const,
    position: { top: 40, left: 75 },
  },
];

const sumps = [
  { id: 1, name: "sump 1", level: 48, position: { top: 68, left: 38 } },
  { id: 2, name: "sump 3", level: 60, position: { top: 68, left: 65 } },
];

// Add valves
const valves = [
  {
    id: 1,
    name: "Valve 1",
    status: "active" as const,
    position: { top: 55, left: 25 },
  },
  {
    id: 2,
    name: "Valve 2",
    status: "inactive" as const,
    position: { top: 55, left: 40 },
  },
  {
    id: 3,
    name: "Valve 3",
    status: "active" as const,
    position: { top: 55, left: 55 },
  },
  {
    id: 4,
    name: "Valve 4",
    status: "active" as const,
    position: { top: 55, left: 70 },
  },
  {
    id: 5,
    name: "Valve 5",
    status: "error" as const,
    position: { top: 55, left: 85 },
  },
];

const initialDevices = [
  {
    id: 1,
    device_id: "1",
    name: "Valve 3",
    type: "valve",
    status: "active" as const,
    value: 100,
    unit: "%",
    isOn: true,
    location: "Building A - Floor 1",
    block: "Block A",
  },
  {
    id: 2,
    device_id: "2",
    name: "Valve 1",
    type: "valve",
    status: "active" as const,
    value: 100,
    unit: "%",
    isOn: true,
    location: "Building A - Floor 2",
    block: "Block A",
  },
  {
    id: 3,
    device_id: "3",
    name: "Valve 4",
    type: "valve",
    status: "active" as const,
    value: 100,
    unit: "%",
    isOn: true,
    location: "Building B - Ground",
    block: "Block B",
  },
  {
    id: 4,
    device_id: "4",
    name: "Valve 2",
    type: "valve",
    status: "inactive" as const,
    value: 0,
    unit: "%",
    isOn: false,
    location: "Building B - Floor 1",
    block: "Block B",
  },
  {
    id: 5,
    device_id: "5",
    name: "Pump 2",
    type: "pump",
    status: "active" as const,
    value: 2900,
    unit: "RPM",
    isOn: true,
    location: "Building C - Floor 1",
    block: "Block C",
  },
  {
    id: 6,
    device_id: "6",
    name: "Pump 1",
    type: "pump",
    status: "inactive" as const,
    value: 0,
    unit: "RPM",
    isOn: false,
    location: "Building C - Ground",
    block: "Block C",
  },
  {
    id: 7,
    device_id: "7",
    name: "Pump AHub",
    type: "pump",
    status: "active" as const,
    value: 3100,
    unit: "RPM",
    isOn: true,
    location: "Building D - Floor 1",
    block: "Block D",
  },
  {
    id: 8,
    device_id: "8",
    name: "Pump 3",
    type: "pump",
    status: "active" as const,
    value: 2850,
    unit: "RPM",
    isOn: true,
    location: "Building D - Floor 2",
    block: "Block D",
  },
  {
    id: 9,
    device_id: "9",
    name: "Tank 4",
    type: "tank",
    status: "inactive" as const,
    value: 1,
    unit: "%",
    isOn: true,
    location: "Storage A",
    block: "Block A",
  },
  {
    id: 10,
    device_id: "10",
    name: "Tank Staff quarters",
    type: "tank",
    status: "warning" as const,
    value: 4,
    unit: "%",
    isOn: true,
    location: "Storage B",
    block: "Block A",
  },
  {
    id: 11,
    device_id: "11",
    name: "Tank AHub",
    type: "tank",
    status: "warning" as const,
    value: 23,
    unit: "%",
    isOn: true,
    location: "Storage C",
    block: "Block D",
  },
  {
    id: 12,
    device_id: "12",
    name: "Tank 4",
    type: "tank",
    status: "active" as const,
    value: 100,
    unit: "%",
    isOn: true,
    location: "Storage D",
    block: "Block D",
  },
];

export default function SCADA() {
  const { currentOrganization, authToken } = useAuth();
  const [devices, setDevices] = useState(initialDevices);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { blocksName,blockModes,currentBlock, blocks } = useSelector((state: RootState) => state.org);
  const [selectedBlocks, setSelectedBlocks] = useState<string>(currentBlock?currentBlock:"");
  // SCADA operating mode: 'auto' disables manual device interaction; 'manual' enables it.
  // const [scadaMode, setScadaMode] = useState<string>("manual");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false); // Initialize as false for manual mode
  const devicesAll = useSelector((state: RootState) => state.device.devices);
  const orgId= useSelector((state: RootState) => state.org.org_id);
  const {token}= useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  // console.log("Devices :", blocksName);
  const filterValveAndPump = devicesAll.filter(
    (device) =>
      device.device_type === DEVICE_TYPE.PUMP ||
      device.device_type === DEVICE_TYPE.VALVE
  );
  // Filter devices based on selected blocks and include connected devices
  const filteredDevices = useMemo(() => {
    console.log("CHANGE");
    if (!selectedBlocks) return filterValveAndPump;
    // get block mode
    const fetchBlockMode = async(block_id)=>{
      const data = {
        block_id,org_id:orgId
      }
      const result = await getBlockMode(data,token);
      console.log("REsult : ",result);
      if(result){
        dispatch(setBlockMode(result))
        //  setScadaMode(result.mode)
      }
    }
    if(!blockModes[selectedBlocks]){
      if(!orgId){
        toast.error("Org is missing..");
        return;
      }
      fetchBlockMode(selectedBlocks);
    }else{
      // console.log("Mode f")
      // setScadaMode(blockModes[selectedBlocks])
    }
    // Get devices from selected blocks
    const directDevices = filterValveAndPump.filter(
      (device) => device.block_id === selectedBlocks
    );
    console.log("Filter block device : ", directDevices);
    // Include connected devices to show complete systems
    // For this demo, we'll include all devices to show complete flow
    // In a real system, you would implement proper connection logic
    return directDevices;
  }, [devicesAll, selectedBlocks]);

  //  console.log("Mode of curr scada: ",scadaMode)
    console.log("Mode of curr block: ",blockModes[selectedBlocks])
  // Dummy blocks data
  const dummyBlocks = blocks;
  // Remove the automatic data fetching from useEffect
  useEffect(() => {
    // No automatic fetching for blocks with dummy data
  }, []);

  // Remove the fetchOrganizationBlocks function since we're using dummy data


  const handleModeChange = async (mode: "auto" | "manual") => {
    // setScadaMode(mode);

    if (!currentOrganization?.org_id) {
      // No organization selected, just update local state
      console.warn("Org not missing hai");
      toast.error("Org is missing")
      return;
    }
    if(!selectedBlocks){
      console.log("Select block");
      toast.error("Block is required!");
      return;
    }
    try {
      // Call backend API to update the SCADA mode
      const data = {
        org_id:currentOrganization?.org_id,
        block_id:selectedBlocks,
        mode
      }
     const result = await changeMode(data,token);
     console.log("RESULT MODE CHANGE: ",result);
     if(result){
        // dispatch(setBlockMode(result))
       toast.success(`SCADA mode changed to ${mode}`);
     }
    } catch (error) {
      toast.error("Failed to change SCADA mode");
      console.error("Update SCADA mode error:", error);
      // Don't revert mode change on error, let user decide
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--aqua))] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SCADA Control</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and control interface
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <SingleBlockSelector
            availableBlocks={dummyBlocks}
            selectedBlock={selectedBlocks}
            onBlockChange={(block)=>{
              setSelectedBlocks(block);
              dispatch(setCurrentBlock(block));
            }}
            label="Block"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mode:</label>
            <ToggleGroup
              type="single"
              value={blockModes[selectedBlocks]}
              onValueChange={(val) =>
                val && handleModeChange(val as "auto" | "manual")
              }
              className="bg-muted/40 rounded-md p-0.5 border"
            >
              <ToggleGroupItem
                value="auto"
                className="data-[state=on]:bg-[hsl(var(--aqua))] data-[state=on]:text-white text-xs h-8 px-3"
              >
                Auto
              </ToggleGroupItem>
              <ToggleGroupItem
                value="manual"
                className="data-[state=on]:bg-[hsl(var(--aqua))] data-[state=on]:text-white text-xs h-8 px-3"
              >
                Manual
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main SCADA Visualization */}
        <Card className="shadow-elevation-2">
          <CardContent className="p-0">
            <div className="relative h-[600px] bg-background border-2 border-[hsl(var(--aqua))] rounded-lg overflow-auto">
              <svg
                className="w-full h-full"
                viewBox="0 0 1200 600"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Connection Lines from Tanks to Motors */}
                <g
                  className="connections"
                  stroke="hsl(var(--aqua))"
                  strokeWidth="2"
                  fill="none"
                >
                  {/* Tank to Motor connections */}
                  <line x1="100" y1="180" x2="360" y2="260" opacity="0.6" />
                  <line x1="200" y1="180" x2="360" y2="260" opacity="0.6" />
                  <line x1="300" y1="180" x2="360" y2="260" opacity="0.6" />
                  <line x1="400" y1="180" x2="360" y2="260" />
                  <line x1="500" y1="180" x2="540" y2="260" />
                  <line x1="600" y1="180" x2="540" y2="260" opacity="0.3" />
                  <line x1="700" y1="180" x2="540" y2="260" opacity="0.3" />
                  <line x1="700" y1="180" x2="720" y2="260" />
                  <line x1="800" y1="180" x2="720" y2="260" />
                  <line x1="900" y1="180" x2="720" y2="260" opacity="0.3" />
                  <line x1="900" y1="180" x2="900" y2="260" />
                  <line x1="1000" y1="180" x2="900" y2="260" opacity="0.3" />
                  <line x1="1100" y1="180" x2="900" y2="260" />

                  {/* Motor to Pump connections */}
                  <line x1="360" y1="290" x2="360" y2="350" />
                  <line x1="540" y1="290" x2="540" y2="350" />
                  <line x1="720" y1="290" x2="720" y2="350" />
                  <line x1="900" y1="290" x2="900" y2="350" />

                  {/* Pump to Sump connections */}
                  <line x1="360" y1="380" x2="460" y2="460" />
                  <line x1="540" y1="380" x2="460" y2="460" opacity="0.3" />
                  <line x1="720" y1="380" x2="780" y2="460" />
                  <line x1="900" y1="380" x2="780" y2="460" opacity="0.3" />
                </g>

                {/* Tanks (Top Row) */}
                {tanks.map((tank, idx) => (
                  <g
                    key={tank.id}
                    transform={`translate(${80 + idx * 100}, 120)`}
                  >
                    {/* Tank body */}
                    <rect
                      x="-30"
                      y="0"
                      width="60"
                      height="80"
                      rx="8"
                      className={`cursor-pointer transition-all ${
                        tank.status === "error"
                          ? "fill-destructive/80"
                          : "fill-[hsl(var(--aqua))]/80"
                      }`}
                      stroke={
                        tank.status === "error"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--aqua))"
                      }
                      strokeWidth="2"
                    />
                    {/* Fill level */}
                    <rect
                      x="-25"
                      y={75 - tank.level * 0.65}
                      width="50"
                      height={tank.level * 0.65}
                      className={
                        tank.status === "error"
                          ? "fill-destructive"
                          : "fill-[hsl(var(--aqua))]"
                      }
                      opacity="0.9"
                    />
                    {/* Tank name */}
                    <text
                      x="0"
                      y="95"
                      textAnchor="middle"
                      className="fill-foreground text-[10px] font-medium"
                    >
                      {tank.name}
                    </text>
                    {/* Level percentage */}
                    <text
                      x="0"
                      y="107"
                      textAnchor="middle"
                      className="fill-foreground text-[9px]"
                    >
                      ({tank.level}%)
                    </text>
                  </g>
                ))}

                {/* Motors (Middle Row) */}
                {motors.map((motor, idx) => (
                  <g
                    key={motor.id}
                    transform={`translate(${340 + idx * 180}, 260)`}
                  >
                    <rect
                      x="-40"
                      y="0"
                      width="80"
                      height="30"
                      rx="4"
                      className={`cursor-pointer ${
                        motor.status === "error"
                          ? "fill-destructive/80"
                          : "fill-success/80"
                      }`}
                      stroke={
                        motor.status === "error"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--success))"
                      }
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="20"
                      textAnchor="middle"
                      className="fill-white text-[9px] font-medium"
                    >
                      {motor.name}
                    </text>
                  </g>
                ))}

                {/* Pumps (Below Motors) */}
                {pumps.map((pump, idx) => (
                  <g
                    key={pump.id}
                    transform={`translate(${340 + idx * 180}, 350)`}
                  >
                    <circle
                      cx="0"
                      cy="15"
                      r="25"
                      className={`cursor-pointer ${
                        pump.status === "error"
                          ? "fill-destructive/80"
                          : pump.status === "active"
                          ? "fill-success/80"
                          : "fill-muted/80"
                      }`}
                      stroke={
                        pump.status === "error"
                          ? "hsl(var(--destructive))"
                          : pump.status === "active"
                          ? "hsl(var(--success))"
                          : "hsl(var(--muted))"
                      }
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="20"
                      textAnchor="middle"
                      className="fill-white text-[8px] font-semibold"
                    >
                      {pump.name}
                    </text>
                  </g>
                ))}

                {/* Valves (Below Pumps) */}
                {devices
                  .filter((device) => device.type === "valve")
                  .map((device, idx) => (
                    <g
                      key={device.id}
                      transform={`translate(${220 + idx * 160}, 420)`}
                    >
                      <rect
                        x="-30"
                        y="0"
                        width="60"
                        height="30"
                        rx="4"
                        className={`cursor-pointer ${
                          device.status === "inactive"
                            ? "fill-muted/80"
                            : "fill-success/80"
                        }
                        `}
                        stroke={
                          device.status === "inactive"
                            ? "hsl(var(--muted))"
                            : "hsl(var(--success))"
                        }
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        className="fill-white text-[8px] font-semibold"
                      >
                        {device.name}
                      </text>
                    </g>
                  ))}

                {/* Sumps (Bottom Row) */}
                {sumps.map((sump, idx) => (
                  <g
                    key={sump.id}
                    transform={`translate(${440 + idx * 320}, 460)`}
                  >
                    <rect
                      x="-50"
                      y="0"
                      width="100"
                      height="50"
                      rx="6"
                      className="fill-[hsl(var(--primary))]/80 cursor-pointer"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="25"
                      textAnchor="middle"
                      className="fill-white text-[10px] font-medium"
                    >
                      {sump.name}
                    </text>
                    <text
                      x="0"
                      y="38"
                      textAnchor="middle"
                      className="fill-white text-[9px]"
                    >
                      ({sump.level}%)
                    </text>
                  </g>
                ))}
              </svg>

              {/* Info Footer */}
              <div className="absolute bottom-4 left-4">
                <Badge variant="outline" className="bg-card/90 backdrop-blur">
                  <Activity className="h-3 w-3 mr-1.5 text-success" />
                  Flow: Sump → Pump → Valve → Tank (Smart Connections)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side Panel */}
        <div className="space-y-4">
          {/* Device List */}
          <Card className="shadow-elevation-2 flex-1">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <CardTitle className="text-base">Device Controls</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-auto">
              {filteredDevices.map((device) => (
                <div
                  key={device.device_id}
                  className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedDevice?.device_id === device.device_id
                      ? "bg-muted/80 border-l-4 border-l-[hsl(var(--aqua))]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-medium text-sm cursor-pointer"
                      onClick={() => setSelectedDevice(device)}
                    >
                      {device.device_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{device.type}</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {device.value} {device.unit}
                      </span>
                      <span className="text-sm font-medium">
                        {device?.device_type === "valve" &&
                          (device.status === VALVE_STATUS.OPEN ? VALVE_STATUS.OPEN : VALVE_STATUS.CLOSE)}
                        {device?.device_type === "pump" &&
                          (device.status === PUMP_STATUS.ON ? PUMP_STATUS.ON : PUMP_STATUS.OFF)}
                      </span>
                      <div className="flex flex-col">
                            <StatusDeviceBadge
                                      status={device.hardware_status==="connected"?"connected":"disconnected"}
                                      
                                    />

                          {(device.device_type === "valve" ||
                        device.device_type === "pump") && (
                         
                        <Switch
                          checked={
                            device.status === PUMP_STATUS.ON ||
                            device.status === VALVE_STATUS.OPEN
                          }
                          onCheckedChange={(state) => {
                            console.log("CLick to change state: ",state)
                            handleDeviceUpdate(token,device,state)
                            // togglePower(device.id);
                          }}
                          disabled={blockModes[selectedBlocks] === "auto"}
                        />
                      )}
                      </div>
                    
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Filtered Diagram - appears when blocks are selected */}
          {selectedBlocks && (
            <Card className="shadow-elevation-2 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[hsl(var(--aqua))]" />
                  Filtered View for Selected Blocks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[600px] bg-background border-2 border-[hsl(var(--aqua))] rounded-lg overflow-auto">
                  {/* Production-style header */}
                  <div className="absolute top-2 left-2 right-2 z-10 bg-black/30 backdrop-blur-sm rounded-lg p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[hsl(var(--aqua))]" />
                      <span className="text-sm font-medium text-foreground">
                        Real-time Process Visualization
                      </span>
                    </div>
                    <div className="text-xs text-foreground/80">
                      Blocks: {selectedBlocks}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs">LIVE</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-full pt-12">
                    <ScadaFlow devices={filteredDevices} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
