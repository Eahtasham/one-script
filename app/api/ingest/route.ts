import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { knowledgeSources, organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        // 1. Auth Check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get Organization
        const memberRecord = await db.query.organizationMembers.findFirst({
            where: eq(organizationMembers.userId, session.user.id),
        });

        if (!memberRecord) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const orgId = memberRecord.organizationId;

        // 3. Process File
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith('.txt')) {
            return NextResponse.json({ error: 'Only .txt files are supported' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const validFilename = file.name.replace(/[^a-z0-9.-]/gi, '_'); // Sanitize
        const uploadDir = path.join(process.cwd(), 'uploads', orgId);

        try {
            await mkdir(uploadDir, { recursive: true });
            await writeFile(path.join(uploadDir, validFilename), buffer);
        } catch (e) {
            console.error('File save error:', e);
            return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
        }

        // Read file content as text
        const textContent = buffer.toString('utf-8');

        // 4. Save to DB
        const [inserted] = await db.insert(knowledgeSources).values({
            organizationId: orgId,
            type: 'file',
            name: file.name,
            content: textContent,
            status: 'pending',
            metadata: {
                localPath: path.join('uploads', orgId, validFilename),
                fileSize: file.size,
                mimeType: 'text/plain',
                originalName: file.name
            }
        }).returning();

        // 5. Trigger Async Processing
        // We use a self-executing function to not block the response
        (async () => {
            try {
                const { vectorService } = await import('@/services/vector-service');
                await vectorService.processSource(inserted.id);
            } catch (err) {
                console.error('Background processing failed:', err);
            }
        })();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
