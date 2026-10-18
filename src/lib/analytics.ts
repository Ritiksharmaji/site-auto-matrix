import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";

export type SiteAnalytics = {
  days: number;
  views: number;
  visitors: number;
  daily: { date: string; views: number }[];
  referrers: { host: string; views: number }[];
};

/** Views / unique visitors for one site over the last `days` days. */
export async function siteAnalytics(siteId: string, days = 30): Promise<SiteAnalytics> {
  const since = startOfDay(days - 1);
  const where = { siteId, createdAt: { gte: since } };
  const [views, visitorsRows, dailyRows, refRows] = await Promise.all([
    db.pageView.count({ where }),
    db.pageView.groupBy({ by: ["visitorHash"], where }),
    db.$queryRaw<{ day: Date; views: bigint }[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS views
      FROM "PageView" WHERE "siteId" = ${siteId} AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`),
    db.pageView.groupBy({ by: ["referrer"], where: { ...where, referrer: { not: null } }, _count: true, orderBy: { _count: { referrer: "desc" } }, take: 5 }),
  ]);

  const byDay = new Map(dailyRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.views)]));
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    return { date: d, views: byDay.get(d) ?? 0 };
  });
  return {
    days,
    views,
    visitors: visitorsRows.length,
    daily,
    referrers: refRows.map((r) => ({ host: r.referrer ?? "", views: r._count })),
  };
}

/** Total views per site for the last `days` days. */
export async function viewsBySite(siteIds: string[], days = 30) {
  if (siteIds.length === 0) return new Map<string, number>();
  const rows = await db.pageView.groupBy({ by: ["siteId"], where: { siteId: { in: siteIds }, createdAt: { gte: startOfDay(days - 1) } }, _count: true });
  return new Map(rows.map((r) => [r.siteId, r._count]));
}

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}
