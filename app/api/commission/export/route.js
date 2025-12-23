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
      `SELECT ce.client_name,
        ch.name AS handler,
        ce.item_shroud,
        ce.item_quilt,
        ce.item_other,
        ce.total,
        ce.commission_rate,
        ce.total_commission
       FROM commission_entries ce
       JOIN commission_handlers ch ON ch.id = ce.handler_id
       WHERE ce.entry_month = $1
       ORDER BY ce.created_at ASC`,
      [entryMonth]
    );

    const data = [
      [
        "Month",
        "Client",
        "Handler",
        "壽衣",
        "壽被",
        "其他",
        "總計",
        "佣",
        "Total Commission",
      ],
      ...rows.map((row) => [
        month,
        row.client_name,
        row.handler,
        Number(row.item_shroud),
        Number(row.item_quilt),
        Number(row.item_other),
        Number(row.total),
        Number(row.commission_rate),
        Number(row.total_commission),
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 24 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commission");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="commission-${month}.xlsx"`,
      },
    });
  } catch (error) {
    return new Response("Failed to export Excel.", { status: 500 });
  }
}
