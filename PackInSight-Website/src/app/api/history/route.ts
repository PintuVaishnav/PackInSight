import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scans } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userScans = await db
      .select()
      .from(scans)
      .where(eq(scans.userId, session.user.id))
      .orderBy(desc(scans.scanDate))
      .limit(50);
    
    return NextResponse.json(userScans);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { scanId } = await request.json();
    
    if (!scanId) {
      return NextResponse.json({ error: 'Scan ID required' }, { status: 400 });
    }
    
    await db.delete(scans).where(eq(scans.id, scanId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    );
  }
}
