import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
    }

    try {
        await signIn('credentials', {
            token,
            redirectTo: '/dashboard?verified=true',
        });
    } catch (error) {
        // signIn throws a redirect error on success, we need to let it bubble up
        // or re-throw if it's the specific NEXT_REDIRECT error
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Verification error:', error);
        return NextResponse.redirect(new URL('/login?error=VerificationFailed', request.url));
    }
}
