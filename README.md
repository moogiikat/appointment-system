# Цаг Захиалах Систем (Appointment Booking System)

Үйлчилгээний газрын цаг захиалах систем. Монгол хэлээр.

## Боломжууд

### Хэрэглэгчийн талаас
- ✅ Google-ээр нэвтрэх
- ✅ Ангилал, дүүрэг (УБ), түлхүүр үгээр хайх, шүүх (epark.jp маягийн хайлт)
- ✅ Үйлчилгээний газрын дэлгэрэнгүй (зургийн галерей, үнийн жагсаалт, байршлын газрын зураг, сэтгэгдэл)
- ✅ Дуртай газраа хадгалах (Хадгалсан жагсаалт)
- ✅ Дууссан захиалгад үнэлгээ, сэтгэгдэл үлдээх
- ✅ Захиалгаа дуусгах бүрт урамшууллын оноо хуримтлуулах
- ✅ Хуримтлуулсан оноогоороо купон авах, дэлгүүрт кодоор ашиглах
- ✅ Огноо, цаг сонгох
- ✅ Нэр, утас, и-мэйл оруулах
- ✅ Захиалга баталгаажуулах
- ✅ Өөрийн захиалгуудыг харах, цуцлах
- ✅ Захиалгын хүсэлт/баталгаажилт/цуцлал/дуусгалт бүрд мэйл мэдэгдэл авах

### Үйлчилгээний газрын админ талаас
- ✅ Захиалгуудыг огноогоор шүүх
- ✅ Захиалга баталгаажуулах/цуцлах/дуусгах
- ✅ Шинэ захиалга ирэхэд мэйлээр мэдэгдэл авах
- ✅ Үйлчилгээний газрын тохиргоо өөрчлөх (ангилал, дүүрэг, зураг, нээх/хаах цаг, нэг цагт авах хүний тоо)
- ✅ Үйлчилгээ, үнийн жагсаалт удирдах
- ✅ Хэрэглэгчийн сэтгэгдэлд хариу бичих
- ✅ Захиалга дуусахад олгох оноог тохируулах
- ✅ Купон үүсгэх, засах, идэвхгүй болгох
- ✅ Хэрэглэгчийн купоныг кодоор нь ашиглах (дэлгүүр дээр)

### Систем админ талаас
- ✅ Бүх Үйлчилгээний газрын жагсаалт
- ✅ Үйлчилгээний газар нэмэх, засах, устгах (ангилал, дүүрэг сонгох)
- ✅ Админ хэрэглэгч нэмэх
- ✅ Хэрэглэгчдийн жагсаалт

> Оноо, купон нь зөвхөн урамшууллын систем бөгөөд бодит мөнгөн гүйлгээ (онлайн эсвэл дансаар төлбөр тооцоо) хийгддэггүй. Хямдралыг дэлгүүрийн ажилтан газар дээр нь өөрөө хэрэгжүүлнэ. Бодит төлбөрийн систем нь дараагийн шатны ажил.

### Захиалгын хязгаарлалт
- ✅ Нэг цагт хязгаартай тооны хүн захиалах
- ✅ Ажлын цагийн дотор л захиалах

## Технологи

- **Frontend**: Next.js 16 (App Router)
- **Backend**: API Routes
- **Database**: Neon DB (PostgreSQL)
- **Authentication**: NextAuth.js (Facebook + Credentials)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Timezone**: Монгол цаг (UTC+8)

## Суулгах

### 1. Хамаарлуудыг суулгах

```bash
npm install
```

### 2. Орчны тохиргоо

`.env.local` файл үүсгэж, дараах утгуудыг нэмнэ:

```env
# Database - Neon DB
DATABASE_URL=postgresql://username:password@your-neon-host/your-database?sslmode=require

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Admin password (демо)
ADMIN_PASSWORD=your-admin-password

# Email (Resend) - заавал биш, тохируулаагүй бол мэйл илгээгдэхгүй, алдаа гарахгүй
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM="Цаг Захиалга <onboarding@resend.dev>"
```

### Мэйл мэдэгдэл (Resend)

Захиалга хийх/баталгаажих/цуцлагдах/дуусах үед хэрэглэгчид, шинэ захиалга орж ирэхэд үйлчилгээний газрын админд мэйл илгээдэг. Тохиргоо:

