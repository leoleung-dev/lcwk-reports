import { query } from "@/lib/db";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value || "");
}

function monthToKey(monthValue) {
  const [year, month] = monthValue.split("-");
  return `${year.slice(2)}${month}`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const text = String(value);
  return text.includes("T") ? text.split("T")[0] : text;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!isValidMonth(month)) {
    return new Response("Valid month is required in YYYY-MM format.", {
      status: 400,
    });
  }

  const entryMonth = monthToKey(month);

  try {
    const rows = await query(
      `SELECT se.entry_date,
        se.reference,
        se.client_name,
        se.cost_hkd,
        s.name AS service
       FROM sales_entries se
       JOIN services s ON s.id = se.service_id
       WHERE se.entry_month = $1
       ORDER BY se.entry_date ASC, se.entry_seq ASC`,
      [entryMonth]
    );

    const data = [
      ["Date", "Reference Number", "Client Name", "Service", "Cost (HKD)"],
      ...rows.map((row) => [
        formatDate(row.entry_date),
        row.reference,
        row.client_name,
        row.service,
        Number(row.cost_hkd),
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 16 },
      { wch: 24 },
      { wch: 22 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="sales-${month}.xlsx"`,
      },
    });
  } catch (error) {
    return new Response("Failed to export Excel.", { status: 500 });
  }
}
