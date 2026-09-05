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
     * 送られてこなかった項目は「変更しない」。
     *
     * 以前はここで icon || null のように既定値へ落としていたため、その項目を
     * 持たない画面から保存すると値が消えていた。実際、店舗設定画面は icon を
     * 送らないので、保存するたびにロゴが NULL になっていた。
     * points_per_visit が保存されなかったのも is_active が勝手に true へ
     * 戻っていたのも、すべて同じ原因。
     *
     * 「キーが無い＝据え置き」「空文字＝明示的に消す」で区別する。
     */
    const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);

    // is_active と status は審査の結果であり、店舗自身が動かしてよい値ではない
    const isSuperAdmin = userRole === 'super_admin';

    const result = await sql`
      UPDATE shops
      SET name         = CASE WHEN ${has('name')}        THEN ${name}                                      ELSE name END,
          description  = CASE WHEN ${has('description')} THEN ${description ?? ''}                         ELSE description END,
          address      = CASE WHEN ${has('address')}     THEN ${address ?? ''}                             ELSE address END,
          phone        = CASE WHEN ${has('phone')}       THEN ${phone ?? ''}                               ELSE phone END,
          icon         = CASE WHEN ${has('icon')}        THEN ${icon || null}                              ELSE icon END,
          category     = CASE WHEN ${has('category')}    THEN ${category || null}                          ELSE category END,
          district     = CASE WHEN ${has('district')}    THEN ${district || null}                           ELSE district END,
          photos       = CASE WHEN ${has('photos')}      THEN ${Array.isArray(photos) ? photos : []}       ELSE photos END,
          opening_time = CASE WHEN ${has('opening_time')} THEN ${opening_time || '09:00'}                  ELSE opening_time END,
          closing_time = CASE WHEN ${has('closing_time')} THEN ${closing_time || '18:00'}                  ELSE closing_time END,
          slot_duration = CASE WHEN ${has('slot_duration')} THEN ${slot_duration || 30}                    ELSE slot_duration END,
          max_capacity = CASE WHEN ${has('max_capacity')} THEN ${max_capacity || 1}                        ELSE max_capacity END,
          points_per_visit = CASE WHEN ${has('points_per_visit')} THEN ${points_per_visit ?? 0}            ELSE points_per_visit END,
          is_active    = CASE WHEN ${isSuperAdmin && has('is_active')} THEN ${is_active !== false}         ELSE is_active END
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

