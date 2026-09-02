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

// Get active coupons for a shop (public listing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === '1';

    const coupons = includeInactive
      ? await sql`SELECT * FROM shop_coupons WHERE shop_id = ${id} ORDER BY id DESC`
      : await sql`
          SELECT * FROM shop_coupons
          WHERE shop_id = ${id} AND is_active = true
            AND (max_claims IS NULL OR claimed_count < max_claims)
          ORDER BY id DESC
        `;

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Купоны жагсаалтыг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Create a new coupon for a shop (shop admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await assertShopAdmin(id);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await request.json();
    const { title, description, points_cost, max_claims } = body;

    if (!title) {
      return NextResponse.json({ error: 'Гарчиг шаардлагатай' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO shop_coupons (shop_id, title, description, points_cost, max_claims)
      VALUES (${id}, ${title}, ${description || null}, ${points_cost || 0}, ${max_claims || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Купон нэмэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
