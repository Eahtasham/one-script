import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserOrganizations } from '@/lib/session';
import { db } from '@/db';
import { knowledgeSources, conversations } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userOrgs = await getUserOrganizations(session.user.id);
        const primaryOrg = userOrgs[0];

        if (!primaryOrg) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Get stats
        const [sourcesCount] = await db
            .select({ count: count() })
            .from(knowledgeSources)
            .where(eq(knowledgeSources.organizationId, primaryOrg.organization.id));

        const [conversationsCount] = await db
            .select({ count: count() })
            .from(conversations)
            .where(eq(conversations.organizationId, primaryOrg.organization.id));

        return NextResponse.json({
            knowledgeSources: sourcesCount?.count || 0,
            conversations: conversationsCount?.count || 0,
            widgetConfigured: !!primaryOrg.organization.widgetConfig,
            widgetId: primaryOrg.organization.widgetId,
        });
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
