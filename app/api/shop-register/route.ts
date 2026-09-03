import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { UB_DISTRICTS, SUGGESTED_CATEGORIES } from '@/lib/constants';
import { isValidMongoliaPhone } from '@/lib/utils';

const MIN_PASSWORD_LENGTH = 8;

/*
 * 店舗の自己登録（公開エンドポイント・ログイン不要）。
 *
 * 審査を挟む理由：ここで作った店舗をそのまま公開すると、誰でも歯科や
 * クリニックを名乗る一覧を出せてしまう。status='pending' で作り、
 * super_admin が承認するまで顧客側の一覧（/api/shops）には出さない。
 *
 * 受け取るフィールドは下で明示的に取り出したものだけ。role と status は
 * 固定値で、リクエスト本文からは一切拾わない。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ownerName = String(body.owner_name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const ownerPhone = String(body.owner_phone ?? '').trim();
    const shopName = String(body.shop_name ?? '').trim();
    const category = String(body.category ?? '').trim();
    const district = String(body.district ?? '').trim();
    const address = String(body.address ?? '').trim();
    const shopPhone = String(body.shop_phone ?? '').trim();

    if (!ownerName || !email || !password || !shopName) {
      return NextResponse.json(
        { error: 'Нэр, и-мэйл, нууц үг, газрын нэр шаардлагатай' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'И-мэйл хаяг буруу байна' }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Нууц үг дор хаяж ${MIN_PASSWORD_LENGTH} тэмдэгт байх ёстой` },
        { status: 400 }
      );
    }

    if (ownerPhone && !isValidMongoliaPhone(ownerPhone)) {
      return NextResponse.json(
        { error: 'Утасны дугаар буруу байна (8 оронтой, 8 эсвэл 9-өөр эхэлнэ)' },
        { status: 400 }
      );
    }

    // 選択肢は固定リストからのみ。自由入力を許すと検索の絞り込みから漏れる
    if (category && !(SUGGESTED_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Ангилал буруу байна' }, { status: 400 });
    }
    if (district && !(UB_DISTRICTS as readonly string[]).includes(district)) {
      return NextResponse.json({ error: 'Дүүрэг буруу байна' }, { status: 400 });
    }

    /*
     * メールの重複は role を問わず弾く。顧客として同じアドレスが既にあると、
     * Google ログイン時の突き合わせ（auth.ts の email 一致で google_id を更新）が
     * 複数行に当たって壊れるため。
     */
    const existing = await sql`
      SELECT 1 FROM users WHERE lower(email) = ${email} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Энэ и-мэйл хаяг бүртгэлтэй байна' },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    // 審査待ちなので is_active も false。承認時に両方立てる
    const shopRows = await sql`
      INSERT INTO shops (name, address, phone, category, district, status, is_active)
      VALUES (
        ${shopName}, ${address || ''}, ${shopPhone || ''},
        ${category || null}, ${district || null}, 'pending', false
      )
      RETURNING id, name
    `;
    const shop = shopRows[0];

    try {
      const userRows = await sql`
        INSERT INTO users (name, email, phone, role, shop_id, password)
        VALUES (${ownerName}, ${email}, ${ownerPhone || null}, 'shop_admin', ${shop.id}, ${hashed})
        RETURNING id, name, email, role, shop_id
      `;

      return NextResponse.json(
        {
          message: 'Бүртгэл амжилттай. Админ шалгасны дараа нээгдэнэ.',
          shop: { id: shop.id, name: shop.name, status: 'pending' },
          user: userRows[0],
        },
        { status: 201 }
      );
    } catch (userError) {
      // ユーザー作成に失敗したら、店舗だけが残らないよう巻き戻す
      await sql`DELETE FROM shops WHERE id = ${shop.id}`;
      throw userError;
    }
  } catch (error) {
    console.error('Shop registration error:', error);
    return NextResponse.json(
      { error: 'Бүртгэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}
