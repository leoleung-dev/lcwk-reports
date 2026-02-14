import SummaryClient from "./summary-client";

export default async function HkfhSalesSummaryPage({ params }) {
  const resolvedParams = await params;
  return <SummaryClient year={resolvedParams?.year} />;
}
