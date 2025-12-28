import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Өгөгдлийн сан амжилттай үүслээ' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Өгөгдлийн санг үүсгэхэд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

