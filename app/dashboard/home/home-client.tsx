'use client';

import { useUser, useActiveOrganization } from '@/components/providers/auth-provider';
import { useDashboardStats } from '@/hooks/use-dashboard-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Book, MessageSquare, CheckCircle, Copy, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardHomeClient() {
    const user = useUser();
    const organization = useActiveOrganization();
    const { data: stats, isLoading, error } = useDashboardStats();

    if (!user || !organization) {
        return (
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    const statsCards = [
        {
            name: 'Knowledge Sources',
            value: stats?.knowledgeSources ?? 0,
            description: 'Total data sources',
            icon: Book,
            color: 'bg-indigo-500/10 text-indigo-500'
        },
        {
            name: 'Conversations',
            value: stats?.conversations ?? 0,
            description: 'Total chat sessions',
            icon: MessageSquare,
            color: 'bg-purple-500/10 text-purple-500'
        },
        {
            name: 'Widget Status',
            value: 'Active',
            description: 'Ready for embedding',
            icon: CheckCircle,
            color: 'bg-green-500/10 text-green-500'
        },
    ];

    const setupSteps = [
        { name: 'Create account', completed: true },
        { name: 'Add knowledge sources', completed: (stats?.knowledgeSources ?? 0) > 0 },
        { name: 'Configure widget', completed: stats?.widgetConfigured ?? false },
        { name: 'Install on website', completed: false },
    ];

    const completedSteps = setupSteps.filter(s => s.completed).length;
    const progress = (completedSteps / setupSteps.length) * 100;

    const handleCopyScript = () => {
        const script = `<script src="https://onescript.xyz/widget.js" data-id="${stats?.widgetId}"></script>`;
        navigator.clipboard.writeText(script);
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Welcome back, {user.name || user.email?.split('@')[0]}
                </h1>
                <p className="text-muted-foreground mt-2">
                    Here&apos;s what&apos;s happening with your chatbot today.
                </p>
            </div>

            {/* Setup Progress */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Setup Progress</CardTitle>
                            <CardDescription className="mt-1">Complete these steps to get your chatbot live</CardDescription>
                        </div>
                        <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="h-2 mb-6" />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {setupSteps.map((step, index) => (
                            <div key={step.name} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step.completed
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-muted border-border text-muted-foreground'
                                    }`}>
                                    {step.completed ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <span className="text-sm font-medium">{index + 1}</span>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsCards.map((stat) => (
                    <Card key={stat.name}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <stat.icon className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                )}
                                <p className="text-sm text-muted-foreground">{stat.name}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Widget Installation */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Install</CardTitle>
                    <CardDescription>
                        Add this script to your website to enable the chatbot widget.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto text-foreground">
                        <code>
                            &lt;script src=&quot;https://onescript.xyz/widget.js&quot; data-id=&quot;{stats?.widgetId}&quot;&gt;&lt;/script&gt;
                        </code>
                    </div>
                    <Button className="gap-2" onClick={handleCopyScript}>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
