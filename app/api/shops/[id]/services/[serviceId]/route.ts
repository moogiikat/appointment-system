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

// Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id, serviceId } = await params;
    const check = await assertShopAdmin(id);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await request.json();
    const { name, price, duration_minutes, description, is_active } = body;

    const result = await sql`
      UPDATE shop_services
      SET name = ${name},
          price = ${price || null},
          duration_minutes = ${duration_minutes || null},
          description = ${description || null},
          is_active = ${is_active !== false}
      WHERE id = ${serviceId} AND shop_id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Үйлчилгээ олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating shop service:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээ шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id, serviceId } = await params;
    const check = await assertShopAdmin(id);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    await sql`DELETE FROM shop_services WHERE id = ${serviceId} AND shop_id = ${id}`;

    return NextResponse.json({ message: 'Үйлчилгээ устгагдлаа' });
  } catch (error) {
    console.error('Error deleting shop service:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээ устгахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
