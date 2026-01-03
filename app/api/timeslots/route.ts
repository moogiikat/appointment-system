import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateTimeSlots } from '@/lib/utils';
import { TimeSlot } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const date = searchParams.get('date');

    if (!shopId || !date) {
      return NextResponse.json(
        { error: 'shop_id болон date параметр шаардлагатай' },
        { status: 400 }
      );
    }

    // Get shop info
    const shops = await sql`SELECT * FROM shops WHERE id = ${shopId}`;
    if (shops.length === 0) {
      return NextResponse.json({ error: 'Үйлчилгээний газар олдсонгүй' }, { status: 404 });
    }

    const shop = shops[0];
    const openingTime = shop.opening_time.slice(0, 5);
    const closingTime = shop.closing_time.slice(0, 5);

    // Generate all time slots
    const allSlots = generateTimeSlots(openingTime, closingTime, shop.slot_duration);

    // Get existing reservations for this date
    const reservations = await sql`
      SELECT reservation_time, COUNT(*) as count
      FROM reservations
      WHERE shop_id = ${shopId}
        AND reservation_date = ${date}
        AND status NOT IN ('cancelled')
      GROUP BY reservation_time
    `;

    // Create a map of reservation counts
    const reservationCounts: Record<string, number> = {};
    for (const r of reservations) {
      const time = r.reservation_time.slice(0, 5);
      reservationCounts[time] = Number(r.count);
    }

    // Build time slots with availability
    const timeSlots: TimeSlot[] = allSlots.map((time) => {
      const currentCount = reservationCounts[time] || 0;
      return {
        time,
        available: currentCount < shop.max_capacity,
        current_count: currentCount,
        max_capacity: shop.max_capacity,
      };
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Цагийн мэдээлэл татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

