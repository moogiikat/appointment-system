import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';
import {
  sendEmail,
  reservationConfirmedEmail,
  reservationCancelledEmail,
  reservationCompletedEmail,
} from '@/lib/email';

// Get single reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservations = await sql`
      SELECT r.*, s.name as shop_name
      FROM reservations r
      JOIN shops s ON r.shop_id = s.id
      WHERE r.id = ${id}
    `;

    if (reservations.length === 0) {
      return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(reservations[0]);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Захиалга татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Update reservation status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Verify permission
    const userRole = (session.user as { role?: string }).role;
    const userShopId = (session.user as { shopId?: number }).shopId;

    if (userRole === 'customer') {
      // Customers can only cancel their own reservations
      const reservation = await sql`SELECT * FROM reservations WHERE id = ${id}`;
      if (reservation.length === 0) {
        return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
      }
      if (reservation[0].user_id !== (session.user as { id?: number }).id) {
        return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
      }
      if (status !== 'cancelled') {
        return NextResponse.json({ error: 'Зөвхөн цуцлах боломжтой' }, { status: 400 });
      }
    } else if (userRole === 'shop_admin') {
      // Shop admin can only update their shop's reservations
      const reservation = await sql`SELECT * FROM reservations WHERE id = ${id}`;
      if (reservation.length === 0) {
        return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
      }
      if (reservation[0].shop_id !== userShopId) {
        return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
      }
    }
    // Super admin can update any reservation

    const result = await sql`
      UPDATE reservations
      SET status = ${status}, notes = COALESCE(${notes}, notes)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
    }

    const reservation = result[0];
    const shops = await sql`SELECT name, points_per_visit FROM shops WHERE id = ${reservation.shop_id}`;
    const shopInfo = shops[0];

    // Award loyalty points on completion (idempotent, no real payment involved)
    let pointsEarned = 0;
    if (status === 'completed' && reservation.user_id) {
      const pointsPerVisit = shopInfo?.points_per_visit || 0;
      if (pointsPerVisit > 0) {
        const inserted = await sql`
          INSERT INTO point_transactions (user_id, shop_id, reservation_id, amount, reason, description)
          VALUES (${reservation.user_id}, ${reservation.shop_id}, ${reservation.id}, ${pointsPerVisit}, 'visit', 'Захиалга дуусгасны оноо')
          ON CONFLICT (reservation_id, reason) DO NOTHING
          RETURNING amount
        `;
        pointsEarned = inserted[0]?.amount || 0;
      }
    }

    // Notify the customer by email on status changes
    if (reservation.customer_email && shopInfo) {
      const emailInfo = {
        shopName: shopInfo.name,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        customerName: reservation.customer_name,
      };
      if (status === 'confirmed') {
        await sendEmail({
          to: reservation.customer_email,
          subject: 'Захиалга баталгаажлаа',
          html: reservationConfirmedEmail(emailInfo),
        });
      } else if (status === 'cancelled') {
        await sendEmail({
          to: reservation.customer_email,
          subject: 'Захиалга цуцлагдлаа',
          html: reservationCancelledEmail(emailInfo),
        });
      } else if (status === 'completed') {
        await sendEmail({
          to: reservation.customer_email,
          subject: 'Үйлчилгээ дууслаа',
          html: reservationCompletedEmail({ ...emailInfo, pointsEarned }),
        });
      }
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Захиалга шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Delete reservation (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const { id } = await params;
    await sql`DELETE FROM reservations WHERE id = ${id}`;

    return NextResponse.json({ message: 'Захиалга устгагдлаа' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: 'Захиалга устгахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

