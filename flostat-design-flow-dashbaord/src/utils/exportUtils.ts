import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable, { UserOptions } from "jspdf-autotable";
import { toast } from "sonner";
import { Report } from "@/components/types/types";

/**
 * Generic record type for row objects
 */
export type RowData = Record<string, any>;

/**
 * Export JSON data to Excel (.xlsx)
 */
export const exportToExcel = (
  data: RowData[],
  filename: string = "data.xlsx"
): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, filename);
};

/**
 * Export JSON data to CSV (.csv)
 */
export const exportToCSV = (
  data: RowData[],
  filename: string = "data.csv"
): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  saveAs(blob, filename);
};

/**
 * Export JSON data to PDF (.pdf)
 */




/**
 * Generates a PDF report for device data.
 * @param logs Array of device logs
 * @param selectedDate Selected filter date
 * @param tankDevices List of tank devices
 * @param selectedTank The selected tank ID
 * @param toast Toast handler (shadcn/toast)
 */
export const generateDeviceReportPDF = async ({
  logs,
  selectedDate,
  tankDevices,
  selectedTank,
}: {
  logs: Report[];
  selectedDate: string;
  tankDevices: any[];
  selectedTank: string;
}) => {
  if (!logs || logs.length === 0) {
    toast.error("No data available to generate PDF.");
    return;
  }

  try {
    toast.loading("Generating PDF...");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const selectedTankObj = tankDevices.find((t) => t.device_id === selectedTank);
    const orgId = selectedTankObj?.org_id || "Unknown";

    // ---------- HEADER ----------
    pdf.setFontSize(18);
    pdf.text("Tank Device Report", pageWidth / 2, 15, { align: "center" });

    pdf.setFontSize(10);
    pdf.text(`Tank: ${selectedTankObj?.device_name || "Unknown"}`, 15, 25);
    pdf.text(`Org ID: ${orgId}`, 15, 30);
    pdf.text(`Date: ${selectedDate}`, 15, 35);
    pdf.text(`Total Records: ${logs.length}`, 15, 40);

    let yPos = 55;

    // ---------- TABLE ----------
    pdf.setFontSize(11);
    pdf.text("Device Logs", 15, yPos - 5);

    const headers = ["Device", "Status", "Type", "Last Updated"];
    const colWidths = [55, 30, 30, 55];
    let xPos = 15;

    pdf.setFontSize(9);

    // Table Header
    headers.forEach((txt, i) => {
      pdf.text(txt, xPos, yPos);
      xPos += colWidths[i];
    });

    yPos += 8;

    const formatValue = (value: string | undefined) =>
      value ? (value.length > 18 ? value.slice(0, 18) + "..." : value) : "N/A";

    logs.forEach((log) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }

      xPos = 15;

      const rowValues = [
        formatValue(log.device_name || log.device_id),
        log.status || log.level || "-",
        log.device_type || "N/A",
        log.lastUpdated ?log.lastUpdated : "-"
      ];

      rowValues.forEach((value, i) => {
        pdf.text(String(value), xPos, yPos);
        xPos += colWidths[i];
      });

      yPos += 7;
    });

    // ---------- CHART SECTION ORDER ----------
    const chartOrder = [
      { id: ".tank-chart", label: "Tank Chart" },
      { id: ".valve-chart", label: "Valve Chart" },
      { id: ".pump-chart", label: "Pump Chart" },
    ];

    for (const section of chartOrder) {
      const chart = document.querySelector(section.id) as HTMLElement;

      if (chart) {
        pdf.addPage();
        yPos = 25;

        pdf.setFontSize(14);
        pdf.text(section.label, 15, yPos - 10);

        const canvas = await html2canvas(chart, { scale: 1.5 });

        const img = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(img, "PNG", 15, yPos, imgWidth, imgHeight > 120 ? 120 : imgHeight);
      }
    }

    // ---------- SAVE ----------
    pdf.save(`tank-report-${orgId}-${selectedDate}.pdf`);
    toast.dismiss();
    toast.success("PDF downloaded successfully!");

  } catch (error: any) {
    toast.dismiss();
    console.error(error);
    toast.error("PDF generation failed: " + error.message);
  }
};


export const exportToPDF = (
  data: RowData[],
  filename: string = "data.pdf",
  title: string = "Device Data"
): void => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 15);

  // Ensure data is not empty
  if (!data.length) {
    doc.text("No data available", 14, 25);
    doc.save(filename);
    return;
  }

  const columns = Object.keys(data[0]);
  const rows = data.map((row) => Object.values(row));

  const tableOptions: UserOptions = {
    head: [columns],
    body: rows,
    startY: 25,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    styles: { fontSize: 10 },
  };

  autoTable(doc, tableOptions);

  doc.save(filename);
};
