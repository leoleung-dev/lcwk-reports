import CerementClient from "./cerement-client";

export default async function CerementPage({ params }) {
  const resolvedParams = await params;
  return <CerementClient year={resolvedParams?.year} />;
}
