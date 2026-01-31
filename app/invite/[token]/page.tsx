import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getInvitationByToken, acceptInvitation } from '@/services/team';
import Link from 'next/link';
import Image from 'next/image';

interface InvitePageProps {
    params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = await params;

    // Get invitation details (public, no auth required)
    const inviteResult = await getInvitationByToken(token);

    // Check if user is authenticated
    const session = await auth();
    const isAuthenticated = !!session?.user;

    // Handle invalid/expired invitation
    if (inviteResult.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
                <div className="relative w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <Image src="/assets/logo.svg" alt="OneScript Logo" width={180} height={48} priority />
                        </Link>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Invitation Error</h1>
                        <p className="text-gray-400 mb-6">{inviteResult.error}</p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { invitation } = inviteResult;

    // If authenticated, try to accept the invitation
    if (isAuthenticated) {
        // Check if email matches
        if (session.user?.email?.toLowerCase() !== invitation?.email.toLowerCase()) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
                    <div className="relative w-full max-w-md">
                        <div className="text-center mb-8">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <Image src="/assets/logo.svg" alt="OneScript Logo" width={180} height={48} priority />
                            </Link>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-white mb-2">Email Mismatch</h1>
                            <p className="text-gray-400 mb-4">
                                This invitation was sent to <strong className="text-white">{invitation?.email}</strong>
                            </p>
                            <p className="text-gray-400 mb-6">
                                You are currently logged in as <strong className="text-white">{session.user?.email}</strong>
                            </p>
                            <p className="text-gray-500 text-sm mb-6">
                                Please log out and sign in with the correct email, or ask for a new invitation.
                            </p>
                            <Link
                                href="/dashboard"
                                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        // Accept the invitation
        const result = await acceptInvitation(token);
        if (result.success) {
            // Redirect with org ID as query param
            // The dashboard layout will read this and set the cookie
            redirect(`/dashboard?switch-org=${result.organizationId}`);
        }

        // Show error if acceptance failed
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
                <div className="relative w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <Image src="/assets/logo.svg" alt="OneScript Logo" width={180} height={48} priority />
                        </Link>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Error Accepting Invitation</h1>
                        <p className="text-gray-400 mb-6">{result.error}</p>
                        <Link
                            href="/dashboard"
                            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated - show invitation info with login/signup options
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <Image src="/assets/logo.svg" alt="OneScript Logo" width={180} height={48} priority />
                    </Link>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>

                    <h1 className="text-xl font-bold text-white mb-2">You&apos;re Invited!</h1>

                    <p className="text-gray-400 mb-2">
                        <strong className="text-white">{invitation?.inviterName}</strong> has invited you to join
                    </p>

                    <p className="text-2xl font-bold text-indigo-400 mb-4">
                        {invitation?.organizationName}
                    </p>

                    <p className="text-gray-500 text-sm mb-6">
                        You&apos;ll be joining as a <span className="text-white font-medium">{invitation?.role}</span>
                    </p>

                    <div className="bg-gray-700/30 rounded-lg p-3 mb-6">
                        <p className="text-gray-400 text-sm">
                            Invitation sent to: <span className="text-white">{invitation?.email}</span>
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href={`/signup?invite=${token}&email=${encodeURIComponent(invitation?.email || '')}`}
                            className="block w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                        >
                            Create Account & Join
                        </Link>

                        <Link
                            href={`/login?invite=${token}`}
                            className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>

                    <p className="text-gray-500 text-xs mt-6">
                        This invitation expires on {new Date(invitation?.expiresAt || '').toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
