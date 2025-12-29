import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Generate a random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get all users (super admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const users = await sql`
      SELECT u.id, u.facebook_id, u.name, u.email, u.phone, u.role, u.shop_id, u.created_at, s.name as shop_name
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

    // Generate password for admin users
    let plainPassword: string | null = null;
    let hashedPassword: string | null = null;

    if (role === 'shop_admin' || role === 'super_admin') {
      plainPassword = generatePassword();
      hashedPassword = await bcrypt.hash(plainPassword, 10);
    }

    const result = await sql`
      INSERT INTO users (name, email, phone, role, shop_id, password)
      VALUES (${name}, ${email}, ${phone || null}, ${role}, ${shop_id || null}, ${hashedPassword})
      RETURNING id, name, email, phone, role, shop_id, created_at
    `;

    // Return user data with plain password (only shown once!)
    return NextResponse.json({
      user: result[0],
      password: plainPassword,
      warning: plainPassword ? '⚠️ Энэ нууц үгийг хадгалж аваарай! Дахин харагдахгүй.' : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Хэрэглэгч үүсгэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
