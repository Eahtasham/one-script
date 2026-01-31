'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KnowledgePage() {
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();


    const [mounted, setMounted] = useState(false);

    // Fix hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        if (!file.name.endsWith('.txt')) {
            alert('Only .txt files are allowed for now');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            alert('File uploaded successfully');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Upload failed: ' + (error as Error).message);
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
                <p className="text-gray-400 mt-1">Manage your chatbot&apos;s knowledge sources</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Add Knowledge Source</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Upload a .txt file to train your chatbot on your content.
                </p>

                <label className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        'Upload .txt File'
                    )}
                    <input
                        type="file"
                        accept=".txt"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={isUploading}
                    />
                </label>
            </div>
        </div>
    );
}
