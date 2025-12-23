import SummaryClient from "./summary-client";

export default async function CommissionSummaryPage({ params }) {
  const resolvedParams = await params;
  return <SummaryClient year={resolvedParams?.year} />;
}
