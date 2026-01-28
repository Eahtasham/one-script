-- =============================================================================
-- OneScript Supabase Database Setup SQL
-- Run this in Supabase SQL Editor after schema migration
-- =============================================================================

-- =============================================================================
-- 1. CREATE ENUMS (if not already created by Drizzle)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE source_status AS ENUM ('pending', 'processing', 'active', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sections ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. PROFILES POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Service role can insert profiles (for auth trigger)
CREATE POLICY IF NOT EXISTS "Service role can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- 4. ORGANIZATIONS POLICIES
-- =============================================================================

-- Members can view their organizations
CREATE POLICY IF NOT EXISTS "Members can view organization"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
  )
);

-- Admins can update their organization
CREATE POLICY IF NOT EXISTS "Admins can update organization"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Authenticated users can create organizations
CREATE POLICY IF NOT EXISTS "Users can create organization"
ON organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can delete their organization
CREATE POLICY IF NOT EXISTS "Admins can delete organization"
ON organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- =============================================================================
-- 5. ORGANIZATION MEMBERS POLICIES
-- =============================================================================

-- Members can view other members in their org
CREATE POLICY IF NOT EXISTS "Members can view org members"
ON organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
  )
);

-- Admins can insert new members
CREATE POLICY IF NOT EXISTS "Admins can add members"
ON organization_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
  OR
  -- Allow users to join as first member (org creator)
  NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
  )
);

-- Admins can update member roles
CREATE POLICY IF NOT EXISTS "Admins can update members"
ON organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
);

-- Admins can remove members (or users can remove themselves)
CREATE POLICY IF NOT EXISTS "Admins can remove members"
ON organization_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
  OR user_id = auth.uid()
);

-- =============================================================================
-- 6. INVITATIONS POLICIES
-- =============================================================================

-- Admins can view invitations
CREATE POLICY IF NOT EXISTS "Admins can view invitations"
ON invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = invitations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Admins can create invitations
CREATE POLICY IF NOT EXISTS "Admins can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = invitations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Admins can update invitations
CREATE POLICY IF NOT EXISTS "Admins can update invitations"
ON invitations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = invitations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- =============================================================================
-- 7. KNOWLEDGE SOURCES POLICIES
-- =============================================================================

-- Members can view knowledge sources
CREATE POLICY IF NOT EXISTS "Members can view knowledge sources"
ON knowledge_sources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = knowledge_sources.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Members can create knowledge sources
CREATE POLICY IF NOT EXISTS "Members can create knowledge sources"
ON knowledge_sources FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = knowledge_sources.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Members can update knowledge sources
CREATE POLICY IF NOT EXISTS "Members can update knowledge sources"
ON knowledge_sources FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = knowledge_sources.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Admins can delete knowledge sources
CREATE POLICY IF NOT EXISTS "Admins can delete knowledge sources"
ON knowledge_sources FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = knowledge_sources.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- =============================================================================
-- 8. CONVERSATIONS & MESSAGES POLICIES
-- =============================================================================

-- Members can view conversations
CREATE POLICY IF NOT EXISTS "Members can view conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = conversations.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Public can create conversations (widget users)
CREATE POLICY IF NOT EXISTS "Anyone can create conversations"
ON conversations FOR INSERT
WITH CHECK (true);

-- Members can update conversations
CREATE POLICY IF NOT EXISTS "Members can update conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = conversations.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Members can view messages
CREATE POLICY IF NOT EXISTS "Members can view messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = messages.conversation_id
    AND om.user_id = auth.uid()
  )
);

-- Anyone can create messages (widget users)
CREATE POLICY IF NOT EXISTS "Anyone can create messages"
ON messages FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- 9. SECTIONS POLICIES
-- =============================================================================

-- Members can view sections
CREATE POLICY IF NOT EXISTS "Members can view sections"
ON sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = sections.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Members can create sections
CREATE POLICY IF NOT EXISTS "Members can create sections"
ON sections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = sections.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Members can update sections
CREATE POLICY IF NOT EXISTS "Members can update sections"
ON sections FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = sections.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Admins can delete sections
CREATE POLICY IF NOT EXISTS "Admins can delete sections"
ON sections FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = sections.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- =============================================================================
-- 10. AUTO-CREATE PROFILE FUNCTION & TRIGGER
-- =============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 11. HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user is admin of organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Function to check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Function to get user's primary organization
CREATE OR REPLACE FUNCTION public.get_user_primary_org()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  ORDER BY joined_at ASC
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

-- =============================================================================
-- 12. INDEXES FOR PERFORMANCE
-- =============================================================================

-- These should already exist from Drizzle, but ensure they're created
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_org_id ON knowledge_sources(organization_id);

-- =============================================================================
-- DONE!
-- =============================================================================
-- Run this SQL in Supabase SQL Editor after running:
-- npm run db:push
-- =============================================================================
