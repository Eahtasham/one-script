import { auth } from '@/lib/auth';
import { getUserOrganizations } from '@/lib/session';
import { db } from '@/db';
import { knowledgeSources, conversations, users } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Book, MessageSquare, CheckCircle, Copy } from 'lucide-react';


export default async function DashboardHomePage() {
    const session = await auth();

    if (!session?.user) return null;

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!user) return null;

    const userOrgs = await getUserOrganizations(session.user.id);
    const primaryOrg = userOrgs[0];

    if (!primaryOrg) return null;

    // Get stats
    const [sourcesCount] = await db
        .select({ count: count() })
        .from(knowledgeSources)
        .where(eq(knowledgeSources.organizationId, primaryOrg.organization.id));

    const [conversationsCount] = await db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.organizationId, primaryOrg.organization.id));

    const stats = [
        {
            name: 'Knowledge Sources',
            value: sourcesCount?.count || 0,
            description: 'Total data sources',
            icon: Book,
            color: 'bg-indigo-500/10 text-indigo-500'
        },
        {
            name: 'Conversations',
            value: conversationsCount?.count || 0,
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
        { name: 'Add knowledge sources', completed: (sourcesCount?.count || 0) > 0 },
        { name: 'Configure widget', completed: !!primaryOrg.organization.widgetConfig },
        { name: 'Install on website', completed: false },
    ];

    const completedSteps = setupSteps.filter(s => s.completed).length;
    const progress = (completedSteps / setupSteps.length) * 100;

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
                {stats.map((stat) => (
                    <Card key={stat.name}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
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
                            &lt;script src=&quot;https://onescript.xyz/widget.js&quot; data-id=&quot;{primaryOrg.organization.widgetId}&quot;&gt;&lt;/script&gt;
                        </code>
                    </div>
                    <Button className="gap-2">
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}