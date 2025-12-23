import { redirect } from "next/navigation";

export default function SalesRedirect() {
  const year = new Date().getFullYear();
  redirect(`/sales/${year}`);
}
