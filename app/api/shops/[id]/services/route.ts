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

// Get services (menu / price list) for a shop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const services = await sql`
      SELECT * FROM shop_services WHERE shop_id = ${id} AND is_active = true ORDER BY id
    `;
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching shop services:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээний жагсаалтыг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Create a new service for a shop
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
    const { name, price, duration_minutes, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Нэрийг бөглөнө үү' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO shop_services (shop_id, name, price, duration_minutes, description)
      VALUES (${id}, ${name}, ${price || null}, ${duration_minutes || null}, ${description || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating shop service:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээ нэмэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
