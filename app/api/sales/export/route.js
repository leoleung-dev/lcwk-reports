import { query } from "@/lib/db";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value || "");
}

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function monthToKey(monthValue) {
  const [year, month] = monthValue.split("-");
  return `${year.slice(2)}${month}`;
}

function monthKeyToLabel(value) {
  if (!value || value.length !== 4) {
    return "";
  }
  return `20${value.slice(0, 2)}-${value.slice(2)}`;
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
  const year = searchParams.get("year");

  const hasMonth = Boolean(month);
  const hasYear = Boolean(year);

  try {
    let rows = [];
    let data = [];
    let fileSuffix = "";
    let dateCol = 0;
    let costCol = 0;

    if (hasMonth) {
      if (!isValidMonth(month)) {
        return new Response("Valid month is required in YYYY-MM format.", {
          status: 400,
        });
      }
      const entryMonth = monthToKey(month);
      rows = await query(
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

      data = [
        ["Date", "Reference Number", "Client Name", "Service", "Cost (HKD)"],
        ...rows.map((row) => [
          formatDate(row.entry_date),
          row.reference,
          row.client_name,
          row.service,
          Number(row.cost_hkd),
        ]),
      ];
      fileSuffix = month;
      dateCol = 0;
      costCol = 4;
    } else if (hasYear) {
      if (!isValidYear(year)) {
        return new Response("Valid year is required in YYYY format.", {
          status: 400,
        });
      }
      const yearPrefix = `${year.slice(2)}%`;
      rows = await query(
        `SELECT se.entry_month,
          se.entry_date,
          se.reference,
          se.client_name,
          se.cost_hkd,
          s.name AS service
         FROM sales_entries se
         JOIN services s ON s.id = se.service_id
         WHERE se.entry_month LIKE $1
         ORDER BY se.entry_date ASC, se.entry_seq ASC`,
        [yearPrefix]
      );

      data = [
        ["Month", "Date", "Reference Number", "Client Name", "Service", "Cost (HKD)"],
        ...rows.map((row) => [
          monthKeyToLabel(row.entry_month),
          formatDate(row.entry_date),
          row.reference,
          row.client_name,
          row.service,
          Number(row.cost_hkd),
        ]),
      ];
      fileSuffix = year;
      dateCol = 1;
      costCol = 5;
    } else {
      return new Response("Month or year is required.", { status: 400 });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const startRow = 2;
    const endRow = rows.length + 1;

    for (let row = startRow; row <= endRow; row += 1) {
      const rowIndex = row - startRow;
      const dateValue = rows[rowIndex]?.entry_date;
      if (dateValue) {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: dateCol });
        const date = new Date(dateValue);
        worksheet[cellRef] = {
          t: "d",
          v: date,
          z: "dd/MM/yyyy",
        };
      }

      const costCellRef = XLSX.utils.encode_cell({ r: row - 1, c: costCol });
      if (worksheet[costCellRef]) {
        worksheet[costCellRef].t = "n";
        worksheet[costCellRef].z = "$#,##0.00";
      }
    }

    const totalRow = endRow + 1;
    worksheet[XLSX.utils.encode_cell({ r: totalRow - 1, c: 0 })] = {
      t: "s",
      v: "Total",
    };
    const costColLetter = XLSX.utils.encode_col(costCol);
    worksheet[`${costColLetter}${totalRow}`] = {
      t: "n",
      f: `SUM(${costColLetter}${startRow}:${costColLetter}${endRow})`,
      z: "$#,##0.00",
    };

    worksheet["!ref"] = `A1:${XLSX.utils.encode_col(costCol)}${totalRow}`;
    worksheet["!cols"] = hasYear
      ? [
          { wch: 10 },
          { wch: 12 },
          { wch: 16 },
          { wch: 24 },
          { wch: 22 },
          { wch: 14 },
        ]
      : [
          { wch: 12 },
          { wch: 16 },
          { wch: 24 },
          { wch: 22 },
          { wch: 14 },
        ];
    worksheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(costCol)}${endRow}` };
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
        "Content-Disposition": `attachment; filename="sales-${fileSuffix}.xlsx"`,
      },
    });
  } catch (error) {
    return new Response("Failed to export Excel.", { status: 500 });
  }
}