1. [resend.com](https://resend.com) дээр бүртгүүлж API түлхүүр авна (сар бүр 3,000 мэйл үнэгүй)
2. `RESEND_API_KEY`-г `.env.local`-д нэмнэ
3. Өөрийн домэйн баталгаажуулсан бол `EMAIL_FROM`-г шинэчилнэ, эсрэг тохиолдолд Resend-ийн `onboarding@resend.dev` илгээгчийг турших зорилгоор ашиглаж болно (зөвхөн бүртгэлтэй имэйл рүү илгээх боломжтой)
4. `RESEND_API_KEY` тохируулаагүй үед мэйл илгээгдэхгүй, консольд анхааруулга бичигдэх бөгөөд систем хэвийн ажиллана

### 3. Өгөгдлийн сан үүсгэх

Серверийг ажиллуулсны дараа `/api/init` руу хандаж өгөгдлийн сангийн хүснэгтүүдийг үүсгэнэ:

```bash
curl http://localhost:3000/api/init
```

### 4. Super Admin үүсгэх

Neon DB консол эсвэл SQL client ашиглан super admin хэрэглэгч үүсгэнэ:

```sql
INSERT INTO users (name, email, role)
VALUES ('Admin', 'admin@example.com', 'super_admin');
```

### 5. Сервер ажиллуулах

```bash
npm run dev
```

Хөтөч дээрээс [http://localhost:3000](http://localhost:3000) хаягаар орно.

## Facebook App тохиргоо

1. [Facebook Developers](https://developers.facebook.com/) хуудсанд орж шинэ App үүсгэнэ
2. Facebook Login product нэмнэ
3. Settings > Basic хэсгээс App ID болон App Secret-ийг авч `.env.local` файлд нэмнэ
4. Facebook Login > Settings хэсэгт:
   - Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`
   - (Production-д өөрийн domain-г нэмнэ)

## Хуудсууд

| Хуудас | Тайлбар |
|--------|---------|
| `/` | Нүүр хуудас - ангилал/дүүрэг/түлхүүр үгээр хайх, үйлчилгээний газаруудын жагсаалт |
| `/shop/[id]` | Үйлчилгээний газрын дэлгэрэнгүй (зураг, үнэ, газрын зураг, сэтгэгдэл) |
| `/book/[shopId]` | Захиалга хийх хуудас |
| `/auth/signin` | Нэвтрэх хуудас |
| `/my-reservations` | Миний захиалгууд, сэтгэгдэл үлдээх |
| `/favorites` | Хадгалсан үйлчилгээний газрууд |
| `/rewards` | Миний оноо, купон |
| `/shop-admin` | Үйлчилгээний газрын админ |
| `/admin` | Систем админ |

## API Endpoints

| Endpoint | Method | Тайлбар |
|----------|--------|---------|
| `/api/init` | GET | Өгөгдлийн сан үүсгэх |
| `/api/shops` | GET, POST | Үйлчилгээний газарүүд (category/district/q шүүлтүүртэй) |
| `/api/shops/[id]` | GET, PUT, DELETE | Нэг үйлчилгээний газар |
| `/api/shops/[id]/services` | GET, POST | Үйлчилгээ, үнийн жагсаалт |
| `/api/shops/[id]/services/[serviceId]` | PUT, DELETE | Нэг үйлчилгээ |
| `/api/shops/[id]/reviews` | GET, POST | Сэтгэгдэл, үнэлгээ |
| `/api/shops/[id]/reviews/[reviewId]` | PUT | Сэтгэгдэлд хариу бичих (shop admin) |
| `/api/favorites` | GET, POST, DELETE | Хадгалсан үйлчилгээний газрууд |
| `/api/points` | GET | Миний оноо, ононы түүх |
| `/api/shops/[id]/coupons` | GET, POST | Дэлгүүрийн купонууд |
| `/api/shops/[id]/coupons/[couponId]` | PUT, DELETE | Нэг купон засах/устгах |
| `/api/shops/[id]/coupons/redeem` | POST | Купоныг кодоор ашиглах (shop admin) |
| `/api/coupons/[couponId]/claim` | POST | Оноогоор купон авах |
| `/api/my-coupons` | GET | Миний авсан купонууд |
| `/api/reservations` | GET, POST | Захиалгууд |
| `/api/reservations/[id]` | GET, PUT, DELETE | Нэг захиалга |
| `/api/timeslots` | GET | Боломжит цагууд |
| `/api/users` | GET, POST | Хэрэглэгчид |

## License

MIT
