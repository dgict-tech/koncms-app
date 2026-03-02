/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Compute the site share of a video's revenue based on user role.
 * - `user` -> 60%
 * - `admin` or `super_admin` or `super-admin` -> 80%
 *
 * Returns a number rounded to 2 decimal places.
 */
export function computeRevenueShare(
  revenue: number | string | null | undefined,
  role: string | null | undefined,
): number {
  const rev = Number(revenue ?? 0) || 0;
  const r = (role ?? "").toString().toLowerCase();

  const pct = 0.8; // default to 80%

  const share = rev * pct;
  let result = Math.round(share * 100) / 100;

  if (r === "admin" || r === "super_admin" || r === "super-admin")
    return result ?? 0;
  if (r === "user") result = Math.round(result * 0.6 * 100) / 100;
  return result ?? 0;
}

export default computeRevenueShare;
