import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Create sample shops
    const shop1 = await sql`
      INSERT INTO shops (name, description, address, phone, opening_time, closing_time, slot_duration, max_capacity)
      VALUES (
        'Гоо сайхны салон "Алтан одод"',
        'Үсчин, гоо сайхны бүх төрлийн үйлчилгээ',
        'УБ, Сүхбаатар дүүрэг, 1-р хороо',
        '99112233',
        '09:00',
        '19:00',
        30,
        3
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    const shop2 = await sql`
      INSERT INTO shops (name, description, address, phone, opening_time, closing_time, slot_duration, max_capacity)
      VALUES (
        'Авто засварын газар "Хурд"',
        'Автомашины бүх төрлийн засвар үйлчилгээ',
        'УБ, Баянзүрх дүүрэг, 5-р хороо',
        '88001122',
        '08:00',
        '18:00',
        60,
        2
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    const shop3 = await sql`
      INSERT INTO shops (name, description, address, phone, opening_time, closing_time, slot_duration, max_capacity)
      VALUES (
        'Эмнэлэг "Эрүүл мэнд"',
        'Ерөнхий шинжилгээ, эмчийн үзлэг',
        'УБ, Чингэлтэй дүүрэг, 3-р хороо',
        '77334455',
        '09:00',
        '17:00',
        20,
        5
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    // Get shop IDs
    const shops = await sql`SELECT id, name FROM shops LIMIT 3`;
    const shopId1 = shops[0]?.id;
    const shopId2 = shops[1]?.id;

    // Create Super Admin
    const superAdmin = await sql`
      INSERT INTO users (name, email, phone, role, shop_id)
      VALUES (
        'Систем Админ',
        'admin@example.com',
        '99999999',
        'super_admin',
        NULL
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    // Create Shop Admins
    const shopAdmin1 = await sql`
      INSERT INTO users (name, email, phone, role, shop_id)
      VALUES (
        'Алтан одод Менежер',
        'salon@example.com',
        '99112233',
        'shop_admin',
        ${shopId1}
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    const shopAdmin2 = await sql`
      INSERT INTO users (name, email, phone, role, shop_id)
      VALUES (
        'Хурд Менежер',
        'auto@example.com',
        '88001122',
        'shop_admin',
        ${shopId2}
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    return NextResponse.json({
      message: 'Түүвэр мэдээлэл амжилттай нэмэгдлээ',
      data: {
        shops: [shop1[0], shop2[0], shop3[0]],
        superAdmin: superAdmin[0],
        shopAdmins: [shopAdmin1[0], shopAdmin2[0]],
      },
      loginInfo: {
        superAdmin: {
          email: 'admin@example.com',
          password: 'ADMIN_PASSWORD орчны хувьсагчийн утга',
          role: 'Систем админ - бүх дэлгүүр удирдах',
        },
        shopAdmin1: {
          email: 'salon@example.com',
          password: 'ADMIN_PASSWORD орчны хувьсагчийн утга',
          role: 'Дэлгүүрийн админ - "Алтан одод" салон',
        },
        shopAdmin2: {
          email: 'auto@example.com',
          password: 'ADMIN_PASSWORD орчны хувьсагчийн утга',
          role: 'Дэлгүүрийн админ - "Хурд" авто засвар',
        },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Түүвэр мэдээлэл нэмэхэд алдаа гарлаа', details: String(error) },
      { status: 500 }
    );
  }
}

