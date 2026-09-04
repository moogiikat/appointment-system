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

// 写真はプレースホルダ。seed 文字列で固定なので毎回同じ画像が返る
function photos(slug: string): string[] {
  return [
    `https://picsum.photos/seed/${slug}-1/640/480`,
    `https://picsum.photos/seed/${slug}-2/640/480`,
    `https://picsum.photos/seed/${slug}-3/640/480`,
  ];
}

interface SeedService {
  name: string;
  price: number;
  duration_minutes: number;
}

interface SeedReview {
  rating: number;
  comment: string;
  reply?: string;
}

interface SeedCoupon {
  title: string;
  description: string;
  points_cost: number;
}

interface SeedShop {
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  district: string;
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  max_capacity: number;
  points_per_visit: number;
  services: SeedService[];
  coupons: SeedCoupon[];
  reviews: SeedReview[];
}

/*
 * category は lib/constants.ts の SUGGESTED_CATEGORIES と、
 * district は LOCATIONS と完全一致させること。
 * 一致しないとトップのジャンル絞り込みと色分けから外れる。
 * 価格は ₮（төгрөг）。
 */
const SHOPS: SeedShop[] = [
  {
    slug: 'jargal',
    name: 'ЖАРГАЛ УЛАМЖЛАЛТ БАРИА ЗАСАЛ',
    description:
      'Монголын уламжлалт анагаах ухаанд тулгуурлан яс, булчин, шөрмөсний тэнцвэрийг сэргээнэ.\nӨвчнийг түр дарах бус, үндсэн шалтгааныг оношлон засах зарчмыг баримталдаг.',
    address: 'УБ, Баянзүрх дүүрэг, 6-р хороо, 13-р хороолол',
    phone: '99118844',
    category: 'Массаж, спа',
    district: 'Баянзүрх',
    opening_time: '09:00',
    closing_time: '20:00',
    slot_duration: 60,
    max_capacity: 3,
    points_per_visit: 100,
    services: [
      { name: 'Бүтэн биеийн бариа засал', price: 80000, duration_minutes: 60 },
      { name: 'Нуруу, хүзүүний засал', price: 55000, duration_minutes: 45 },
      { name: 'Хөлний цэгийн массаж', price: 40000, duration_minutes: 30 },
      { name: 'Банк, хануур', price: 45000, duration_minutes: 30 },
    ],
    coupons: [
      { title: '10% хөнгөлөлт', description: 'Дараагийн бариа засалд', points_cost: 300 },
      { title: 'Хөлний массаж үнэгүй', description: '30 минутын үйлчилгээ', points_cost: 500 },
    ],
    reviews: [
      { rating: 5, comment: 'Нуруу маань үнэхээр хөнгөрлөө. Эмч маш мэргэжлийн.', reply: 'Баярлалаа! Дахин хүлээж байна.' },
      { rating: 5, comment: 'Тайван орчин, цэвэрхэн. Цагтаа оруулсан.' },
      { rating: 4, comment: 'Сайн үйлчилгээ. Гэхдээ жаахан хүлээсэн.' },
      { rating: 5, comment: 'Хүзүү мөрний зовиур эрс буурсан.' },
    ],
  },
  {
    slug: 'altan-odod',
    name: 'Гоо сайхны салон "Алтан одод"',
    description: 'Үсчин, гоо сайхны бүх төрлийн үйлчилгээ. Туршлагатай мастерууд.',
    address: 'УБ, Сүхбаатар дүүрэг, 1-р хороо, Их дэлгүүрийн ард',
    phone: '99112233',
    category: 'Гоо сайхны газар',
    district: 'Сүхбаатар',
    opening_time: '09:00',
    closing_time: '19:00',
    slot_duration: 30,
    max_capacity: 3,
    points_per_visit: 80,
    services: [
      { name: 'Үс засалт (эмэгтэй)', price: 35000, duration_minutes: 60 },
      { name: 'Үс будалт', price: 120000, duration_minutes: 120 },
      { name: 'Хумсны засал', price: 45000, duration_minutes: 60 },
      { name: 'Нүүрний арчилгаа', price: 90000, duration_minutes: 90 },
    ],
    coupons: [{ title: 'Хумсны засал 20% хямд', description: 'Ажлын өдрүүдэд', points_cost: 400 }],
    reviews: [
      { rating: 5, comment: 'Будалт маш сайхан болсон. Талархаж байна.' },
      { rating: 4, comment: 'Үнэ чанарын харьцаа сайн.' },
      { rating: 5, comment: 'Мастер маань үнэхээр анхаарал тавьдаг.' },
    ],
  },
  {
    slug: 'tsagaan-suvd',
    name: '"Цагаан сувд" шүдний эмнэлэг',
    description: 'Шүдний эмчилгээ, цэвэрлэгээ, гоо сайхны шүдний үйлчилгээ. Орчин үеийн тоног төхөөрөмж.',
    address: 'УБ, Хан-Уул дүүрэг, 3-р хороо, Зайсангийн гүүрний зүүн талд',
    phone: '88551199',
    category: 'Шүдний эмнэлэг',
    district: 'Хан-Уул',
    opening_time: '09:00',
    closing_time: '18:00',
    slot_duration: 45,
    max_capacity: 2,
    points_per_visit: 150,
    services: [
      { name: 'Шүдний үзлэг', price: 20000, duration_minutes: 30 },
      { name: 'Шүдний цэвэрлэгээ', price: 90000, duration_minutes: 45 },
      { name: 'Ломбо тавих', price: 75000, duration_minutes: 60 },
      { name: 'Шүд цайруулах', price: 250000, duration_minutes: 90 },
    ],
    coupons: [{ title: 'Үзлэг үнэгүй', description: 'Анхны ирэлтэд', points_cost: 600 }],
    reviews: [
      { rating: 5, comment: 'Огт өвдөөгүй. Эмч тайлбар сайтай.', reply: 'Танд баярлалаа!' },
      { rating: 4, comment: 'Цэвэрхэн эмнэлэг. Цаг товлолт хялбар.' },
      { rating: 5, comment: 'Хүүхдээ авчирсан, маш тэвчээртэй хандсан.' },
      { rating: 3, comment: 'Үйлчилгээ сайн ч үнэ өндөр санагдсан.' },
    ],
  },
  {
    slug: 'mongon-haich',
    name: '"Мөнгөн хайч" үсчин',
    description: 'Эрэгтэй, хүүхдийн үс засалт. Хурдан, нямбай.',
    address: 'УБ, Баянгол дүүрэг, 10-р хороо, 3-р хороолол',
    phone: '95447722',
    category: 'Үс засалт',
    district: 'Баянгол',
    opening_time: '10:00',
    closing_time: '20:00',
    slot_duration: 30,
    max_capacity: 2,
    points_per_visit: 50,
    services: [
      { name: 'Эрэгтэй үс засалт', price: 25000, duration_minutes: 30 },
      { name: 'Хүүхдийн үс засалт', price: 18000, duration_minutes: 30 },
      { name: 'Сахал засалт', price: 15000, duration_minutes: 20 },
    ],
    coupons: [{ title: '5 дахь засалт үнэгүй', description: 'Тогтмол үйлчлүүлэгчдэд', points_cost: 250 }],
    reviews: [
      { rating: 5, comment: 'Хурдан бөгөөд нямбай. Үргэлж энд ирдэг.' },
      { rating: 4, comment: 'Үнэ хямд, чанар сайн.' },
    ],
  },
  {
    slug: 'eruul-mend',
    name: 'Эмнэлэг "Эрүүл мэнд"',
    description: 'Ерөнхий шинжилгээ, эмчийн үзлэг, лабораторийн үйлчилгээ.',
    address: 'УБ, Чингэлтэй дүүрэг, 3-р хороо, Сансарын тойрог',
    phone: '77334455',
    category: 'Эмнэлэг',
    district: 'Чингэлтэй',
    opening_time: '08:00',
    closing_time: '17:00',
    slot_duration: 20,
    max_capacity: 5,
    points_per_visit: 120,
    services: [
      { name: 'Эмчийн үзлэг', price: 30000, duration_minutes: 20 },
      { name: 'Цусны ерөнхий шинжилгээ', price: 45000, duration_minutes: 20 },
      { name: 'Хэт авиан оношилгоо', price: 60000, duration_minutes: 30 },
    ],
    coupons: [{ title: 'Шинжилгээ 15% хямд', description: 'Багц шинжилгээнд', points_cost: 500 }],
    reviews: [
      { rating: 4, comment: 'Дараалал багатай, хурдан үйлчилсэн.' },
      { rating: 5, comment: 'Эмч нар үнэхээр анхааралтай.' },
      { rating: 4, comment: 'Хариу хурдан гарсан.' },
    ],
  },
  {
    slug: 'huleg-fitness',
    name: '"Хүлэг" фитнес клуб',
    description: 'Дасгалын танхим, бүлгийн хичээл, хувийн дасгалжуулагч.',
    address: 'УБ, Сонгинохайрхан дүүрэг, 20-р хороо, Тоосгоны уулзвар',
    phone: '94112200',
    category: 'Фитнес, спорт заал',
    district: 'Сонгинохайрхан',
    opening_time: '06:00',
    closing_time: '22:00',
    slot_duration: 60,
    max_capacity: 10,
    points_per_visit: 60,
    services: [
      { name: 'Өдрийн эрх', price: 15000, duration_minutes: 120 },
      { name: 'Хувийн дасгалжуулагчтай хичээл', price: 55000, duration_minutes: 60 },
      { name: 'Йогийн бүлгийн хичээл', price: 20000, duration_minutes: 60 },
    ],
    coupons: [{ title: '7 хоногийн эрх', description: 'Шинэ гишүүдэд', points_cost: 700 }],
    reviews: [
      { rating: 5, comment: 'Тоног төхөөрөмж шинэ, орчин цэвэрхэн.' },
      { rating: 3, comment: 'Оройдоо хүн их байдаг.' },
      { rating: 4, comment: 'Дасгалжуулагч нар мэргэжлийн.' },
    ],
  },
  {
    slug: 'ih-mongol',
    name: '"Их Монгол" ресторан',
    description: 'Монгол үндэсний хоол, тансаг зэрэглэлийн үйлчилгээ. Ширээ урьдчилан захиалах боломжтой.',
    address: 'УБ, Сүхбаатар дүүрэг, 8-р хороо, Сүхбаатарын талбайн баруун талд',
    phone: '70112255',
    category: 'Рестораны',
    district: 'Сүхбаатар',
    opening_time: '11:00',
    closing_time: '23:00',
    slot_duration: 90,
    max_capacity: 8,
    points_per_visit: 90,
    services: [
      { name: '2 хүний ширээ', price: 0, duration_minutes: 90 },
      { name: '4 хүний ширээ', price: 0, duration_minutes: 90 },
      { name: 'Тусгай өрөө (8 хүн)', price: 50000, duration_minutes: 120 },
    ],
    coupons: [{ title: 'Амтат зууш дагалдана', description: 'Ширээ захиалахад', points_cost: 350 }],
    reviews: [
      { rating: 5, comment: 'Хоол маш амттай, үйлчилгээ түргэн.', reply: 'Танд баярлалаа, дахин хүлээж байна.' },
      { rating: 4, comment: 'Байршил тохиромжтой.' },
      { rating: 5, comment: 'Гэр бүлээрээ очиход тухтай.' },
    ],
  },
  {
    slug: 'nomin-beauty',
    name: '"Номин" гоо сайхны төв',
    description: 'Нүүр, биеийн арчилгаа, лазер эмчилгээ, хөмсөг сормуусны үйлчилгээ.',
    address: 'УБ, Хан-Уул дүүрэг, 15-р хороо, Наран плаза',
    phone: '80223311',
    category: 'Гоо сайхны газар',
    district: 'Хан-Уул',
    opening_time: '10:00',
    closing_time: '20:00',
    slot_duration: 60,
    max_capacity: 4,
    points_per_visit: 110,
    services: [
      { name: 'Нүүрний гүн цэвэрлэгээ', price: 110000, duration_minutes: 90 },
      { name: 'Сормуус наалт', price: 80000, duration_minutes: 90 },
      { name: 'Хөмсөг засалт', price: 35000, duration_minutes: 30 },
      { name: 'Лазер эмчилгээ', price: 180000, duration_minutes: 60 },
    ],
    coupons: [{ title: 'Хөмсөг засалт үнэгүй', description: 'Нүүрний арчилгаа авахад', points_cost: 450 }],
    reviews: [
      { rating: 5, comment: 'Арьс маань үнэхээр сайжирсан.' },
      { rating: 4, comment: 'Цаг товлолт уян хатан.' },
    ],
  },
  {
    slug: 'hurd-auto',
    name: 'Авто засварын газар "Хурд"',
    description: 'Автомашины бүх төрлийн засвар үйлчилгээ, оношилгоо.',
    address: 'УБ, Баянзүрх дүүрэг, 5-р хороо, Автозамын гүүрний хойд талд',
    phone: '88001122',
    category: 'Авто засвар',
    district: 'Баянзүрх',
    opening_time: '08:00',
    closing_time: '18:00',
    slot_duration: 60,
    max_capacity: 2,
    points_per_visit: 200,
    services: [
      { name: 'Компьютер оношилгоо', price: 35000, duration_minutes: 60 },
      { name: 'Тос солих', price: 45000, duration_minutes: 45 },
      { name: 'Дугуй солих, тэнцвэржүүлэх', price: 30000, duration_minutes: 60 },
      { name: 'Тоормосны засвар', price: 120000, duration_minutes: 120 },
    ],
    coupons: [{ title: 'Оношилгоо үнэгүй', description: 'Засвар хийлгэхэд', points_cost: 600 }],
    reviews: [
      { rating: 4, comment: 'Ажил чанартай, тайлбар сайтай.' },
      { rating: 5, comment: 'Амласан хугацаандаа дуусгасан.' },
      { rating: 3, comment: 'Хүлээлгэх хэсэг нь жаахан бага.' },
    ],
  },
  {
    slug: 'dursamj-studio',
    name: '"Дурсамж" гэрэл зургийн студи',
    description: 'Хөрөг, гэр бүлийн болон хүүхдийн гэрэл зураг. Студи болон гадна зураг.',
    address: 'УБ, Чингэлтэй дүүрэг, 4-р хороо, Бага тойруу',
    phone: '99667788',
    category: 'Бусад',
    district: 'Чингэлтэй',
    opening_time: '10:00',
    closing_time: '19:00',
    slot_duration: 60,
    max_capacity: 1,
    points_per_visit: 130,
    services: [
      { name: 'Хөрөг зураг (студи)', price: 90000, duration_minutes: 60 },
      { name: 'Гэр бүлийн зураг', price: 150000, duration_minutes: 90 },
      { name: 'Хүүхдийн зураг', price: 120000, duration_minutes: 60 },
    ],
    coupons: [{ title: '10 хэвлэмэл зураг', description: 'Багц захиалгад', points_cost: 400 }],
    reviews: [
      { rating: 5, comment: 'Зурагнууд үнэхээр гоё гарсан.' },
      { rating: 5, comment: 'Хүүхдэд тайван ханддаг.' },
      { rating: 4, comment: 'Хүлээлгэх хугацаа бага зэрэг урт.' },
    ],
  },
];

