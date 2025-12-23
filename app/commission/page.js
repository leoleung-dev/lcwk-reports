import { redirect } from "next/navigation";

export default function CommissionRedirect() {
  const year = new Date().getFullYear();
  redirect(`/commission/${year}`);
}
