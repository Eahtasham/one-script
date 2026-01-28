export class EmailService {
    private apiKey: string;
    private fromEmail: string;
    private welcomeEmail: string;
    private appUrl: string;

    constructor() {
        this.apiKey = process.env.UNOSEND_API_KEY!;
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@onescript.xyz';
        this.welcomeEmail = process.env.EMAIL_WELCOME || 'welcome@onescript.xyz';
        this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        if (!this.apiKey) {
            console.warn('UNOSEND_API_KEY is not set');
        }
    }

    private async sendEmail(to: string, from: string, subject: string, html: string) {
        try {
            const response = await fetch('https://www.unosend.co/api/v1/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    from: `OneScript <${from}>`,
                    to: to,
                    subject,
                    html,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Failed to send email:', error);
                return { success: false, error };
            }

            return { success: true };
        } catch (error) {
            console.error('Email sending error:', error);
            return { success: false, error };
        }
    }

    async sendVerificationEmail(email: string, token: string) {
        const verifyLink = `${this.appUrl}/auth/verify?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Verify your email</h2>
                <p>Thanks for signing up for OneScript! Please confirm your email address to continue.</p>
                <a href="${verifyLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link: <br>${verifyLink}</p>
                <p style="color: #888; font-size: 12px; margin-top: 40px;">If you didn't request this, you can ignore this email.</p>
            </div>
        `;

        return this.sendEmail(email, this.fromEmail, 'Verify your email - OneScript', html);
    }

    async sendWelcomeEmail(email: string, name: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome to OneScript, ${name}!</h2>
                <p>We're excited to have you on board.</p>
                <p>OneScript is designed to help you build better chatbots faster. Here are a few things you can do to get started:</p>
                <ul>
                    <li>Create your first chatbot</li>
                    <li>Customize your widget</li>
                    <li>Explore our documentation</li>
                </ul>
                <a href="${this.appUrl}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
                <p style="color: #666; font-size: 14px;">Need help? Just reply to this email.</p>
            </div>
        `;

        return this.sendEmail(email, this.welcomeEmail, 'Welcome to OneScript! 🚀', html);
    }
}

export const emailService = new EmailService();
