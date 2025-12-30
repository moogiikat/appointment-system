import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get single shop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shops = await sql`
      SELECT * FROM shops WHERE id = ${id}
    `;

    if (shops.length === 0) {
      return NextResponse.json(
        { error: 'Дэлгүүр олдсонгүй' },
        { status: 404 }
      );
    }

    return NextResponse.json(shops[0]);
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { error: 'Дэлгүүрийг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Update shop
export async function PUT(
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
    const {
      name,
      description,
      address,
      phone,
      icon,
      opening_time,
      closing_time,
      slot_duration,
      max_capacity,
      is_active,
    } = body;

    const result = await sql`
      UPDATE shops 
      SET name = ${name}, 
          description = ${description || ''},
          address = ${address || ''},
          phone = ${phone || ''},
          icon = ${icon || null},
          opening_time = ${opening_time || '09:00'},
          closing_time = ${closing_time || '18:00'},
          slot_duration = ${slot_duration || 30},
          max_capacity = ${max_capacity || 1},
          is_active = ${is_active !== false}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json(
      { error: 'Дэлгүүр шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Delete shop (super admin only)
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
    await sql`DELETE FROM shops WHERE id = ${id}`;

    return NextResponse.json({ message: 'Дэлгүүр устгагдлаа' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json(
      { error: 'Дэлгүүр устгахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

