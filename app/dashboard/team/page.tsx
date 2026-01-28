import { redirect } from 'next/navigation';

export default function TeamPage() {
    // Team management is in settings, redirect there
    redirect('/dashboard/settings');
}
