# Цаг Захиалах Систем (Appointment Booking System)

Үйлчилгээний газрын цаг захиалах систем. Монгол хэлээр.

## Боломжууд

### Хэрэглэгчийн талаас
- ✅ Facebook-ээр нэвтрэх
- ✅ Үйлчилгээний газар сонгох
- ✅ Огноо, цаг сонгох
- ✅ Нэр, утас, и-мэйл оруулах
- ✅ Захиалга баталгаажуулах
- ✅ Өөрийн захиалгуудыг харах, цуцлах

### Үйлчилгээний газрын админ талаас
- ✅ Захиалгуудыг огноогоор шүүх
- ✅ Захиалга баталгаажуулах/цуцлах/дуусгах
- ✅ Үйлчилгээний газрын тохиргоо өөрчлөх (нээх/хаах цаг, нэг цагт авах хүний тоо)

### Систем админ талаас
- ✅ Бүх Үйлчилгээний газрын жагсаалт
- ✅ Үйлчилгээний газар нэмэх, засах, устгах
- ✅ Админ хэрэглэгч нэмэх
- ✅ Хэрэглэгчдийн жагсаалт

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
```

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
| `/` | Нүүр хуудас - үйлчилгээний газаруудын жагсаалт |
| `/book/[shopId]` | Захиалга хийх хуудас |
| `/auth/signin` | Нэвтрэх хуудас |
| `/my-reservations` | Миний захиалгууд |
| `/shop-admin` | Үйлчилгээний газрын админ |
| `/admin` | Систем админ |

## API Endpoints

| Endpoint | Method | Тайлбар |
|----------|--------|---------|
| `/api/init` | GET | Өгөгдлийн сан үүсгэх |
| `/api/shops` | GET, POST | Үйлчилгээний газарүүд |
| `/api/shops/[id]` | GET, PUT, DELETE | Нэг үйлчилгээний газар |
| `/api/reservations` | GET, POST | Захиалгууд |
| `/api/reservations/[id]` | GET, PUT, DELETE | Нэг захиалга |
| `/api/timeslots` | GET | Боломжит цагууд |
| `/api/users` | GET, POST | Хэрэглэгчид |

## License

MIT
