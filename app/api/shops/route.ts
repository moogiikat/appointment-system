import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { auth } from "@/auth";

// Get all shops (optionally filtered by category, district, keyword)
export async function GET(request: NextRequest) {
  try {
    // 管理者は審査待ち・却下も含めて全件見る必要がある（承認作業がここで止まるため）
    const session = await auth();
    const isSuperAdmin = (session?.user as { role?: string })?.role === 'super_admin';

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const district = searchParams.get('district');
    const q = searchParams.get('q');

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
      WHERE (${isSuperAdmin} OR (s.is_active = true AND s.status = 'approved'))
        AND (${category}::text IS NULL OR s.category = ${category})
        AND (${district}::text IS NULL OR s.district = ${district})
        AND (
          ${q}::text IS NULL
          OR s.name ILIKE ${q ? `%${q}%` : null}
          OR s.description ILIKE ${q ? `%${q}%` : null}
          OR s.address ILIKE ${q ? `%${q}%` : null}
        )
      ORDER BY s.name
    `;
    return NextResponse.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Үйлчилгээний газрын жагсаалтыг татахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}

// Create new shop (super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role?: string }).role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Зөвшөөрөлгүй хандалт" },
        { status: 403 }
      );
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
    } = body;

    const result = await sql`
      INSERT INTO shops (name, description, address, phone, icon, category, district, photos, opening_time, closing_time, slot_duration, max_capacity)
      VALUES (${name}, ${description || ""}, ${address || ""}, ${phone || ""}, ${icon || null}, ${category || null}, ${district || null}, ${Array.isArray(photos) ? photos : []}, ${opening_time || "09:00"}, ${closing_time || "18:00"}, ${slot_duration || 30}, ${max_capacity || 1})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json(
      { error: "Үйлчилгээний газар үүсгэхэд алдаа гарлаа" },
      { status: 500 }
    );
  }
}
