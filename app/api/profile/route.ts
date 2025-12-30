import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get current user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 });
    }

    const userId = (session.user as { id?: number }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    const users = await sql`
      SELECT id, name, email, phone, avatar, role, created_at 
      FROM users 
      WHERE id = ${userId}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Профайл татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

// Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 });
    }

    const userId = (session.user as { id?: number }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    const body = await request.json();
    const { name, phone, avatar } = body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Нэр оруулна уу' },
        { status: 400 }
      );
    }

    // Update user profile
    const result = await sql`
      UPDATE users 
      SET 
        name = ${name.trim()},
        phone = ${phone || null},
        avatar = ${avatar || null}
      WHERE id = ${userId}
      RETURNING id, name, email, phone, avatar, role, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Профайл шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

