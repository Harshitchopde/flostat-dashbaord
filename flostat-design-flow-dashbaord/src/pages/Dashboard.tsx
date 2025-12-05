import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setBlocks,
  setCurrentBlock,
  setBlockMode,
  setOrgId,
  setBlocksName,
  setLogs,
} from "@/slice/orgSlice";
import { setDevices, setDevicesObject } from "@/slice/deviceSlice";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockSelector } from "@/components/BlockSelector";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { getBlockMode, getBlocksOfOrgId } from "@/lib/operations/blockApis";
import {
  getDeviceWithStatus,
  updateDeviceStatus,
} from "@/lib/operations/dashboardApis";
import { Block, Device } from "@/components/types/types";
import { DEVICE_TYPE, MODE, VALVE_STATUS } from "@/utils/constants";

import { cn } from "@/lib/utils";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  MoreVertical,
  Power,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { DeviceCard } from "@/components/DeviceCard";
import { useLocation } from "react-router-dom";
import { logsOrgTopics } from "@/lib/operations/orgApis";

// Stats data configuration
const statsTemplate = [
  {
    label: "Total Devices",
    value: "11",
    icon: Activity,
    color: "text-blue-500",
  },
  { label: "Active", value: "8", icon: CheckCircle, color: "text-green-500" },
  {
    label: "Warnings",
    value: "2",
    icon: AlertTriangle,
    color: "text-yellow-500",
  },
  { label: "Disconnected", value: "1", icon: XCircle, color: "text-red-500" },
];

