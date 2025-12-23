import SalesClient from "./sales-client";

export default async function SalesPage({ params }) {
  const resolvedParams = await params;
  return <SalesClient year={resolvedParams?.year} />;
}
