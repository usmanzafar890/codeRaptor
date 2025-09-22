'use client'

import React, { useState } from "react"
import useProject from "@/hooks/use-project"
import { api } from "@/trpc/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner"
import TeamModalHeader from "./team-members/TeamModalHeader"
import InviteByLink from "./team-members/InviteByLink"
import InviteByEmail from "./team-members/InviteByEmail"
import MemberList from "./team-members/MemberList"

export type ProjectAccessLevel = 'FULL_ACCESS' | 'EDIT' | 'VIEW_ONLY';

interface MemberData {
    userId: string;
    name: string;
    image: string;
    status: 'pending' | 'accepted' | 'declined';
    invitedAt: Date;
}

const TeamMembers = ({ isFullAccess }: { isFullAccess: boolean }) => {
    const { projectId, project } = useProject()
    const { data: members, refetch } = api.project.getTeamMembers.useQuery({ projectId })

    const updateUserAccessMutation = api.project.updateUserAccess.useMutation({
        onSuccess: () => {
            showSuccessToast("User access updated successfully!");
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const removeUserMutation = api.project.removeUserFromProject.useMutation({
        onSuccess: () => {
            showSuccessToast("User removed successfully!");
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const inviteMutation = api.project.inviteUserToProject.useMutation({
        onSuccess: () => {
            showSuccessToast("Invitation sent successfully!");
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // Modal state
    const [open, setOpen] = useState(false)
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [permission, setPermission] = useState<'Can View' | 'Can Edit' | 'Full Access'>('Can View');
    const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
    const [linkPermission, setLinkPermission] = useState<'Public' | 'Team Only' | 'Restricted'>('Public');
    const [showLinkPermissionDropdown, setShowLinkPermissionDropdown] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [inputValue, setInputValue] = useState('');

    // Member permissions state - initialize with current team members
    const [memberPermissions, setMemberPermissions] = useState<Record<string, ProjectAccessLevel>>({});

    // Member data with names and images - initialize with current team members
    const [memberData, setMemberData] = useState<Record<string, MemberData>>({});

    // Initialize member data when members are loaded
    React.useEffect(() => {
        if (members) {
            const initialPermissions: Record<string, ProjectAccessLevel> = {};
            const initialData: Record<string, MemberData> = {};

            members.forEach((member: any) => {
                const email = member.user.email || '';
                initialPermissions[email] = member.access; 
                initialData[email] = {
                    userId: member.user.id,
                    name: member.user.name || email.split('@')[0] || email,
                    image: member.user.image || `https://ui-avatars.com/api/?name=${member.user.name || email.split('@')[0] || email}&background=random&color=fff&size=40`,
                    status: 'accepted',
                    invitedAt: new Date()
                };
            });

            setMemberPermissions(initialPermissions);
            setMemberData(initialData);
        }
    }, [members]);

    const [activeMemberDropdown, setActiveMemberDropdown] = useState<string | null>(null);

    // Generate invite link
    const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/join/${projectId}` : '';

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            showSuccessToast("Link copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy: ', err);
            showErrorToast("Failed to copy link");
        }
    };

    const openInviteLink = () => {
        window.open(inviteLink, '_blank');
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleEmailsChange = (emails: string[]) => {
        setSelectedEmails(emails);
        setEmailError(''); // Clear error when emails change
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);
        setEmailError(''); // Clear error when typing
    };

    const handleInviteClick = () => {
        const allEmails = [...selectedEmails];
        if (inputValue.trim() !== '' && validateEmail(inputValue.trim())) {
            if (!allEmails.includes(inputValue.trim())) {
                allEmails.push(inputValue.trim());
            }
        }

        if (allEmails.length === 0) {
            setEmailError('Please enter at least one valid email address.');
            return;
        }

        allEmails.forEach(email => {
            let accessLevel: 'FULL_ACCESS' | 'EDIT' | 'VIEW_ONLY';
            if (permission === 'Full Access') {
                accessLevel = 'FULL_ACCESS';
            } else if (permission === 'Can Edit') {
                accessLevel = 'EDIT';
            } else {
                accessLevel = 'VIEW_ONLY';
            }

            inviteMutation.mutate({
                projectId: projectId!,
                email: email,
                access: accessLevel,
            });
        });

        setSelectedEmails([]);
        setInputValue('');
        setEmailError('');
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setShowPermissionDropdown(false);
            setShowLinkPermissionDropdown(false);
            setActiveMemberDropdown(null);
            setOpen(false);
        }
    };

    const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isDropdownButton = target.closest('[data-dropdown-button]');
        const isDropdownContent = target.closest('[data-dropdown-content]');

        if (!isDropdownButton && !isDropdownContent) {
            setShowPermissionDropdown(false);
            setShowLinkPermissionDropdown(false);
            setActiveMemberDropdown(null);
        }
    };

    const handleUpdateUserAccess = (userId: string, access: 'FULL_ACCESS' | 'EDIT' | 'VIEW_ONLY') => {
        // Find the email for this userId
        let userEmail = '';
        Object.entries(memberData).forEach(([email, data]) => {
            if (data.userId === userId) {
                userEmail = email;
            }
        });

        if (userEmail) {
            // Optimistically update the UI
            setMemberPermissions(prev => ({
                ...prev,
                [userEmail]: access
            }));
        }

        // Then make the API call
        updateUserAccessMutation.mutate({
            projectId: projectId!,
            userId: userId,
            access: access,
        }, {
            onError: () => {
                // If there's an error, revert the optimistic update
                if (userEmail && memberPermissions[userEmail]) {
                    setMemberPermissions(prev => ({
                        ...prev,
                        [userEmail]: memberPermissions[userEmail]
                    }));
                }
            }
        });
    };

    const handleRemoveUser = (userId: string) => {
        // Find the email for this userId
        let userEmail = '';
        Object.entries(memberData).forEach(([email, data]) => {
            if (data.userId === userId) {
                userEmail = email;
            }
        });

        if (userEmail) {
            // Store the original data for potential rollback
            const originalPermission = memberPermissions[userEmail];
            const originalData = memberData[userEmail];

            // Optimistically update the UI
            setMemberPermissions(prev => {
                const newPermissions = { ...prev };
                delete newPermissions[userEmail];
                return newPermissions;
            });

            setMemberData(prev => {
                const newData = { ...prev };
                delete newData[userEmail];
                return newData;
            });
        }

        // Then make the API call
        removeUserMutation.mutate({
            projectId: projectId!,
            userId: userId,
        }, {
            onError: () => {
                // If there's an error, revert the optimistic update
                if (userEmail) {
                    // Restore the original data
                    setMemberPermissions(prev => ({
                        ...prev,
                        [userEmail]: memberPermissions[userEmail]
                    }));

                    setMemberData(prev => ({
                        ...prev,
                        [userEmail]: memberData[userEmail]
                    }));
                }
            }
        });
    };

    const cancelInvitation = (email: string) => {
        setMemberPermissions(prev => {
            const newPermissions = { ...prev };
            delete newPermissions[email];
            return newPermissions;
        });

        setMemberData(prev => {
            const newData = { ...prev };
            delete newData[email];
            return newData;
        });

        showSuccessToast("Invitation cancelled");
    };

    const resendInvitation = (email: string) => {
        setMemberData(prev => ({
            ...prev,
            [email]: {
                ...prev[email]!,
                status: 'pending',
                invitedAt: new Date()
            }
        }));

        showSuccessToast("Invitation resent");
    };

    React.useEffect(() => {
        if (!open) {
            setShowPermissionDropdown(false);
            setShowLinkPermissionDropdown(false);
            setActiveMemberDropdown(null);
            setSelectedEmails([]);
            setInputValue('');
            setEmailError('');
        }
    }, [open]);

    return (
        <>
            <div className="flex items-center gap-1 sm:gap-2 group">
                <div className="flex items-center gap-1 sm:gap-2">
                    {members?.slice(0, 3).map((member: any) => (
                        <Avatar key={member.id} className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border-2 border-white shadow-sm">
                            <AvatarImage src={member.user.image || ""} alt={member.user.name || "User"} />
                            <AvatarFallback className="text-xs sm:text-sm">
                                {member.user.name?.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase() || member.user.email?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    ))}

                    {members && members.length > 3 && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">+{members.length - 3}</span>
                        </div>
                    )}

                    {isFullAccess && (
                        <button
                            onClick={() => setOpen(true)}
                            className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 bg-black/20 flex items-center justify-center p-2 sm:p-4 z-50"
                        onClick={handleBackdropClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-lg mx-auto"
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.9 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                duration: 0.3
                            }}
                            onClick={handleModalClick}
                        >
                            <TeamModalHeader
                                projectName={project?.name || "Project Name"}
                                onClose={() => setOpen(false)}
                            />

                            <div className="max-h-[80vh] overflow-y-auto">
                                <InviteByLink
                                    inviteLink={inviteLink}
                                    linkPermission={linkPermission}
                                    setLinkPermission={setLinkPermission}
                                    showLinkPermissionDropdown={showLinkPermissionDropdown}
                                    setShowLinkPermissionDropdown={setShowLinkPermissionDropdown}
                                    copyToClipboard={copyToClipboard}
                                    openInviteLink={openInviteLink}
                                    setShowPermissionDropdown={setShowPermissionDropdown}
                                    setActiveMemberDropdown={setActiveMemberDropdown}
                                />
                                <InviteByEmail
                                    selectedEmails={selectedEmails}
                                    onEmailsChange={handleEmailsChange}
                                    inputValue={inputValue}
                                    onInputChange={handleInputChange}
                                    validateEmail={validateEmail}
                                    onValidationError={setEmailError}
                                    emailError={emailError}
                                    permission={permission}
                                    setPermission={setPermission}
                                    showPermissionDropdown={showPermissionDropdown}
                                    setShowPermissionDropdown={setShowPermissionDropdown}
                                    handleInviteClick={handleInviteClick}
                                    setShowLinkPermissionDropdown={setShowLinkPermissionDropdown}
                                    setActiveMemberDropdown={setActiveMemberDropdown}
                                />
                                <MemberList
                                    memberPermissions={memberPermissions}
                                    memberData={memberData}
                                    setMemberPermissions={setMemberPermissions}
                                    activeMemberDropdown={activeMemberDropdown}
                                    setActiveMemberDropdown={setActiveMemberDropdown}
                                    cancelInvitation={cancelInvitation}
                                    resendInvitation={resendInvitation}
                                    removeUser={handleRemoveUser}
                                    updateUserAccess={handleUpdateUserAccess}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default TeamMembers;