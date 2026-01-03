import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Add icon column to shops table if it doesn't exist
    await sql`ALTER TABLE shops ADD COLUMN IF NOT EXISTS icon VARCHAR(500)`;
    
    return NextResponse.json({ 
      message: 'Migration completed successfully',
      details: 'Added icon column to shops table'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}


