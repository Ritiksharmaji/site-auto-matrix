import Link from "next/link";
import PageViews from "../components/PageViews";
import { SITE_NAME } from "../lib/site";
import "./globals.css";

export const metadata = { title: SITE_NAME, description: SITE_NAME };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageViews />
        <header className="header">
          <div className="container">
            <Link href="/" className="logo">{SITE_NAME}</Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/about/">About</Link>
              <a href="/#contact">Contact</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">© {new Date().getFullYear()} {SITE_NAME}</footer>
      </body>
    </html>
  );
}
