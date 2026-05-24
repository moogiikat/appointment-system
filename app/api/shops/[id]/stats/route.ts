import { NextRequest, NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import sql from '@/lib/db';
import { auth } from '@/auth';
import { getMongoliaDate, parseMongoliaDate } from '@/lib/utils';
import { ShopDashboardStats } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }

    const { id } = await params;
    const shopId = Number(id);
    const userRole = (session.user as { role?: string })?.role;
    const userShopId = (session?.user as { shopId?: number })?.shopId;

    if (userRole !== 'super_admin' && userRole !== 'shop_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    if (userRole === 'shop_admin' && userShopId !== shopId) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const shops = await sql`SELECT id FROM shops WHERE id = ${shopId}`;
    if (shops.length === 0) {
      return NextResponse.json({ error: 'Үйлчилгээний газар олдсонгүй' }, { status: 404 });
    }

    const today = getMongoliaDate();
    const todayDate = parseMongoliaDate(today);
    const weekStart = format(subDays(todayDate, 6), 'yyyy-MM-dd');
    const monthStart = format(subDays(todayDate, 29), 'yyyy-MM-dd');

    const [todayResult, weekResult, monthResult, monthStatusResult, popularTimes, dailyCounts] =
      await Promise.all([
        sql`
          SELECT COUNT(*) as count FROM reservations
          WHERE shop_id = ${shopId} AND reservation_date = ${today} AND status != 'cancelled'
        `,
        sql`
          SELECT COUNT(*) as count FROM reservations
          WHERE shop_id = ${shopId} AND reservation_date >= ${weekStart} AND status != 'cancelled'
        `,
        sql`
          SELECT COUNT(*) as count FROM reservations
          WHERE shop_id = ${shopId} AND reservation_date >= ${monthStart} AND status != 'cancelled'
        `,
        sql`
          SELECT status, COUNT(*) as count FROM reservations
          WHERE shop_id = ${shopId} AND reservation_date >= ${monthStart}
          GROUP BY status
        `,
        sql`
          SELECT reservation_time, COUNT(*) as count FROM reservations
          WHERE shop_id = ${shopId} AND reservation_date >= ${monthStart} AND status != 'cancelled'
          GROUP BY reservation_time
          ORDER BY count DESC
          LIMIT 5
        `,
        sql`
          SELECT reservation_date, COUNT(*) as count FROM reservations
          WHERE shop_id = ${shopId} AND reservation_date >= ${weekStart} AND status != 'cancelled'
          GROUP BY reservation_date
          ORDER BY reservation_date
        `,
      ]);

    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
    for (const row of monthStatusResult) {
      statusMap[row.status] = Number(row.count);
    }

    const monthTotal = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const cancellationRate =
      monthTotal > 0 ? Math.round((statusMap.cancelled / monthTotal) * 100) : 0;
    const completionRate =
      monthTotal > 0 ? Math.round((statusMap.completed / monthTotal) * 100) : 0;

    const dailyCountMap: Record<string, number> = {};
    for (const row of dailyCounts) {
      dailyCountMap[String(row.reservation_date).slice(0, 10)] = Number(row.count);
    }

    const daily_counts = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(todayDate, 6 - i), 'yyyy-MM-dd');
      return { date, count: dailyCountMap[date] || 0 };
    });

    const stats: ShopDashboardStats = {
      today_count: Number(todayResult[0].count),
      week_count: Number(weekResult[0].count),
      month_count: Number(monthResult[0].count),
      cancellation_rate: cancellationRate,
      completion_rate: completionRate,
      status_breakdown: {
        pending: statusMap.pending,
        confirmed: statusMap.confirmed,
        cancelled: statusMap.cancelled,
        completed: statusMap.completed,
      },
      popular_times: popularTimes.map((row) => ({
        time: String(row.reservation_time).slice(0, 5),
        count: Number(row.count),
      })),
      daily_counts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching shop stats:', error);
    return NextResponse.json(
      { error: 'Статистик татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
