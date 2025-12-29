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

// Reset user password (super admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Check if user exists and is an admin
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId} AND role IN ('shop_admin', 'super_admin')
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Админ хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    const user = users[0];

    // Generate new password
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await sql`
      UPDATE users SET password = ${hashedPassword} WHERE id = ${userId}
    `;

    return NextResponse.json({
      message: 'Нууц үг амжилттай шинэчлэгдлээ',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      newPassword: newPassword,
      warning: '⚠️ Энэ нууц үгийг хадгалж аваарай! Дахин харагдахгүй.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Нууц үг шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

