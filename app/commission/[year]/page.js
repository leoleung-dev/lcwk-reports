import CommissionClient from "./commission-client";

export default async function CommissionPage({ params }) {
  const resolvedParams = await params;
  return <CommissionClient year={resolvedParams?.year} />;
}
