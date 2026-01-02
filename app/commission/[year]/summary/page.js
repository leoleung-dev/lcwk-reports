import { redirect } from "next/navigation";

export default async function CommissionSummaryPage({ params }) {
  const resolvedParams = await params;
  if (!resolvedParams?.year) {
    redirect("/commission");
  }
  redirect(`/commission/summary/${resolvedParams.year}`);
}
