import "./globals.css";

export const metadata = {
  title: "LCWK Reports",
  description: "Annual reports dashboard for LCWK.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
