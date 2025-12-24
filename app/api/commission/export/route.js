import { query } from "@/lib/db";
import * as XLSX from "xlsx";
import { requireAuth } from "@/lib/auth";

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

export async function GET(request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const hasMonth = Boolean(month);
  const hasYear = Boolean(year);

  try {
    let rows = [];
    let data = [];
    let fileSuffix = "";
    const header = [
      "Month",
      "Client",
      "Handler",
      "壽衣",
      "壽被",
      "其他",
      "總計",
      "佣",
      "Total Commission",
    ];

    if (hasMonth) {
      if (!isValidMonth(month)) {
        return new Response("Valid month is required in YYYY-MM format.", {
          status: 400,
        });
      }
      const entryMonth = monthToKey(month);
      rows = await query(
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

      data = [
        header,
        ...rows.map((row) => [
          month,
          row.client_name,
          row.handler,
          Number(row.item_shroud),
          Number(row.item_quilt),
          Number(row.item_other),
          null,
          Number(row.commission_rate),
          null,
        ]),
      ];
      fileSuffix = month;
    } else if (hasYear) {
      if (!isValidYear(year)) {
        return new Response("Valid year is required in YYYY format.", {
          status: 400,
        });
      }
      const yearPrefix = `${year.slice(2)}%`;
      rows = await query(
        `SELECT ce.entry_month,
          ce.client_name,
          ch.name AS handler,
          ce.item_shroud,
          ce.item_quilt,
          ce.item_other,
          ce.total,
          ce.commission_rate,
          ce.total_commission
         FROM commission_entries ce
         JOIN commission_handlers ch ON ch.id = ce.handler_id
         WHERE ce.entry_month LIKE $1
         ORDER BY ce.entry_month ASC, ce.created_at ASC`,
        [yearPrefix]
      );

      data = [
        header,
        ...rows.map((row) => [
          monthKeyToLabel(row.entry_month),
          row.client_name,
          row.handler,
          Number(row.item_shroud),
          Number(row.item_quilt),
          Number(row.item_other),
          null,
          Number(row.commission_rate),
          null,
        ]),
      ];
      fileSuffix = year;
    } else {
      return new Response("Month or year is required.", { status: 400 });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const dataRowCount = data.length - 1;
    const startRow = 2;
    const endRow = dataRowCount + 1;
    const currencyCols = [3, 4, 5, 6, 8];
    const totalCol = 6;
    const rateCol = 7;
    const totalCommissionCol = 8;

    for (let row = startRow; row <= endRow; row += 1) {
      const totalCell = XLSX.utils.encode_cell({ r: row - 1, c: totalCol });
      const rateCell = XLSX.utils.encode_cell({ r: row - 1, c: rateCol });
      const totalCommissionCell = XLSX.utils.encode_cell({
        r: row - 1,
        c: totalCommissionCol,
      });

      worksheet[totalCell] = {
        t: "n",
        f: `D${row}+E${row}+F${row}`,
        z: "$#,##0.00",
      };
      if (worksheet[rateCell]) {
        worksheet[rateCell].t = "n";
        worksheet[rateCell].z = "0.00%";
      }
      worksheet[totalCommissionCell] = {
        t: "n",
        f: `G${row}*H${row}`,
        z: "$#,##0.00",
      };

      currencyCols.forEach((col) => {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].t = "n";
          worksheet[cellRef].z = "$#,##0.00";
        }
      });
    }

    const totalRow = endRow + 1;
    worksheet[XLSX.utils.encode_cell({ r: totalRow - 1, c: 0 })] = {
      t: "s",
      v: "Total",
    };
    ["D", "E", "F", "G", "I"].forEach((col) => {
      const cellRef = `${col}${totalRow}`;
      const sumRange = `${col}${startRow}:${col}${endRow}`;
      worksheet[cellRef] = {
        t: "n",
        f: `SUM(${sumRange})`,
        z: "$#,##0.00",
      };
    });

    worksheet["!ref"] = `A1:I${totalRow}`;
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
    worksheet["!autofilter"] = { ref: `A1:I${endRow}` };
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
        "Content-Disposition": `attachment; filename="commission-${fileSuffix}.xlsx"`,
      },
    });
  } catch (error) {
    return new Response("Failed to export Excel.", { status: 500 });
  }
}
