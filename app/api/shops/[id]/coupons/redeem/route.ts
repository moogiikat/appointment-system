import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Shop admin marks a claimed coupon as used, by its code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    const userShopId = (session?.user as { shopId?: number })?.shopId;
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    if (userRole !== 'super_admin' && userShopId !== Number(id)) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Купоны код шаардлагатай' }, { status: 400 });
    }

    const rows = await sql`
      SELECT uc.*, sc.title, u.name AS user_name
      FROM user_coupons uc
      JOIN shop_coupons sc ON uc.coupon_id = sc.id
      JOIN users u ON uc.user_id = u.id
      WHERE uc.code = ${code} AND uc.shop_id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Купон олдсонгүй' }, { status: 404 });
    }

    if (rows[0].used_at) {
      return NextResponse.json({ error: 'Энэ купон өмнө нь ашигласан байна' }, { status: 400 });
    }

    const result = await sql`
      UPDATE user_coupons SET used_at = CURRENT_TIMESTAMP
      WHERE id = ${rows[0].id}
      RETURNING *
    `;

    return NextResponse.json({ ...result[0], title: rows[0].title, user_name: rows[0].user_name });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json(
      { error: 'Купон ашиглахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
