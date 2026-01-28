'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginWithCredentials, loginWithGoogle } from '@/app/actions/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');
    const [state, formAction, isPending] = useActionState(loginWithCredentials, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-xl">O</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground">OneScript</span>
                        </Link>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        {inviteToken
                            ? 'Sign in to accept your team invitation'
                            : 'Sign in to your account to continue'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={loginWithGoogle}>
                        {inviteToken && (
                            <input type="hidden" name="redirectTo" value={`/invite/${inviteToken}`} />
                        )}
                        <Button variant="outline" className="w-full" type="submit">
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </form>

                    <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-muted-foreground text-xs uppercase">Or continue with</span>
                        <Separator className="flex-1" />
                    </div>

                    <form action={formAction} className="space-y-4">
                        {inviteToken && (
                            <input type="hidden" name="redirectTo" value={`/invite/${inviteToken}`} />
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {state?.error && (
                            <div className="text-destructive text-sm text-center font-medium">
                                {state.error}
                            </div>
                        )}

                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link
                            href={inviteToken ? `/signup?invite=${inviteToken}` : '/signup'}
                            className="text-primary hover:text-primary/90 font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}