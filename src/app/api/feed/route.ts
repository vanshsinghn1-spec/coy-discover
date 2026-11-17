import { NextResponse } from 'next/server';
import { getFeedProfiles } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profiles = getFeedProfiles(1);
    return NextResponse.json(profiles, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed profiles' },
      { status: 500 }
    );
  }
}
