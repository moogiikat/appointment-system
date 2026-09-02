import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get the current user's claimed coupons (wallet)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    const userId = (session.user as { id?: number }).id;

    const coupons = await sql`
      SELECT uc.*, sc.title, sc.description, s.name AS shop_name
      FROM user_coupons uc
      JOIN shop_coupons sc ON uc.coupon_id = sc.id
      JOIN shops s ON uc.shop_id = s.id
      WHERE uc.user_id = ${userId}
      ORDER BY uc.claimed_at DESC
    `;

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching my coupons:', error);
    return NextResponse.json(
      { error: 'Купонуудыг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
