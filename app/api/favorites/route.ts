import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get the current user's favorite shops
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    const userId = (session.user as { id?: number }).id;

    const shops = await sql`
      SELECT s.*, f.created_at AS favorited_at
      FROM favorites f
      JOIN shops s ON f.shop_id = s.id
      WHERE f.user_id = ${userId}
      ORDER BY f.created_at DESC
    `;

    return NextResponse.json(shops);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Хадгалсан газруудыг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Add a shop to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    const userId = (session.user as { id?: number }).id;

    const body = await request.json();
    const { shop_id } = body;
    if (!shop_id) {
      return NextResponse.json({ error: 'shop_id шаардлагатай' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO favorites (user_id, shop_id)
      VALUES (${userId}, ${shop_id})
      ON CONFLICT (user_id, shop_id) DO NOTHING
      RETURNING *
    `;

    return NextResponse.json(result[0] || { user_id: userId, shop_id }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Хадгалахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Remove a shop from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    const userId = (session.user as { id?: number }).id;

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id шаардлагатай' }, { status: 400 });
    }

    await sql`DELETE FROM favorites WHERE user_id = ${userId} AND shop_id = ${shopId}`;

    return NextResponse.json({ message: 'Хадгалснаас хаслаа' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Устгахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
