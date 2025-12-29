import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }

    const userId = (session.user as { id?: number }).id;
    const userRole = (session.user as { role?: string }).role;

    // Only admins can change password
    if (userRole !== 'shop_admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Одоогийн болон шинэ нууц үг шаардлагатай' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Шинэ нууц үг дор хаяж 8 тэмдэгт байх ёстой' },
        { status: 400 }
      );
    }

    // Get current user with password
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    const user = users[0];

    // Verify current password
    if (!user.password) {
      return NextResponse.json({ error: 'Нууц үг тохируулагдаагүй байна' }, { status: 400 });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Одоогийн нууц үг буруу байна' }, { status: 400 });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE users SET password = ${hashedNewPassword} WHERE id = ${userId}
    `;

    return NextResponse.json({ message: 'Нууц үг амжилттай солигдлоо' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Нууц үг солиход алдаа гарлаа' },
      { status: 500 }
    );
  }
}

