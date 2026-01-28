import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { organizationName, websiteUrl } = await request.json();

        if (!organizationName) {
            return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
        }

        // Generate slug
        const slug = organizationName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            + '-' + Date.now().toString(36);

        // Create organization
        const [organization] = await db.insert(organizations).values({
            name: organizationName,
            slug,
            websiteUrl: websiteUrl || null,
            onboardingCompleted: true,
        }).returning();

        // Add user as admin
        await db.insert(organizationMembers).values({
            organizationId: organization.id,
            userId: session.user.id,
            role: 'admin',
        });

        return NextResponse.json({ success: true, organization });
    } catch (error) {
        console.error('Onboarding error:', error);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }
}