const buildStats = (sourceDevices: Device[]) => [
  {
    ...statsTemplate[0],
    value: sourceDevices.length.toString(),
  },
  {
    ...statsTemplate[1],
    value: sourceDevices
      .filter((d) => d.hardware_status && d.hardware_status === "connected")
      .length.toString(),
  },
  {
    ...statsTemplate[2],
    value: sourceDevices
      .filter((d) => d.status === "warning")
      .length.toString(),
  },
  {
    ...statsTemplate[3],
    value: sourceDevices
      .filter(
        (d) => d.hardware_status === null || d.hardware_status === "disconnected"
      )
      .length.toString(),
  },
];
export default function Dashboard() {
  const dispatch = useDispatch();
  const { blocks, blockModes } = useSelector(
    (state: RootState) => state.org
  );
  const { devices, devicesObject } = useSelector((state: RootState) => state.device);
  const token = useSelector((state: RootState) => state.auth.token);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  const [multiTypes, setMultiTypes] = useState<string[]>([]);
  const [minThreshold, setMinThreshold] = useState("");
  const [maxThreshold, setMaxThreshold] = useState("");
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [controls, setControls] = useState({
    pump2: true,
    pump1: false,
    pumpAHub: true,
    valve3: true,
    valve1: true,
    valve4: true,
  });
  const { org_id, logs } = useSelector((state: RootState) => state.org);
  const location = useLocation();
  // console.log("ORG LOG: ",)
  console.log("Org id: ", org_id);
  const [search, setSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  // Fetch blocks on mount
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const result = await getBlocksOfOrgId(org_id, token);
        if (result) {
          dispatch(setBlocks(result));
          dispatch(setBlocksName(result));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch blocks");
      }
    };
    if (!org_id) {
      const orgId = location.pathname.split("/")[2];
      dispatch(setOrgId(orgId));
    }
    if (org_id) fetchBlocks();
  }, [org_id]);

  // Fetch devices and block modes
  useEffect(() => {
    const fetchDevicesAndModes = async () => {
      try {
        // Fetch devices
        const deviceRes = await getDeviceWithStatus(org_id, token);
        console.log("Device result get: ",deviceRes);
        if (deviceRes) {
          dispatch(setDevices(deviceRes));
          dispatch(setDevicesObject(deviceRes));
        }

        // Fetch current block mode if block selected
        // if (currentBlock && !blockModes[currentBlock.block_id]) {
        //   const result = await getBlockMode(
        //     { org_id, block_id: currentBlock.block_id },
        //     token
        //   );
        //   if (result) {
        //     dispatch(setBlockMode(result));
        //   }
        // }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch devices or block modes");
      }
    };

    if (org_id) fetchDevicesAndModes();
  }, [org_id]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = {
        org_id,
      };
      const result = await logsOrgTopics(data, token);

      console.log("Result log: ", logs, result);
      if (result) {
        dispatch(setLogs(result));
      }
    } catch (error) {
      toast.error("Failed to fetch logs");
      console.error("Fetch logs error:", error);
    }
  };

  console.log("Selected block : ", selectedBlocks)
  const showFilterChip = selectedBlocks.length > 0;
  // Group devices by type inside current block
  const filteredDevices: Device[] = devices
    .filter((d) => {
      // Show all if no block selected
      if (!selectedBlocks || selectedBlocks.length === 0) return true;

      // Normalize device block_id to array
      const deviceBlocks = Array.isArray(d.block_id)
        ? d.block_id
        : [d.block_id];

      // Check if device belongs to any selected block
      return deviceBlocks.some((id) => selectedBlocks.includes(id));
    })
    .filter((d) =>
      !search || d?.device_name?.toLowerCase().includes(search.toLowerCase())
    );

  console.log("Filter the devices: ", filteredDevices);
  const overallStats = buildStats(devices);
  console.log("d ", blocks);
  console.log("Overall stats: ", overallStats);
  // Apply common filters once, then render by device type group order
  const visibleDevices = filteredDevices
    .filter((d) => typeFilter === "all" || d.device_type === typeFilter)
    .filter((d) => statusFilter === "all" || d.hardware_status === statusFilter || (statusFilter === "disconnected" && !d.hardware_status))
    .filter(
      (d) => !search || d.device_name.toLowerCase().includes(search.toLowerCase())
    );


  const pumpDevices = visibleDevices.filter(
    (d) => d.device_type === DEVICE_TYPE.PUMP
  );
  const valveDevices = visibleDevices.filter(
    (d) => d.device_type === DEVICE_TYPE.VALVE
  );
  const tankDevices = visibleDevices.filter(
    (d) => d.device_type === DEVICE_TYPE.TANK
  );
  const sumpDevices = visibleDevices.filter(
    (d) => d.device_type === DEVICE_TYPE.SUMP
  );

  const deviceSections = [
    { key: "tank", title: "Tanks", devices: tankDevices },
    { key: "valve", title: "Valves", devices: valveDevices },
    { key: "pump", title: "Pumps", devices: pumpDevices },
    { key: "sump", title: "Sumps", devices: sumpDevices },
  ];

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // const pumpDevices = filteredDevices.filter((d) => d.device_type === DEVICE_TYPE.PUMP);
  // const valveDevices = filteredDevices.filter((d) => d.device_type === DEVICE_TYPE.VALVE);
  // const tankDevices = filteredDevices.filter((d) => d.device_type === DEVICE_TYPE.TANK);
  // const sumpDevices = filteredDevices.filter((d) => d.device_type === DEVICE_TYPE.SUMP);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and control your industrial systems
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overallStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="shadow-elevation-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <BlockSelector

              availableBlocks={blocks}
              selectedBlocks={selectedBlocks}
              onBlocksChange={(ids) => {
                // console.log("Block: ",ids)
                setSelectedBlocks(ids);
                //  console.log("ID: ",ids[0]);   
                // dispatch(setCurrentBlock(block || null));
              }}
            />

            <div className="relative">
              <Input
                placeholder="Search devices..."
                className="w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pump">Pumps</SelectItem>
                <SelectItem value="valve">Valves</SelectItem>
                <SelectItem value="tank">Tanks</SelectItem>
                <SelectItem value="sump">Sumps</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="connected">Active</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="disconnected">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showFilterChip && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1 pl-2 pr-3 py-1 rounded-full text-xs font-normal hover:bg-secondary/80"
              onClick={() => setSelectedBlocks([])}
            >
              <X className="h-3.5 w-3.5" />
              Filters applied
            </Badge>
          )}
        </div>

        {/* Device Sections in order: Tank → Valve → Pump → Sump */}
        {deviceSections.map(
          ({ key, title, devices }) =>
            devices.length > 0 && (
              <div className="space-y-4" key={key}>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSection(key)}
                    className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
                  >
                    {collapsedSections[key] ? (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h2 className="text-xl font-semibold">{title}</h2>
                  </button>
                  <Badge variant="secondary">{devices.length}</Badge>
                </div>
                {!collapsedSections[key] && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {devices.map((device, index) => (
                      <DeviceCard
                        key={device.device_id || `${key}-${index}`}
                        device={device}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
        )}

        {visibleDevices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No devices found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or create a new device.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <Card className="shadow-elevation-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>``
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => {
                  const action =
                    log.device_type === "pump"
                      ? `Pump turned ${log.status}`
                      : log.device_type === "valve"
                        ? `Valve ${log.status}`
                        : `Level updated to ${log.current_level}%`;

                  const statusBadge =
                    log.device_type === "pump" || log.device_type === "valve"
                      ? log.status === "ON" || log.status === "OPEN"
                        ? "Success"
                        : "Inactive"
                      : "Info";

                  return (
                   <TableRow key={`${log.uuid}-${log.last_updated || log.updated_at}`}>
                      <TableCell>
                        <div className="font-medium capitalize">
                          {devicesObject[log.device_id]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.device_type}
                        </div>
                      </TableCell>

                      <TableCell className="capitalize">{action}</TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusBadge === "Success"
                              ? "bg-green-100 text-green-600 border-green-300"
                              : statusBadge === "Inactive"
                                ? "bg-red-100 text-red-600 border-red-300"
                                : "bg-blue-100 text-blue-600 border-blue-300"
                          }
                        >
                          {(log.device_type === "tank" || log.device_type === "sump") ? log?.current_level : log?.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {new Date(
                          log.last_updated || log.updated_at
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No recent activity found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// <div className="space-y-6 p-6">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
//           <p className="text-muted-foreground mt-1">Monitor and control your industrial systems</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="sm">Configure</Button>
//           <Button size="sm">Export Report</Button>
//         </div>
//       </div>

//       {/* Block Selector */}
//       <div className="flex flex-wrap items-center gap-4">
//         <BlockSelector
//           selectedBlocks={currentBlock ? [currentBlock.block_id] : []}
//           onBlocksChange={(ids) => {
//             const block = blocks.find((b) => b.block_id === ids[0]);
//             dispatch(setCurrentBlock(block || null));
//           }}
//         />
//         <Input
//           placeholder="Search devices..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-48"
//         />
//       </div>

//       {/* Devices */}
//       <div className="space-y-8">
//         {pumpDevices.length > 0 && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Pumps</h2>
//               <Badge variant="secondary">{pumpDevices.length}</Badge>
//             </div>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//               {pumpDevices.map((device) => (
//                 <DeviceCard
//                   key={device.device_id}
//                   {...device}
//                   handleUpdate={(status?: any) => handleDeviceUpdate(device, status)}
//                   disabled={currentBlock ? blockModes[currentBlock.block_id] === MODE.AUTO : false}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {valveDevices.length > 0 && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Valves</h2>
//               <Badge variant="secondary">{valveDevices.length}</Badge>
//             </div>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//               {valveDevices.map((device) => (
//                 <DeviceCard
//                   key={device.device_id}
//                   {...device}
//                   handleUpdate={(status?: any) => handleDeviceUpdate(device, status)}
//                   disabled={currentBlock ? blockModes[currentBlock.block_id] === MODE.AUTO : false}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {tankDevices.length > 0 && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Tanks</h2>
//               <Badge variant="secondary">{tankDevices.length}</Badge>
//             </div>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//               {tankDevices.map((device) => (
//                 <DeviceCard
//                   key={device.device_id}
//                   {...device}
//                   type="tank"
//                   handleUpdate={(level?: number) => handleDeviceUpdate(device, level)}
//                   disabled={currentBlock ? blockModes[currentBlock.block_id] === MODE.AUTO : false}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {sumpDevices.length > 0 && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-xl font-semibold">Sumps</h2>
//               <Badge variant="secondary">{sumpDevices.length}</Badge>
//             </div>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//               {sumpDevices.map((device) => (
//                 <DeviceCard
//                   key={device.device_id}
//                   {...device}
//                   type="sump"
//                   handleUpdate={(level?: number) => handleDeviceUpdate(device, level)}
//                   disabled={currentBlock ? blockModes[currentBlock.block_id] === MODE.AUTO : false}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {filteredDevices.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 text-center">
//             <p className="mt-4 text-lg font-semibold text-muted-foreground">No devices found</p>
//           </div>
//         )}
//       </div>
//     </div>
