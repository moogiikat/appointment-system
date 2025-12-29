import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get reservations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const date = searchParams.get('date');
    const userId = searchParams.get('user_id');

    let reservations;

    if (shopId && date) {
      reservations = await sql`
        SELECT r.*, s.name as shop_name
        FROM reservations r
        JOIN shops s ON r.shop_id = s.id
        WHERE r.shop_id = ${shopId} AND r.reservation_date = ${date}
        ORDER BY r.reservation_time
      `;
    } else if (shopId) {
      reservations = await sql`
        SELECT r.*, s.name as shop_name
        FROM reservations r
        JOIN shops s ON r.shop_id = s.id
        WHERE r.shop_id = ${shopId}
        ORDER BY r.reservation_date DESC, r.reservation_time
      `;
    } else if (userId) {
      reservations = await sql`
        SELECT r.*, s.name as shop_name
        FROM reservations r
        JOIN shops s ON r.shop_id = s.id
        WHERE r.user_id = ${userId}
        ORDER BY r.reservation_date DESC, r.reservation_time
      `;
    } else if (session?.user && (session.user as { role?: string }).role === 'super_admin') {
      reservations = await sql`
        SELECT r.*, s.name as shop_name
        FROM reservations r
        JOIN shops s ON r.shop_id = s.id
        ORDER BY r.reservation_date DESC, r.reservation_time
        LIMIT 100
      `;
    } else {
      return NextResponse.json({ error: 'Параметр шаардлагатай' }, { status: 400 });
    }

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Захиалгуудыг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Create new reservation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const {
      shop_id,
      user_id,
      customer_name,
      customer_phone,
      customer_email,
      reservation_date,
      reservation_time,
      notes,
      status: requestedStatus,
    } = body;

    // Validate required fields
    if (!shop_id || !customer_name || !reservation_date || !reservation_time) {
      return NextResponse.json(
        { error: 'Шаардлагатай талбаруудыг бөглөнө үү' },
        { status: 400 }
      );
    }

    // Get shop info
    const shops = await sql`SELECT * FROM shops WHERE id = ${shop_id}`;
    if (shops.length === 0) {
      return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 });
    }

    const shop = shops[0];

    // Check if within business hours
    const timeValue = reservation_time.slice(0, 5);
    const openingTime = shop.opening_time.slice(0, 5);
    const closingTime = shop.closing_time.slice(0, 5);

    if (timeValue < openingTime || timeValue >= closingTime) {
      return NextResponse.json(
        { error: 'Ажлын цагийн дотор захиалга хийнэ үү' },
        { status: 400 }
      );
    }

    // Check capacity for this time slot
    const existingReservations = await sql`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE shop_id = ${shop_id}
        AND reservation_date = ${reservation_date}
        AND reservation_time = ${reservation_time}
        AND status NOT IN ('cancelled')
    `;

    const currentCount = Number(existingReservations[0].count);
    if (currentCount >= shop.max_capacity) {
      return NextResponse.json(
        { error: 'Энэ цагт захиалга дүүрсэн байна. Өөр цаг сонгоно уу.' },
        { status: 400 }
      );
    }

    // Determine status - only admins can set custom status
    const userRole = (session?.user as { role?: string })?.role;
    const isAdmin = userRole === 'shop_admin' || userRole === 'super_admin';
    const finalStatus = isAdmin && requestedStatus ? requestedStatus : 'pending';

    // Create reservation
    const result = await sql`
      INSERT INTO reservations (shop_id, user_id, customer_name, customer_phone, customer_email, reservation_date, reservation_time, notes, status)
      VALUES (${shop_id}, ${user_id || null}, ${customer_name}, ${customer_phone || null}, ${customer_email || null}, ${reservation_date}, ${reservation_time}, ${notes || null}, ${finalStatus})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Захиалга үүсгэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

