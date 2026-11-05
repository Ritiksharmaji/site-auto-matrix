import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <h2>Page not found</h2>
        <p style={{ textAlign: "center" }}><Link href="/">Back to home</Link></p>
      </div>
    </section>
  );
}
