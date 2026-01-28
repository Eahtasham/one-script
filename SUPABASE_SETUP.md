# Supabase Integration Setup Guide for OneScript

This guide covers the complete setup of Supabase for **onescript.xyz**, including:
- Database setup with Drizzle ORM
- Email/Password authentication
- Google OAuth
- Custom domain email (onescript.xyz)
- Role-based access control (Admin/Member)

## Table of Contents
1. [Supabase Project Setup](#1-supabase-project-setup)
2. [Database Configuration](#2-database-configuration)
3. [Authentication Setup](#3-authentication-setup)
4. [Custom Domain Email](#4-custom-domain-email)
5. [Google OAuth Setup](#5-google-oauth-setup)
6. [Environment Variables](#6-environment-variables)
7. [Database Migrations](#7-database-migrations)
8. [Testing the Setup](#8-testing-the-setup)

---

## 1. Supabase Project Setup

### Create a New Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name:** `onescript-production` (or your preferred name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose the closest to your users (e.g., `ap-south-1` for India)
4. Click **"Create new project"** and wait for initialization

### Get Your Project Credentials
Once the project is created, go to **Project Settings > API**:
- Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

Go to **Project Settings > Database**:
- Copy the **Connection string** (with password) → `DATABASE_URL`
- For migrations, use the **Direct connection** string → `DATABASE_URL_DIRECT`

---

## 2. Database Configuration

The database schema is already set up in `db/schema.ts` with the following tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `organizations` | Companies/teams using OneScript |
| `organization_members` | Junction table with roles (admin/member) |
| `invitations` | Team invitations |
| `knowledge_sources` | RAG data sources |
| `conversations` | Chat sessions |
| `messages` | Chat messages |
| `sections` | Smart routing configurations |

### Run Database Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Push schema to Supabase database
npm run db:push

# Or run migrations
npm run db:migrate
```

### Enable Row Level Security (RLS)

In the Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Create policies (example for profiles)
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Organization members can view their organization
CREATE POLICY "Members can view their organization"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
  )
);

-- Admins can update organization
CREATE POLICY "Admins can update organization"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);
```

---

## 3. Authentication Setup

### Email/Password Authentication

Go to **Authentication > Providers > Email**:
1. Enable **Email** provider
2. Configure settings:
   - ✅ **Enable Email Confirmations** (recommended for production)
   - ✅ **Secure email change** 
   - **Minimum password length:** 8

### Configure Auth URLs

Go to **Authentication > URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `https://onescript.xyz` |
| **Redirect URLs** | Add all of these: |
| | `https://onescript.xyz/auth/callback` |
| | `https://onescript.xyz/auth/callback?type=recovery` |
| | `https://www.onescript.xyz/auth/callback` |
| | `http://localhost:3000/auth/callback` (for dev) |

---

## 4. Custom Domain Email

To send emails from `noreply@onescript.xyz` instead of Supabase's default:

### Option A: Supabase Custom SMTP (Recommended)

Go to **Project Settings > Auth > SMTP Settings**:

1. **Enable Custom SMTP**
2. Configure with your email provider:

**For custom domain email providers (e.g., Zoho, Google Workspace, AWS SES):**

| Setting | Example (Zoho) | Example (AWS SES) |
|---------|----------------|-------------------|
| **Host** | `smtp.zoho.in` | `email-smtp.ap-south-1.amazonaws.com` |
| **Port** | `587` | `587` |
| **Username** | `noreply@onescript.xyz` | Your SES SMTP username |
| **Password** | Your email password | Your SES SMTP password |
| **Sender email** | `noreply@onescript.xyz` | `noreply@onescript.xyz` |
| **Sender name** | `OneScript` | `OneScript` |

**For AWS SES Setup:**
1. Go to AWS SES Console
2. Verify your domain `onescript.xyz`
3. Create SMTP credentials
4. Add required DNS records (DKIM, SPF)

### Option B: Using Resend (Modern Alternative)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `onescript.xyz`
3. Get your API key
4. Configure in Supabase SMTP settings:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: Your Resend API key

### Email Templates

Go to **Authentication > Email Templates** and customize:

1. **Confirm signup** - Verification email
2. **Magic Link** - Passwordless login
3. **Change Email Address** - Email change confirmation
4. **Reset Password** - Password reset email

Example template customization:
```html
<h2>Welcome to OneScript!</h2>
<p>Hi there,</p>
<p>Thanks for signing up. Please confirm your email by clicking the button below:</p>
<a href="{{ .ConfirmationURL }}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
  Confirm Email
</a>
<p>If you didn't create this account, you can safely ignore this email.</p>
<p>— The OneScript Team</p>
```

---

## 5. Google OAuth Setup

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Configure:
   - **Application type:** Web application
   - **Name:** OneScript
   - **Authorized JavaScript origins:**
     - `https://onescript.xyz`
     - `http://localhost:3000`
   - **Authorized redirect URIs:**
     - `https://<your-project-id>.supabase.co/auth/v1/callback`
     - (Get this from Supabase Auth settings)

6. Copy the **Client ID** and **Client Secret**

### Configure in Supabase

Go to **Authentication > Providers > Google**:
1. Enable Google provider
2. Paste your **Client ID**
3. Paste your **Client Secret**
4. Save

### DNS Records for Domain (if using custom domain auth)

Add these DNS records for `onescript.xyz`:

| Type | Name | Value |
|------|------|-------|
| CNAME | `auth` | Your Supabase auth subdomain |

---

## 6. Environment Variables

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Database
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DATABASE_URL_DIRECT=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Application
NEXT_PUBLIC_APP_URL=https://onescript.xyz
NEXT_PUBLIC_SITE_URL=https://onescript.xyz

# OpenAI (for chatbot)
OPENAI_API_KEY=[your-openai-key]
```

---

## 7. Database Migrations

### Initial Setup

```bash
# Install dependencies
npm install

# Generate migrations from schema
npm run db:generate

# Push to database
npm run db:push
```

### Create Required Enums

Before running migrations, create the enums in Supabase SQL Editor:

```sql
-- Create enums for roles and statuses
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE source_status AS ENUM ('pending', 'processing', 'active', 'failed');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
```

### Database Trigger for Profile Creation

Create a trigger to automatically create profiles when users sign up:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 8. Testing the Setup

### Local Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000/login` and test:

1. **Email/Password Signup:**
   - Enter email and password
   - Check email for verification link
   - Confirm email
   - Should redirect to dashboard

2. **Google OAuth:**
   - Click "Continue with Google"
   - Select/sign in to Google account
   - Should redirect back and create profile

3. **Role-Based Access:**
   - First user in an organization is automatically admin
   - Test inviting a member from dashboard
   - Verify member cannot access admin-only features

### Verify Database

In Supabase Dashboard > Table Editor:
- Check `profiles` table has your user
- Check `organizations` table has default org
- Check `organization_members` has you as admin

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     OneScript Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Next.js    │────▶│  Supabase    │────▶│  PostgreSQL  │ │
│  │   App Router │     │  Auth        │     │  (via Drizzle)│ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│         │                    │                     │        │
│         │                    │                     │        │
│         ▼                    ▼                     ▼        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Middleware │     │   Google     │     │     RLS      │ │
│  │   (Session)  │     │   OAuth      │     │   Policies   │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                              │                              │
│                              ▼                              │
│                       ┌──────────────┐                      │
│                       │   Custom     │                      │
│                       │   Email      │                      │
│                       │   (SMTP)     │                      │
│                       └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Role System

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: billing, team management, settings, delete org |
| **Member** | Standard access: knowledge base, conversations, playground |

---

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Check if email is confirmed
   - Verify password meets requirements

2. **Google OAuth not redirecting**
   - Verify redirect URLs in Google Console match Supabase
   - Check browser console for CORS errors

3. **Emails not sending**
   - Verify SMTP settings
   - Check spam folder
   - Confirm domain is verified

4. **Database connection errors**
   - Use connection pooler URL for serverless
   - Check password is correct
   - Verify IP is not blocked

### Support

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js App Router](https://nextjs.org/docs/app)
