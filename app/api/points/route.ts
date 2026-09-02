import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

// Get the current user's points balance and transaction history
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    const userId = (session.user as { id?: number }).id;

    const transactions = await sql`
      SELECT pt.*, s.name AS shop_name
      FROM point_transactions pt
      JOIN shops s ON pt.shop_id = s.id
      WHERE pt.user_id = ${userId}
      ORDER BY pt.created_at DESC
    `;

    const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return NextResponse.json({ balance, transactions });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Оноог татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
