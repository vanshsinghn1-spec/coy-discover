import { NextRequest, NextResponse } from 'next/server';
import { recordSwipe } from '@/lib/db';
import { SwipeRequest } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SwipeRequest;
    const { profileId, action } = body;

    if (!profileId || !['like', 'pass'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid swipe parameters. profileId and action ("like" | "pass") are required.' },
        { status: 400 }
      );
    }

    const result = recordSwipe(1, Number(profileId), action);

    return NextResponse.json({
      success: true,
      action,
      matched: result.matched,
      matchedProfile: result.matchedProfile || null,
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500 }
    );
  }
}
