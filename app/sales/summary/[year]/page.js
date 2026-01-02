import SummaryClient from "../../[year]/summary/summary-client";

export default async function SalesSummaryPage({ params }) {
  const resolvedParams = await params;
  return <SummaryClient year={resolvedParams?.year} />;
}
