import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get reviews for a shop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = await sql`
      SELECT rv.*, u.name AS user_name, u.avatar AS user_avatar
      FROM reviews rv
      JOIN users u ON rv.user_id = u.id
      WHERE rv.shop_id = ${id}
      ORDER BY rv.created_at DESC
    `;
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Сэтгэгдлийг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Create a review (only for the reviewer's own completed reservation at this shop)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id?: number }).id;
    const body = await request.json();
    const { reservation_id, rating, comment } = body;

    if (!reservation_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Захиалга болон 1-5 үнэлгээг зөв бөглөнө үү' },
        { status: 400 }
      );
    }

    const reservations = await sql`
      SELECT * FROM reservations
      WHERE id = ${reservation_id} AND shop_id = ${id} AND user_id = ${userId}
    `;

    if (reservations.length === 0) {
      return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
    }

    if (reservations[0].status !== 'completed') {
      return NextResponse.json(
        { error: 'Зөвхөн дууссан захиалгад сэтгэгдэл үлдээх боломжтой' },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM reviews WHERE shop_id = ${id} AND reservation_id = ${reservation_id}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Та энэ захиалгад сэтгэгдэл өгсөн байна' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO reviews (shop_id, user_id, reservation_id, rating, comment)
      VALUES (${id}, ${userId}, ${reservation_id}, ${rating}, ${comment || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Сэтгэгдэл нэмэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
