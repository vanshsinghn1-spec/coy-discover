import { NextResponse } from 'next/server';
import { resetApp } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    resetApp();
    return NextResponse.json({ success: true, message: 'Database reset and re-seeded successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
