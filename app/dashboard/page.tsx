import { redirect } from 'next/navigation';

export default function DashboardPage() {
    // Redirect to the home page within dashboard
    redirect('/dashboard/home');
}
