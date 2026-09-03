import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

async function assertShopAdmin(shopId: string) {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role;
  const userShopId = (session?.user as { shopId?: number })?.shopId;
  if (!session?.user) return { ok: false, status: 401, error: 'Нэвтрэх шаардлагатай' };
  if (userRole !== 'super_admin' && userShopId !== Number(shopId)) {
    return { ok: false, status: 403, error: 'Зөвшөөрөлгүй хандалт' };
  }
  return { ok: true as const };
}

// Update a coupon (shop admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; couponId: string }> }
) {
  try {
    const { id, couponId } = await params;
    const check = await assertShopAdmin(id);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await request.json();
    const { title, description, points_cost, max_claims, is_active } = body;

    const result = await sql`
      UPDATE shop_coupons
      SET title = ${title},
          description = ${description || null},
          points_cost = ${points_cost || 0},
          max_claims = ${max_claims || null},
          is_active = ${is_active !== false}
      WHERE id = ${couponId} AND shop_id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Купон олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Купон шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Delete (deactivate) a coupon (shop admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; couponId: string }> }
) {
  try {
    const { id, couponId } = await params;
    const check = await assertShopAdmin(id);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    await sql`DELETE FROM shop_coupons WHERE id = ${couponId} AND shop_id = ${id}`;

    return NextResponse.json({ message: 'Купон устгагдлаа' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Купон устгахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
