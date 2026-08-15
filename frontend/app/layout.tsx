import "./globals.css";
import { AppProviders } from "../components/AppProviders";

export const metadata = { title: "Ledger", description: "Offline-first expense tracker" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
