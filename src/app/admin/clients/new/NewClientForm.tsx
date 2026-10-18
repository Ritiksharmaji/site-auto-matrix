"use client";

import { useActionState, useState } from "react";
import { createClient, type FormState } from "@/app/actions/admin";
import ModulePicker from "@/components/admin/ModulePicker";

type Props = { modules: Parameters<typeof ModulePicker>[0]["modules"]; platformHost: string };

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default function NewClientForm({ modules, platformHost }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createClient, {});
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-900">1. Business details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Business / school name</label>
            <input id="name" name="name" required className="input" onChange={(e) => !slugTouched && setSlug(toSlug(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="contactName">Contact person</label>
            <input id="contactName" name="contactName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className="input" />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-900">2. Client login</h2>
        <p className="text-sm text-slate-500">The client uses this to sign in and update their own website content.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">Login email</label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (min 8 characters)</label>
            <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-900">3. Website</h2>
        <ModulePicker modules={modules} />
        <div>
          <label className="label" htmlFor="slug">Web address</label>
          <div className="flex items-center">
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(toSlug(e.target.value));
              }}
              className="input rounded-r-none"
            />
            <span className="rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">.{platformHost}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">You can connect a custom domain later in the website settings.</p>
        </div>
      </section>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Creating…" : "Create client & website"}</button>
      </div>
    </form>
  );
}
