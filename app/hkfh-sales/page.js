import { redirect } from "next/navigation";

export default function HkfhSalesRedirect() {
  const year = new Date().getFullYear();
  redirect(`/hkfh-sales/${year}`);
}
