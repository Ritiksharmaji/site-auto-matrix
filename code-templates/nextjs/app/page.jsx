import EnquiryForm from "../components/EnquiryForm";
import { SITE_NAME } from "../lib/site";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Welcome to {SITE_NAME}</h1>
          <p>This Next.js starter is connected to oneKampus. Edit app/page.jsx, push, and it goes live.</p>
          <a className="btn" href="#contact">Get in touch</a>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2>What we do</h2>
          <div className="grid">
            {["Fast", "Reliable", "Friendly"].map((t) => (
              <div className="card" key={t}>
                <h3>{t}</h3>
                <p>Replace this text with the customer&apos;s services.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section alt" id="contact">
        <div className="container">
          <h2>Contact us</h2>
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