const CUSTOMERS = [
  { name: 'Болормаа Б.', email: 'bolormaa@example.com', phone: '99001122' },
  { name: 'Ганбат Д.', email: 'ganbat@example.com', phone: '99112244' },
  { name: 'Оюунчимэг С.', email: 'oyunchimeg@example.com', phone: '99223355' },
  { name: 'Тэмүүлэн Э.', email: 'temuulen@example.com', phone: '99334466' },
  { name: 'Сарангэрэл Н.', email: 'sarangerel@example.com', phone: '99445577' },
  { name: 'Батбаяр Т.', email: 'batbayar@example.com', phone: '99556688' },
];

export async function GET() {
  try {
    // --- 顧客（口コミの投稿者として使う）---
    const customerIds: number[] = [];
    for (const c of CUSTOMERS) {
      const existing = await sql`SELECT id FROM users WHERE email = ${c.email}`;
      if (existing.length > 0) {
        customerIds.push(existing[0].id);
      } else {
        const created = await sql`
          INSERT INTO users (name, email, phone, role)
          VALUES (${c.name}, ${c.email}, ${c.phone}, 'customer')
          RETURNING id
        `;
        customerIds.push(created[0].id);
      }
    }

    // --- 店舗と、それにぶら下がるメニュー・クーポン・口コミ ---
    // shops.name には一意制約がないので、名前で存在確認してから入れる（再実行しても増えない）
    const inserted: { id: number; name: string; category: string }[] = [];

    for (const shop of SHOPS) {
      const existing = await sql`SELECT id FROM shops WHERE name = ${shop.name}`;
      let shopId: number;

      if (existing.length > 0) {
        shopId = existing[0].id;
        // 既存店舗は「空いている項目だけ」埋める。
        // 実店舗が自分で入れた説明文・住所・電話を seed で上書きしないため。
        await sql`
          UPDATE shops SET
            description = CASE WHEN COALESCE(description, '') = '' THEN ${shop.description} ELSE description END,
            address     = CASE WHEN COALESCE(address, '')     = '' THEN ${shop.address}     ELSE address END,
            phone       = CASE WHEN COALESCE(phone, '')       = '' THEN ${shop.phone}       ELSE phone END,
            category    = COALESCE(category, ${shop.category}),
            district    = COALESCE(district, ${shop.district}),
            photos      = CASE WHEN COALESCE(cardinality(photos), 0) = 0 THEN ${photos(shop.slug)} ELSE photos END,
            points_per_visit = CASE WHEN COALESCE(points_per_visit, 0) = 0 THEN ${shop.points_per_visit} ELSE points_per_visit END,
            is_active = true
          WHERE id = ${shopId}
        `;
      } else {
        const created = await sql`
          INSERT INTO shops (
            name, description, address, phone, category, district, photos,
            opening_time, closing_time, slot_duration, max_capacity, points_per_visit
          )
          VALUES (
            ${shop.name}, ${shop.description}, ${shop.address}, ${shop.phone},
            ${shop.category}, ${shop.district}, ${photos(shop.slug)},
            ${shop.opening_time}, ${shop.closing_time}, ${shop.slot_duration},
            ${shop.max_capacity}, ${shop.points_per_visit}
          )
          RETURNING id
        `;
        shopId = created[0].id;
      }

      inserted.push({ id: shopId, name: shop.name, category: shop.category });

      const hasServices = await sql`SELECT 1 FROM shop_services WHERE shop_id = ${shopId} LIMIT 1`;
      if (hasServices.length === 0) {
        for (const s of shop.services) {
          await sql`
            INSERT INTO shop_services (shop_id, name, price, duration_minutes)
            VALUES (${shopId}, ${s.name}, ${s.price}, ${s.duration_minutes})
          `;
        }
      }

      const hasCoupons = await sql`SELECT 1 FROM shop_coupons WHERE shop_id = ${shopId} LIMIT 1`;
      if (hasCoupons.length === 0) {
        for (const c of shop.coupons) {
          await sql`
            INSERT INTO shop_coupons (shop_id, title, description, points_cost, max_claims)
            VALUES (${shopId}, ${c.title}, ${c.description}, ${c.points_cost}, 50)
          `;
        }
      }

      // 評点はレビューの平均で出しているので、星を出すにはレビューが要る
      const hasReviews = await sql`SELECT 1 FROM reviews WHERE shop_id = ${shopId} LIMIT 1`;
      if (hasReviews.length === 0) {
        for (let i = 0; i < shop.reviews.length; i++) {
          const r = shop.reviews[i];
          const userId = customerIds[i % customerIds.length];
          await sql`
            INSERT INTO reviews (shop_id, user_id, rating, comment, shop_reply, shop_reply_at)
            VALUES (
              ${shopId}, ${userId}, ${r.rating}, ${r.comment},
              ${r.reply ?? null}, ${r.reply ? new Date().toISOString() : null}
            )
          `;
        }
      }
    }

    // --- 管理者アカウント ---
    const superAdminPassword = generatePassword();
    const shopAdminPassword = generatePassword();
    const saltRounds = 10;
    const hashedSuper = await bcrypt.hash(superAdminPassword, saltRounds);
    const hashedShop = await bcrypt.hash(shopAdminPassword, saltRounds);

    const existingSuper = await sql`SELECT id FROM users WHERE email = 'admin@example.com'`;
    if (existingSuper.length > 0) {
      await sql`UPDATE users SET password = ${hashedSuper} WHERE email = 'admin@example.com'`;
    } else {
      await sql`
        INSERT INTO users (name, email, phone, role, password)
        VALUES ('Систем Админ', 'admin@example.com', '99999999', 'super_admin', ${hashedSuper})
      `;
    }

    // 店舗管理者は最初の店舗（ЖАРГАЛ）に紐づける
    const firstShopId = inserted[0]?.id ?? null;
    const existingShopAdmin = await sql`SELECT id FROM users WHERE email = 'shop@example.com'`;
    if (existingShopAdmin.length > 0) {
      await sql`
        UPDATE users SET password = ${hashedShop}, shop_id = ${firstShopId}
        WHERE email = 'shop@example.com'
      `;
    } else {
      await sql`
        INSERT INTO users (name, email, phone, role, shop_id, password)
        VALUES ('ЖАРГАЛ Менежер', 'shop@example.com', '99118844', 'shop_admin', ${firstShopId}, ${hashedShop})
      `;
    }

    return NextResponse.json({
      message: `${inserted.length} үйлчилгээний газрын түүвэр мэдээлэл бэлэн боллоо`,
      shops: inserted,
      counts: {
        shops: inserted.length,
        services: SHOPS.reduce((n, s) => n + s.services.length, 0),
        reviews: SHOPS.reduce((n, s) => n + s.reviews.length, 0),
        coupons: SHOPS.reduce((n, s) => n + s.coupons.length, 0),
        customers: CUSTOMERS.length,
      },
      loginInfo: {
        warning: '⚠️ Эдгээр нууц үгийг хадгалж аваарай! Дахин харагдахгүй.',
        superAdmin: {
          email: 'admin@example.com',
          password: superAdminPassword,
          role: 'Системийн админ - бүх үйлчилгээний газрыг удирдах',
        },
        shopAdmin: {
          email: 'shop@example.com',
          password: shopAdminPassword,
          role: 'Үйлчилгээний газрын админ - "ЖАРГАЛ УЛАМЖЛАЛТ БАРИА ЗАСАЛ"',
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
