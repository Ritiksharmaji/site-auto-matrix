// Connects this website to the oneKampus platform.
// - Every <form data-onekampus-form="..."> is sent to the Enquiries inbox, with the
//   site's email / WhatsApp alerts and auto-reply. Fields: name, email, phone,
//   message; any field named "extra.<something>" is saved as an extra answer
//   (labelled with its aria-label).
// - Each page load is counted anonymously for the Analytics tab.
// Nothing is sent while you open the files locally (localhost / file://).
(function () {
  var local = location.protocol === "file:" || ["localhost", "127.0.0.1"].indexOf(location.hostname) !== -1;

  if (!local) {
    var ref = document.referrer && document.referrer.indexOf(location.origin) !== 0 ? document.referrer : "";
    var body = JSON.stringify({ path: location.pathname, referrer: ref });
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/track", body))) fetch("/api/track", { method: "POST", body: body, keepalive: true });
  }

  document.querySelectorAll("form[data-onekampus-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      if (data.get("company_website")) return;
      var error = form.querySelector(".form-error");
      var button = form.querySelector("button[type=submit], button");
      var extra = {};
      form.querySelectorAll("[name^='extra.']").forEach(function (el) {
        if (el.value) extra[el.getAttribute("aria-label") || el.name.slice(6)] = el.value;
      });
      var payload = {
        formType: form.getAttribute("data-onekampus-form") || "contact",
        name: data.get("name") || "",
        email: data.get("email") || "",
        phone: data.get("phone") || "",
        message: data.get("message") || "",
        extra: extra,
      };
      var done = function () {
        form.outerHTML = '<p class="py-6 text-center font-medium">Thank you! We have received your details and will contact you soon.</p>';
      };
      if (local) { console.info("[oneKampus] Enquiry not sent from a local copy:", payload); return done(); }
      if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = "Sending…"; }
      fetch("/api/public/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Sorry, the form could not be sent."); }); })
        .then(done)
        .catch(function (err) {
          if (error) { error.textContent = err.message; error.hidden = false; }
          if (button) { button.disabled = false; button.textContent = button.dataset.label; }
        });
    });
  });
})();
