'use client';

import { useState } from 'react';
import { inviteTeamMember, getPendingInvitations, updateMemberRole, removeMember, cancelInvitation } from '@/services/team';
import type { UserRole } from '@/db/schema';

interface SettingsPageClientProps {
    organization: {
        id: string;
        name: string;
        slug: string;
        widgetId: string;
    };
    members: Array<{
        membership: {
            id: string;
            userId: string;
            role: UserRole;
            joinedAt: Date;
        };
        profile: {
            id: string;
            email: string;
            fullName: string | null;
        };
    }>;
    pendingInvitations: Array<{
        id: string;
        email: string;
        role: UserRole;
        createdAt: Date;
        expiresAt: Date;
    }>;
    isAdmin: boolean;
    currentUserId: string;
}

export default function SettingsPageClient({
    organization,
    members: initialMembers,
    pendingInvitations: initialInvitations,
    isAdmin,
    currentUserId,
}: SettingsPageClientProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
    const [members, setMembers] = useState(initialMembers);
    const [invitations, setInvitations] = useState(initialInvitations);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('member');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setLoading(true);
        setMessage(null);

        const result = await inviteTeamMember(organization.id, inviteEmail, inviteRole);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
            setInviteEmail('');
            // Refresh invitations
            const invitesResult = await getPendingInvitations(organization.id);
            if (invitesResult.success && invitesResult.invitations) {
                setInvitations(invitesResult.invitations as typeof initialInvitations);
            }
        }

        setLoading(false);
    }

    async function handleUpdateRole(memberId: string, newRole: UserRole) {
        const result = await updateMemberRole(memberId, organization.id, newRole);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMembers(members.map(m =>
                m.membership.id === memberId
                    ? { ...m, membership: { ...m.membership, role: newRole } }
                    : m
            ));
            setMessage({ type: 'success', text: 'Role updated successfully' });
        }
    }

    async function handleRemoveMember(memberId: string) {
        if (!confirm('Are you sure you want to remove this member?')) return;

        const result = await removeMember(memberId, organization.id);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMembers(members.filter(m => m.membership.id !== memberId));
            setMessage({ type: 'success', text: 'Member removed successfully' });
        }
    }

    async function handleCancelInvitation(invitationId: string) {
        const result = await cancelInvitation(invitationId, organization.id);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setInvitations(invitations.filter(i => i.id !== invitationId));
            setMessage({ type: 'success', text: 'Invitation cancelled' });
        }
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your organization and team</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-800 mb-8">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                            ? 'border-indigo-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                    >
                        General
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'team'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            Team
                        </button>
                    )}
                </nav>
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
                <div className="space-y-8">
                    {/* Organization Info */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Organization</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={organization.name}
                                    readOnly
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Slug</label>
                                <input
                                    type="text"
                                    value={organization.slug}
                                    readOnly
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Widget ID */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Widget Configuration</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Widget ID</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={organization.widgetId}
                                    readOnly
                                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono"
                                />
                                <button
                                    onClick={() => navigator.clipboard.writeText(organization.widgetId)}
                                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Settings */}
            {activeTab === 'team' && isAdmin && (
                <div className="space-y-8">
                    {/* Invite Member */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Invite Team Member</h2>
                        <form onSubmit={handleInvite} className="flex gap-4">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Invite'}
                            </button>
                        </form>
                    </div>

                    {/* Pending Invitations */}
                    {invitations.length > 0 && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Pending Invitations</h2>
                            <div className="space-y-3">
                                {invitations.map((invitation) => (
                                    <div key={invitation.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">{invitation.email}</p>
                                            <p className="text-sm text-gray-400">
                                                Invited as {invitation.role} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCancelInvitation(invitation.id)}
                                            className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team Members */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Team Members</h2>
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div key={member.membership.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <span className="text-white font-medium">
                                                {member.profile.fullName?.charAt(0) || member.profile.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {member.profile.fullName || member.profile.email.split('@')[0]}
                                                {member.membership.userId === currentUserId && (
                                                    <span className="ml-2 text-xs text-gray-500">(You)</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-400">{member.profile.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={member.membership.role}
                                            onChange={(e) => handleUpdateRole(member.membership.id, e.target.value as UserRole)}
                                            disabled={member.membership.userId === currentUserId}
                                            className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm disabled:opacity-50"
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {member.membership.userId !== currentUserId && (
                                            <button
                                                onClick={() => handleRemoveMember(member.membership.id)}
                                                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
