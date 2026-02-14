import HkfhSalesClient from "./hkfh-sales-client";

export default async function HkfhSalesPage({ params }) {
  const resolvedParams = await params;
  return <HkfhSalesClient year={resolvedParams?.year} />;
}
