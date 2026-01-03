import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

// Generate a random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

    // Generate passwords for each admin
    const superAdminPassword = generatePassword();
    const shopAdmin1Password = generatePassword();
    const shopAdmin2Password = generatePassword();

    // Hash passwords
    const saltRounds = 10;
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, saltRounds);
    const hashedShopAdmin1Password = await bcrypt.hash(shopAdmin1Password, saltRounds);
    const hashedShopAdmin2Password = await bcrypt.hash(shopAdmin2Password, saltRounds);

    // Check if users exist and update/insert accordingly
    const existingSuperAdmin = await sql`SELECT id FROM users WHERE email = 'admin@example.com'`;
    let superAdmin;
    if (existingSuperAdmin.length > 0) {
      superAdmin = await sql`
        UPDATE users SET password = ${hashedSuperAdminPassword} 
        WHERE email = 'admin@example.com'
        RETURNING id, name, email, role
      `;
    } else {
      superAdmin = await sql`
        INSERT INTO users (name, email, phone, role, shop_id, password)
        VALUES (
          'Систем Админ',
          'admin@example.com',
          '99999999',
          'super_admin',
          NULL,
          ${hashedSuperAdminPassword}
        )
        RETURNING id, name, email, role
      `;
    }

    const existingShopAdmin1 = await sql`SELECT id FROM users WHERE email = 'salon@example.com'`;
    let shopAdmin1;
    if (existingShopAdmin1.length > 0) {
      shopAdmin1 = await sql`
        UPDATE users SET password = ${hashedShopAdmin1Password}, shop_id = ${shopId1}
        WHERE email = 'salon@example.com'
        RETURNING id, name, email, role
      `;
    } else {
      shopAdmin1 = await sql`
        INSERT INTO users (name, email, phone, role, shop_id, password)
        VALUES (
          'Алтан одод Менежер',
          'salon@example.com',
          '99112233',
          'shop_admin',
          ${shopId1},
          ${hashedShopAdmin1Password}
        )
        RETURNING id, name, email, role
      `;
    }

    const existingShopAdmin2 = await sql`SELECT id FROM users WHERE email = 'auto@example.com'`;
    let shopAdmin2;
    if (existingShopAdmin2.length > 0) {
      shopAdmin2 = await sql`
        UPDATE users SET password = ${hashedShopAdmin2Password}, shop_id = ${shopId2}
        WHERE email = 'auto@example.com'
        RETURNING id, name, email, role
      `;
    } else {
      shopAdmin2 = await sql`
        INSERT INTO users (name, email, phone, role, shop_id, password)
        VALUES (
          'Хурд Менежер',
          'auto@example.com',
          '88001122',
          'shop_admin',
          ${shopId2},
          ${hashedShopAdmin2Password}
        )
        RETURNING id, name, email, role
      `;
    }

    return NextResponse.json({
      message: 'Түүвэр мэдээлэл амжилттай нэмэгдлээ',
      data: {
        shops: [shop1[0], shop2[0], shop3[0]],
        superAdmin: superAdmin[0],
        shopAdmins: [shopAdmin1[0], shopAdmin2[0]],
      },
      loginInfo: {
        warning: '⚠️ Эдгээр нууц үгийг хадгалж аваарай! Дахин харагдахгүй.',
        superAdmin: {
          email: 'admin@example.com',
          password: superAdminPassword,
          role: 'Систем админ - бүх үйлчилгээний газрыг удирдах',
        },
        shopAdmin1: {
          email: 'salon@example.com',
          password: shopAdmin1Password,
          role: 'Үйлчилгээний газрын админ - "Алтан одод" салон',
        },
        shopAdmin2: {
          email: 'auto@example.com',
          password: shopAdmin2Password,
          role: 'Үйлчилгээний газрын админ - "Хурд" авто засвар',
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
