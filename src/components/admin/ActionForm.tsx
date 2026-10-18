"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/admin";

/** Form wrapper for server actions that return { error } / { ok } messages. */
export default function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
