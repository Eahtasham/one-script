'use server';

import { signIn, signOut } from '@/lib/auth';
import { db } from '@/db';
import { users, organizations, organizationMembers, verificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { emailService } from '@/services/email';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function loginWithCredentials(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/dashboard',
        });
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error; // This is expected - let the redirect happen
        }
        return { error: 'Invalid email or password' };
    }
}

export async function loginWithGoogle() {
    await signIn('google', { redirectTo: '/dashboard' });
}

export async function logout() {
    await signOut({ redirectTo: '/login' });
}

export async function registerUser(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
    }

    try {
        // Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return { error: 'An account with this email already exists' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const [user] = await db.insert(users).values({
            email,
            name: name || email.split('@')[0],
            password: hashedPassword,
        }).returning();

        // Create default organization
        const orgName = name ? `${name}'s Workspace` : `${email.split('@')[0]}'s Workspace`;
        const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

        const [organization] = await db.insert(organizations).values({
            name: orgName,
            slug,
        }).returning();

        // Add user as admin
        await db.insert(organizationMembers).values({
            organizationId: organization.id,
            userId: user.id,
            role: 'admin',
        });

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.insert(verificationTokens).values({
            identifier: email,
            token,
            expires,
        });

        // Send verification email
        await emailService.sendVerificationEmail(email, token);

        // Redirect to verification page
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Registration error:', error);
        return { error: 'Failed to create account. Please try again.' };
    }

    redirect('/verify-email?sent=true');
}
