import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

class RateLimiter {
    private queue: Array<() => Promise<void>> = [];
    private isProcessing = false;
    private minDelay: number;

    constructor(minDelay: number) {
        this.minDelay = minDelay;
    }

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                await task();
                await new Promise(resolve => setTimeout(resolve, this.minDelay));
            }
        }

        this.isProcessing = false;
    }
}

// Initialize rate limiter with 1 second delay between requests
const limiter = new RateLimiter(1000);

export const geminiService = {
    /**
     * Generates embeddings for a given text using Google Gemini model.
     * Dimensions: 768
     */
    async generateEmbedding(text: string): Promise<number[]> {
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error("GOOGLE_API_KEY is not defined");
        }

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "text-embedding-004",
            taskType: TaskType.RETRIEVAL_DOCUMENT,
        });

        return limiter.add(async () => {
            const maxRetries = 5;
            let lastError;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    const result = await embeddings.embedQuery(text);
                    console.log(`Generated embedding with dimension: ${result.length}`);
                    return result;
                } catch (error: any) {
                    lastError = error;
                    // Handle Rate Limit (429) & Service Unavailable (503)
                    if (error?.status === 429 || error?.status === 503 || error?.toString().includes('429')) {
                        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                        console.log(`Gemini API error (${error.status || 'limit'}). Retrying in ${Math.round(waitTime)}ms...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                    throw error;
                }
            }
            throw lastError;
        });
    },
};
