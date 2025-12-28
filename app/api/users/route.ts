import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get all users (super admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const users = await sql`
      SELECT u.*, s.name as shop_name
      FROM users u
      LEFT JOIN shops s ON u.shop_id = s.id
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Хэрэглэгчдийг татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Create new admin user (super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, role, shop_id } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Нэр, и-мэйл, эрх шаардлагатай' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO users (name, email, phone, role, shop_id)
      VALUES (${name}, ${email}, ${phone || null}, ${role}, ${shop_id || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Хэрэглэгч үүсгэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

