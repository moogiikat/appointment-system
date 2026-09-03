import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import sql from '@/lib/db';
import { auth } from '@/auth';

function generateCode() {
  return randomBytes(5).toString('hex').toUpperCase();
}

// Claim a coupon by spending points (no real payment involved)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }
    const userId = (session.user as { id?: number }).id;
    const { couponId } = await params;

    const coupons = await sql`SELECT * FROM shop_coupons WHERE id = ${couponId}`;
    if (coupons.length === 0) {
      return NextResponse.json({ error: 'Купон олдсонгүй' }, { status: 404 });
    }
    const coupon = coupons[0];

    if (!coupon.is_active) {
      return NextResponse.json({ error: 'Энэ купон идэвхгүй байна' }, { status: 400 });
    }
    if (coupon.max_claims !== null && coupon.claimed_count >= coupon.max_claims) {
      return NextResponse.json({ error: 'Купон дууссан байна' }, { status: 400 });
    }

    const balanceRows = await sql`
      SELECT COALESCE(SUM(amount), 0) AS balance FROM point_transactions WHERE user_id = ${userId}
    `;
    const balance = Number(balanceRows[0].balance);

    if (balance < coupon.points_cost) {
      return NextResponse.json(
        { error: `Оноо хүрэлцэхгүй байна (шаардлагатай: ${coupon.points_cost}, танд: ${balance})` },
        { status: 400 }
      );
    }

    let code = generateCode();
    let userCoupon;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const result = await sql`
          INSERT INTO user_coupons (user_id, coupon_id, shop_id, code, points_spent)
          VALUES (${userId}, ${coupon.id}, ${coupon.shop_id}, ${code}, ${coupon.points_cost})
          RETURNING *
        `;
        userCoupon = result[0];
        break;
      } catch {
        code = generateCode();
      }
    }

    if (!userCoupon) {
      return NextResponse.json({ error: 'Купон авахад алдаа гарлаа' }, { status: 500 });
    }

    if (coupon.points_cost > 0) {
      await sql`
        INSERT INTO point_transactions (user_id, shop_id, amount, reason, description)
        VALUES (${userId}, ${coupon.shop_id}, ${-coupon.points_cost}, 'coupon_redeem', ${`Купон авсан: ${coupon.title}`})
      `;
    }

    await sql`UPDATE shop_coupons SET claimed_count = claimed_count + 1 WHERE id = ${coupon.id}`;

    return NextResponse.json(userCoupon, { status: 201 });
  } catch (error) {
    console.error('Error claiming coupon:', error);
    return NextResponse.json(
      { error: 'Купон авахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}
