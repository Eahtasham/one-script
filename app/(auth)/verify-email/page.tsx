import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl text-center">
                <CardHeader>
                    <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">Check your email</CardTitle>
                    <CardDescription className="mt-2 text-base">
                        We&apos;ve sent a verification link to your email address. Please click the link to verify your account.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center pb-8">
                    <Link href="/login">
                        <Button variant="link" className="text-primary gap-2 p-0 h-auto font-medium">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Back to log in
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
