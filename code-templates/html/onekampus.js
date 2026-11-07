// Connects this website to the oneKampus platform.
// - Every <form data-onekampus-form="..."> is sent to the Enquiries inbox (alerts + auto-reply).
// - Each page load is counted (anonymously) for the Analytics tab.
// On localhost nothing is sent.
(function () {
  var local = ["localhost", "127.0.0.1"].indexOf(location.hostname) !== -1;

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
      var button = form.querySelector("button");
      var payload = {
        formType: form.getAttribute("data-onekampus-form") || "contact",
        name: data.get("name") || "",
        email: data.get("email") || "",
        phone: data.get("phone") || "",
        message: data.get("message") || "",
      };
      var done = function () { form.outerHTML = '<p class="form-done">Thank you! We have received your details and will get back to you soon.</p>'; };
      if (local) { console.info("[oneKampus] Enquiry not sent while developing locally:", payload); return done(); }
      button.disabled = true;
      fetch("/api/public/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Sorry, the form could not be sent."); }); })
        .then(done)
        .catch(function (err) { error.textContent = err.message; error.hidden = false; button.disabled = false; });
    });
  });
})();
