import Link from "next/link";
import { hr } from "../src/i18n/hr.js";
import "./globals.css";

export const metadata = {
  title: hr.app.name,
  description: hr.app.description,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hr">
      <body>
        <header className="bar">
          <Link href="/" id="nav-home">
            {hr.app.name}
          </Link>
          <span id="variant">{hr.app.variant}</span>
        </header>
        <main id="view">{children}</main>
      </body>
    </html>
  );
}
