"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import styles from "./TopBar.module.css";

export default function TopBar() {
  const { status } = useSession();
  const pathname = usePathname();

  if (status !== "authenticated" || pathname === "/login") {
    return null;
  }

  return (
    <div className={styles.bar}>
      <button
        className={styles.signOut}
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out
      </button>
    </div>
  );
}
