import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { generateDeviceReportPDF } from "@/utils/exportUtils";
import { Report } from "@/components/types/types";
import { useSelector } from "react-redux";
import { RootState } from "@/store";



interface TankDevice {
  device_id: string;
  device_name: string;
  device_type: string;
  org_id: string;
  org_name: string;
}

export default function Reports() {
  const { authToken, organizations } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const { devicesObject} = useSelector((state: RootState)=> state.device);
  const [loading, setLoading] = useState(false);
  const [tankDevices, setTankDevices] = useState<TankDevice[]>([]);
  const [selectedTank, setSelectedTank] = useState<string>("no-tanks");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDeviceType, setFilterDeviceType] = useState("all");

  // Fetch tank devices from ALL organizations
  useEffect(() => {
    if (authToken && organizations && organizations.length > 0) {
      fetchAllTankDevices();
    }
  }, [authToken, organizations]);

  const fetchAllTankDevices = async () => {
    try {
      if (!authToken || !organizations) return;

      apiService.setAuthToken(authToken);

      const allTanks: TankDevice[] = [];

      // Iterate through all organizations to fetch their devices
      for (const org of organizations) {
        try {
          const response = await apiService.getDevices(org.org_id);

          if (response.success && response.devices) {
            const orgTanks = response.devices
              .filter((device: any) => device.device_type === 'tank')
              .map((tank: any) => ({
                ...tank,
                org_id: org.org_id,
                org_name: org.name
              }));

            allTanks.push(...orgTanks);
          }
        } catch (err) {
          console.error(`Failed to fetch devices for org ${org.name}:`, err);
          // Continue to next org even if one fails
        }
      }

      setTankDevices(allTanks);

      if (allTanks.length > 0 && (!selectedTank || selectedTank === "no-tanks")) {
        setSelectedTank(allTanks[0].device_id);
      } else if (allTanks.length === 0) {
        setSelectedTank("no-tanks");
      }

    } catch (error) {
      console.error("Fetch all tank devices error:", error);
      toast.error("Failed to fetch tank devices");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Validation checks with specific error messages
      if (!authToken) {
        toast.error("Authentication required", {
          description: "Please log in to view reports.",
        });
        setReports([]);
        return;
      }

      if (!selectedTank || selectedTank === "no-tanks") {
        toast.error("Tank selection required", {
          description: "Please select a tank to view reports.",
        });
        setReports([]);
        return;
      }

      // Find the selected tank to get its org_id
      const selectedTankObj = tankDevices.find(t => t.device_id === selectedTank);

      if (!selectedTankObj) {
        toast.error("Invalid tank selection", {
          description: "Selected tank not found in available devices.",
        });
        return;
      }

      apiService.setAuthToken(authToken);

      const params = {
        org_id: selectedTankObj.org_id, // Use the org_id from the selected tank
        date: selectedDate || new Date().toISOString().split('T')[0],
        tank_id: selectedTank
      };

      // Ensure date is in the correct format (YYYY-MM-DD)
      if (params.date && !/\d{4}-\d{2}-\d{2}/.test(params.date)) {
        const dateObj = new Date(params.date);
        params.date = dateObj.toISOString().split('T')[0];
      }

      console.log("Fetch Reports Params:", JSON.stringify(params, null, 2));
      const response = await apiService.getTankRelatedReport(params);
      console.log("Fetch Reports Response:", JSON.stringify(response, null, 2));

      if (!response) {
        throw new Error("Invalid response from server");
      }

      // Aggregate all logs
      const connectedLogs = [
        ...(response.connectedLogs || []),
        ...(response.tank_logs || []),
        ...(response.pump_logs || []),
        ...(response.sump_logs || []),
        ...(response.valve_logs || []),
        ...(response.data || []),
        ...(response.logs || []),
        ...(response.Items || [])
      ];


      // Remove duplicates based on ID if necessary (optional but good practice)
      // Remove duplicates based on UUID or create a composite key for uniqueness
      const uniqueLogs = Array.from(new Map(connectedLogs.map((item: any) => {
        const key = item.uuid || item.id || `${item.device_id}-${item.last_updated}-${item.status}-${item.current_level}`;
        return [key, item];
      })).values());

      // Sort logs by date (newest first)
      uniqueLogs.sort((a: any, b: any) => {
        return (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || (new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
      });

      console.log("Extracted unique logs:", JSON.stringify(uniqueLogs, null, 2));

      const transformedReports: Report[] = uniqueLogs.map((log: any) => ({
        uuid: log.uuid || "Unknown",
        device_name: devicesObject[log?.device_id],
        device_type: log.device_type || "Unknown",
        status: log.status !== undefined ? log.status : null,
        level: log.current_level ? `${log.current_level}%` : (log.level !== undefined ? log.level : null),
        lastUpdated: log.last_updated ? new Date(log.last_updated).toLocaleString() : "Unknown",
        timestamp: log.timestamp || log.last_updated ? new Date(log.last_updated).getTime() : 0,
        updatedBy: log.updated_by || log.email || "System"
      }));
      console.warn(transformedReports);
      setReports(transformedReports);

      if (uniqueLogs.length === 0) {
        toast.info("No data found", {
          description: `No reports found for the selected tank on ${params.date}`,
        });
      } else {
        toast.success("Data fetched successfully", {
          description: `Retrieved ${uniqueLogs.length} records`,
        });
      }

    } catch (error) {
      console.error("Fetch reports error:", error);
      const errorMessage = (error as Error).message;

      if (errorMessage.includes("Authentication required")) {
        toast.error("Authentication failed", {
          description: "Your session may have expired. Please log in again.",
        });
      } else if (errorMessage.includes("User does not exit in this org")) {
        toast.error("Access denied", {
          description: "You don't have access to this organization.",
        });
      } else if (errorMessage.includes("Tank device not Found")) {
        toast.error("Tank not found", {
          description: "The selected tank device does not exist.",
        });
      } else {
        toast.error("Failed to fetch reports", {
          description: errorMessage,
        });
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = async () => {
    await fetchReports();
  };

  const handleDownloadPDF = ()=>{
    generateDeviceReportPDF({
    logs: reports,
    selectedDate,
    tankDevices,
    selectedTank
  });
  }

  // const handleDownloadPDF = async () => {
  //   try {
  //     const jsPDF = (await import('jspdf')).default;
  //     const autoTable = (await import('jspdf-autotable')).default;

  //     const doc = new jsPDF();

  //     const selectedTankObj = tankDevices.find(t => t.device_id === selectedTank);
  //     const tankName = selectedTankObj ? `${selectedTankObj.device_name} (${selectedTankObj.org_name})` : 'Unknown Tank';

  //     doc.setFontSize(18);
  //     doc.text('Device Reports', 14, 20);

  //     doc.setFontSize(11);
  //     doc.text(`Tank: ${tankName}`, 14, 30);
  //     doc.text(`Date: ${selectedDate}`, 14, 37);
  //     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);
  //     doc.text(`Total Records: ${filteredReports.length}`, 14, 51);

  //     const tableData = filteredReports.map(report => [
  //       report.id.substring(0, 20) + '...',
  //       report.deviceType,
  //       report.status || report.level || '-',
  //       report.lastUpdated,
  //       report.updatedBy
  //     ]);

  //     autoTable(doc, {
  //       startY: 58,
  //       head: [['Device ID', 'Type', 'Status/Level', 'Last Updated', 'Updated By']],
  //       body: tableData,
  //       theme: 'grid',
  //       headStyles: { fillColor: [0, 150, 136], textColor: 255, fontStyle: 'bold' },
  //       styles: { fontSize: 8, cellPadding: 3 },
  //       columnStyles: {
  //         0: { cellWidth: 35 },
  //         1: { cellWidth: 20 },
  //         2: { cellWidth: 25 },
  //         3: { cellWidth: 40 },
  //         4: { cellWidth: 40 }
  //       }
  //     });

  //     const fileName = `report_${tankName.replace(/[^a-z0-9]/gi, '_')}_${selectedDate}.pdf`;
  //     doc.save(fileName);

  //     toast.success('PDF downloaded successfully', {
  //       description: `${filteredReports.length} records exported`
  //     });
  //   } catch (error) {
  //     console.error('PDF generation error:', error);
  //     toast.error('Failed to generate PDF', {
  //       description: error.message || 'Please try again'
  //     });
  //   }
  // };

  const levelSeries = useMemo(() => {
    const chartData: Record<string, any> = {};

    reports.forEach(report => {
      if (report.timestamp && (report.level || report.status !== null)) {
        const date = new Date(report.timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        if (!chartData[formattedTime]) {
          chartData[formattedTime] = { ts: formattedTime };
        }

        if (report.level) {
          const levelValue = parseInt(report.level);
          if (!isNaN(levelValue)) {
            chartData[formattedTime][report.device_type.toLowerCase()] = levelValue;
          }
        } else if (report.status !== null) {
          chartData[formattedTime][report.device_type.toLowerCase()] = report.status === 'ON' ? 1 : 0;
        }
      }
    });

    const dataArray = Object.values(chartData);
    dataArray.sort((a, b) => a.ts.localeCompare(b.ts));

    return dataArray;
  }, [reports]);

  const chartConfig = {
    tank: { label: "Tank Level", color: "hsl(var(--aqua))" },
    sump: { label: "Sump Level", color: "hsl(220 70% 50%)" },
  };

  const calculateDeviceTimeline = (deviceType: string) => {
    const deviceLogs = reports
      .filter(r => r.device_type.toLowerCase() === deviceType.toLowerCase())
      .sort((a, b) => a.timestamp - b.timestamp);

    if (deviceLogs.length === 0) return [];

    const segments = [];
    const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);
    const totalDuration = endOfDay - startOfDay;

    // Initial segment (from start of day to first log) - Unknown/Disconnected
    if (deviceLogs[0].timestamp > startOfDay) {
      const duration = deviceLogs[0].timestamp - startOfDay;
      segments.push({
        width: (duration / totalDuration) * 100,
        color: "bg-muted-foreground/30", // Unknown
        status: "Unknown"
      });
    }

    // Segments between logs
    for (let i = 0; i < deviceLogs.length; i++) {
      const currentLog = deviceLogs[i];
      const nextLog = deviceLogs[i + 1];
      const endTime = nextLog ? nextLog.timestamp : endOfDay;

      const duration = endTime - currentLog.timestamp;
      let color = "bg-muted-foreground/30";

      if (currentLog.status === "ON" || currentLog.status === "OPEN") {
        color = "bg-[hsl(var(--aqua))]";
      } else if (currentLog.status === "OFF" || currentLog.status === "CLOSED") {
        color = "bg-muted-foreground/60";
      } else if (currentLog.status === "DISCONNECTED") {
        color = "bg-[#C00000]";
      }

      segments.push({
        width: (duration / totalDuration) * 100,
        color: color,
        status: currentLog.status
      });
    }

    return segments;
  };

  const valveTimeline = useMemo(() => calculateDeviceTimeline("valve"), [reports, selectedDate]);
  const pumpTimeline = useMemo(() => calculateDeviceTimeline("pump"), [reports, selectedDate]);

  const filteredReports = useMemo(() => {
    if (filterDeviceType === "all") return reports;
    return reports.filter(report => report.device_type.toLowerCase() === filterDeviceType.toLowerCase());
  }, [reports, filterDeviceType]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-bold tracking-tight text-soft text-center">Reports</h1>


      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-soft-muted">Select Tank</label>
            <Select value={selectedTank} onValueChange={setSelectedTank}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Select Tank">
                  {selectedTank && selectedTank !== "no-tanks"
                    ? (() => {
                      const tank = tankDevices.find(t => t.device_id === selectedTank);
                      return tank ? `${tank.device_name} (${tank.org_name})` : selectedTank;
                    })()
                    : "Select Tank"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tankDevices.length > 0 ? (
                  tankDevices.map((tank) => (
                    <SelectItem key={tank.device_id} value={tank.device_id}>
                      {tank.device_name} <span className="text-muted-foreground text-xs">({tank.org_name})</span>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-tanks" disabled>No tanks found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-soft-muted">Select Date</label>
            <Input
              type="date"
              placeholder="mm/dd/yyyy"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 w-[140px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-soft-muted">Device Type</label>
            <Select value={filterDeviceType} onValueChange={setFilterDeviceType}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="tank">Tank</SelectItem>
                <SelectItem value="pump">Pump</SelectItem>
                <SelectItem value="valve">Valve</SelectItem>
                <SelectItem value="sump">Sump</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-9 px-3 bg-[hsl(var(--aqua))] hover:bg-[hsl(var(--aqua))]/90 text-white shadow-soft-sm"
            onClick={handleFetchData}
          >
            Fetch Data
          </Button>
          <Button
            className="h-9 px-3 bg-[hsl(var(--navy))] hover:bg-[hsl(var(--navy-hover))] text-white shadow-soft-sm"
            onClick={fetchReports}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Refreshing...</span>
              </div>
            ) : (
              "Refresh Data"
            )}
          </Button>
        </div>
        <Button className="h-9 gap-2 bg-[hsl(var(--navy))] hover:bg-[hsl(var(--navy-hover))] text-white" onClick={handleDownloadPDF}><Download className="h-4 w-4" /> Download PDF</Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card shadow-soft-lg animate-slideUp">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-soft">DEVICE ID</TableHead>
              <TableHead className="font-semibold text-soft">STATUS/LEVEL</TableHead>
              <TableHead className="font-semibold text-soft">DEVICE TYPE</TableHead>
              <TableHead className="font-semibold text-soft">LAST UPDATED</TableHead>
              <TableHead className="font-semibold text-soft">UPDATED BY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => (
                <TableRow key={index} className="hover:bg-muted/20 transition-smooth">
                  <TableCell className="font-mono text-xs text-soft">{report?.device_name ||  report.device_id}</TableCell>
                  <TableCell className="space-x-1">
                    {report.status && (
                      <Badge
                        variant="outline"
                        className={report.status === "ON" ? "bg-success/15 text-success/90 border-success/25 shadow-soft-sm" : "bg-destructive/15 text-destructive/90 border-destructive/25 shadow-soft-sm"}
                      >
                        {report.status}
                      </Badge>
                    )}
                    {report.level && (
                      <Badge variant="outline" className="bg-[hsl(var(--aqua))]/15 text-[hsl(var(--aqua))] border-[hsl(var(--aqua))]/25 shadow-soft-sm">
                        {report.level}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-soft">{report.deviceType}</TableCell>
                  <TableCell className="text-sm text-soft-muted">{report.lastUpdated}</TableCell>
                  <TableCell className="text-sm text-[hsl(var(--aqua))]">{report.updatedBy}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No reports found. Select a tank and date, then click Fetch Data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>


      <h2 className="text-center text-sm font-semibold text-soft">Device Data Visualization</h2>
      <Card className="tank-chart rounded-lg border border-border/50 bg-card shadow-soft-lg">
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-sm font-medium">Water Level</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer config={chartConfig} className="w-full aspect-[16/6]">
            <AreaChart data={levelSeries} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillTank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--aqua))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--aqua))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="ts"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                domain={[0, 100]}
              />
              <Area
                dataKey="tank"
                type="monotone"
                stroke="hsl(var(--aqua))"
                fill="url(#fillTank)"
                strokeWidth={2}
              />
              <Area
                dataKey="sump"
                type="monotone"
                stroke="hsl(220 70% 50%)"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Valve State Card */}
      <Card className="valve-chart rounded-lg border border-border/50 bg-card shadow-soft-lg">
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">Valve State</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(var(--aqua))]"></span> Open</div>
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/60"></span> Closed</div>
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#C00000]"></span> Disconnected</div>
          </div>
          <div className="relative w-full h-6 rounded-full border overflow-hidden flex" aria-label="Valve timeline state">
            {valveTimeline.length > 0 ? (
              valveTimeline.map((segment, index) => (
                <div
                  key={index}
                  className={`h-full ${segment.color}`}
                  style={{ width: `${segment.width}%` }}
                  title={`${segment.status}`}
                />
              ))
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                No Data
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
        </CardContent>
      </Card>

      {/* Pump State Card */}
      <Card className=" pump-chart chart-container rounded-lg border border-border/50 bg-card shadow-soft-lg">
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">Pump State</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(var(--aqua))]"></span> On</div>
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/60"></span> Off</div>
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#C00000]"></span> Disconnected</div>
          </div>
          <div className="relative w-full h-6 rounded-full border overflow-hidden flex" aria-label="Pump timeline state">
            {pumpTimeline.length > 0 ? (
              pumpTimeline.map((segment, index) => (
                <div
                  key={index}
                  className={`h-full ${segment.color}`}
                  style={{ width: `${segment.width}%` }}
                  title={`${segment.status}`}
                />
              ))
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                No Data
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
