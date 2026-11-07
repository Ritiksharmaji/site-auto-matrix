import "server-only";
import { FRAMEWORKS } from "./code-sites";
import { githubConfig } from "./github";
import type { StaffPermissions } from "./permissions";

/** Code-website choices for the start picker, or undefined when the user may not create them. */
export function codeStartOptions(perms: StaffPermissions) {
  if (!perms.canCreateCodeSites) return undefined;
  return { frameworks: FRAMEWORKS.map(({ value, label, description }) => ({ value, label, description })), githubReady: githubConfig().ready };
}
