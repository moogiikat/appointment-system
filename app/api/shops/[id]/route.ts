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
      SELECT s.*,
        COALESCE(rv.rating_avg, 0) AS rating_avg,
        COALESCE(rv.rating_count, 0) AS rating_count
      FROM shops s
      LEFT JOIN (
        SELECT shop_id,
               ROUND(AVG(rating)::numeric, 1)::float8 AS rating_avg,
               COUNT(*)::int AS rating_count
        FROM reviews
        GROUP BY shop_id
      ) rv ON rv.shop_id = s.id
      WHERE s.id = ${id}
    `;

    if (shops.length === 0) {
      return NextResponse.json(
        { error: 'Үйлчилгээний газар олдсонгүй' },
        { status: 404 }
      );
    }

    /*
     * 審査待ち・却下の店舗は、URL を直に叩かれても顧客には返さない。
     * 見てよいのは super_admin と、その店舗自身の管理者だけ。
     */
    const shop = shops[0];
    if (shop.status !== 'approved' || !shop.is_active) {
      const session = await auth();
      const role = (session?.user as { role?: string })?.role;
      const ownShopId = (session?.user as { shopId?: number })?.shopId;
      const allowed = role === 'super_admin' || ownShopId === Number(id);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Үйлчилгээний газар олдсонгүй' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээний газарийг татахад алдаа гарлаа' },
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
      category,
      district,
      photos,
      opening_time,
      closing_time,
      slot_duration,
      max_capacity,
      is_active,
      points_per_visit,
    } = body;

    /*
     * is_active と status は審査の結果であって、店舗自身が動かしてよい値ではない。
     * 以前は is_active !== false という判定だったため、店舗管理者が設定を保存する
     * たびに（body に is_active が無くても）true に戻り、審査待ちのまま公開されていた。
     */
    const isSuperAdmin = userRole === 'super_admin';

    const result = await sql`
      UPDATE shops
      SET name = ${name},
          description = ${description || ''},
          address = ${address || ''},
          phone = ${phone || ''},
          icon = ${icon || null},
          category = ${category || null},
          district = ${district || null},
          photos = ${Array.isArray(photos) ? photos : []},
          opening_time = ${opening_time || '09:00'},
          closing_time = ${closing_time || '18:00'},
          slot_duration = ${slot_duration || 30},
          max_capacity = ${max_capacity || 1},
          points_per_visit = ${points_per_visit ?? 0},
          is_active = CASE WHEN ${isSuperAdmin} THEN ${is_active !== false} ELSE is_active END
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Үйлчилгээний газар олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээний газар шинэчлэхэд алдаа гарлаа' },
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

    return NextResponse.json({ message: 'Үйлчилгээний газар устгагдлаа' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json(
      { error: 'Үйлчилгээний газар устгахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

