import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/auth';

/*
 * 店舗の審査結果を決める唯一の入口。super_admin 専用。
 * 通常の PUT /api/shops/[id] では status も is_active も動かせないようにしてあるので、
 * 店舗が自分で自分を公開することはできない。
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? '');
    const reason = String(body.rejection_reason ?? '').trim();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Төлөв буруу байна' }, { status: 400 });
    }

    if (status === 'rejected' && !reason) {
      return NextResponse.json(
        { error: 'Татгалзсан шалтгааныг бичнэ үү' },
        { status: 400 }
      );
    }

    // 承認したときだけ顧客側に出す
    const result = await sql`
      UPDATE shops
      SET status = ${status},
          is_active = ${status === 'approved'},
          rejection_reason = ${status === 'rejected' ? reason : null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Үйлчилгээний газар олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating shop status:', error);
    return NextResponse.json(
      { error: 'Төлөв шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
