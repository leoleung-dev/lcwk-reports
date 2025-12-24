"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import styles from "./Login.module.css";

const errorMessages = {
  AccessDenied: "This Google account is not on the access list.",
  OAuthSignin: "Unable to start Google sign in.",
  OAuthCallback: "Google sign in failed. Please try again.",
  OAuthCreateAccount: "Unable to create a session with Google.",
  default: "Unable to sign in. Please try again.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = error ? errorMessages[error] || errorMessages.default : "";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>LCWK Reports</p>
        <h1>Sign in to continue</h1>
        <p className={styles.subtitle}>
          Use your approved Google account to access internal reports.
        </p>
        {message ? <p className={styles.error}>{message}</p> : null}
        <button
          className={styles.primaryButton}
          onClick={() => signIn("google", { callbackUrl: "/" })}
          type="button"
        >
          Sign in with Google
        </button>
      </section>
    </main>
  );
}
