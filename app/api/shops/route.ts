import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { auth } from "@/auth";

// Get all shops
export async function GET() {
  try {
    const shops = await sql`
      SELECT * FROM shops WHERE is_active = true ORDER BY name
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
      opening_time,
      closing_time,
      slot_duration,
      max_capacity,
    } = body;

    const result = await sql`
      INSERT INTO shops (name, description, address, phone, icon, opening_time, closing_time, slot_duration, max_capacity)
      VALUES (${name}, ${description || ""}, ${address || ""}, ${phone || ""}, ${icon || null}, ${opening_time || "09:00"}, ${closing_time || "18:00"}, ${slot_duration || 30}, ${max_capacity || 1})
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
