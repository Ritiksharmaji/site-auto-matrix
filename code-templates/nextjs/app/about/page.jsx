import { SITE_NAME } from "../../lib/site";

export const metadata = { title: `About – ${SITE_NAME}` };

export default function About() {
  return (
    <section className="section">
      <div className="container">
        <h2>About {SITE_NAME}</h2>
        <p style={{ textAlign: "center" }}>A second page, exported to /about/index.html.</p>
      </div>
    </section>
  );
}
