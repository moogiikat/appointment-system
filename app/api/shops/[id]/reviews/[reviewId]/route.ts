import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Shop admin (or super admin) replies to a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    const userShopId = (session?.user as { shopId?: number })?.shopId;
    const { id, reviewId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    if (userRole !== 'super_admin' && userShopId !== Number(id)) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const body = await request.json();
    const { shop_reply } = body;

    const result = await sql`
      UPDATE reviews
      SET shop_reply = ${shop_reply || null}, shop_reply_at = CURRENT_TIMESTAMP
      WHERE id = ${reviewId} AND shop_id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Сэтгэгдэл олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error replying to review:', error);
    return NextResponse.json(
      { error: 'Хариулт нэмэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
