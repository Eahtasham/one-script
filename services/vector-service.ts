import { db } from '@/db';
import { knowledgeSources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { geminiService } from './gemini-service';

export const vectorService = {
    /**
     * Processes a knowledge source:
     * 1. Reads the content from the DB
     * 2. Generates an embedding
     * 3. Updates the DB with the embedding and sets status to 'active'
     */
    async processSource(sourceId: string) {
        // 1. Fetch Source
        const source = await db.query.knowledgeSources.findFirst({
            where: eq(knowledgeSources.id, sourceId)
        });

        if (!source || !source.content) {
            throw new Error('Source not found or no content');
        }

        try {
            // Update status to processing
            await db.update(knowledgeSources)
                .set({ status: 'processing' })
                .where(eq(knowledgeSources.id, sourceId));

            // 2. Generate Embedding
            // Note: For large texts, you should split chunks here. 
            // For now, we assume simple text files that fit in context window or are already small.
            // LangChain's GoogleEmbeddings will handle some truncation, but best practice is explicit splitting.
            const embedding = await geminiService.generateEmbedding(source.content);

            // 3. Update DB
            console.log(`Updating DB for source ${sourceId} with embedding of length ${embedding.length}`);

            try {
                const result = await db.update(knowledgeSources)
                    .set({
                        embedding: embedding,
                        status: 'active',
                        processedAt: new Date()
                    })
                    .where(eq(knowledgeSources.id, sourceId))
                    .returning();
                console.log('DB Update successful:', result ? 'Row returned' : 'No row returned');
            } catch (dbError) {
                console.error('DB Update FAILED:', dbError);
                throw dbError; // rethrow to hit the outer catch
            }

        } catch (error) {
            console.error('Vector processing error full details:', error);
            await db.update(knowledgeSources)
                .set({
                    status: 'failed',
                    errorMessage: (error as Error).message
                })
                .where(eq(knowledgeSources.id, sourceId));
            throw error;
        }
    }
};
