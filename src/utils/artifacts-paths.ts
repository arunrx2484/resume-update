import path from "node:path";

/**
 * Base folder for runtime artifacts (logs, screenshots). When unset, uses `reports/` under cwd.
 * Set by `scripts/run-naukri-scheduled.sh` for macOS cron (Documents TCC often blocks writes there).
 */
export function getReportsArtifactRoot(): string {
  const override = process.env.FRAMEWORK_ARTIFACTS_ROOT?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.resolve(process.cwd(), "reports");
}
