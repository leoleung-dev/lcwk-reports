import { redirect } from "next/navigation";

export default function CerementRedirect() {
  const year = new Date().getFullYear();
  redirect(`/cerement/${year}`);
}
