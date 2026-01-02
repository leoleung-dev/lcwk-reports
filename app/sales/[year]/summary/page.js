import { redirect } from "next/navigation";

export default async function SalesSummaryPage({ params }) {
  const resolvedParams = await params;
  if (!resolvedParams?.year) {
    redirect("/sales");
  }
  redirect(`/sales/summary/${resolvedParams.year}`);
}
