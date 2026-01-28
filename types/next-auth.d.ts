import 'next-auth';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            organizationId?: string;
            role?: 'admin' | 'member';
        } & DefaultSession['user'];
    }

    interface User {
        organizationId?: string;
        role?: 'admin' | 'member';
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        organizationId?: string;
        role?: 'admin' | 'member';
    }
}
