import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import EnquiryForm from "./components/EnquiryForm.jsx";
import { trackPageView } from "./onekampus";

const SITE_NAME = "__NAME__";

export default function App() {
  const location = useLocation();
  useEffect(() => trackPageView(), [location.pathname]);

  return (
    <>
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">{SITE_NAME}</Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <a href="/#contact">Contact</a>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="footer">© {new Date().getFullYear()} {SITE_NAME}</footer>
    </>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Welcome to {SITE_NAME}</h1>
          <p>This React starter is connected to oneKampus. Edit src/App.jsx, push, and it goes live.</p>
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
                <p>Replace this text with the customer's services.</p>
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

function About() {
  return (
    <section className="section">
      <div className="container">
        <h2>About {SITE_NAME}</h2>
        <p style={{ textAlign: "center" }}>A second page, to show that page links work after publishing.</p>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <h2>Page not found</h2>
        <p style={{ textAlign: "center" }}><Link to="/">Back to home</Link></p>
      </div>
    </section>
  );
}
