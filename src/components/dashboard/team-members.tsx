'use client'

import React, { useState } from "react"
import useProject from "@/hooks/use-project"
import { api } from "@/trpc/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Plus, X, ChevronDown, Users, Globe, ExternalLink, Copy, UsersRound, OctagonMinus, Eye, Pencil, Check, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner"
import EmailMultiSelect from "@/components/ui/combobox-multiple-expandable"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"





interface MemberData {
    name: string;
    image: string;
    status: 'pending' | 'accepted' | 'declined';
    invitedAt: Date;
}

const TeamMembers = () => {
    const { projectId, project } = useProject()
    const { data: members } = api.project.getTeamMembers.useQuery({ projectId })

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
    const [memberPermissions, setMemberPermissions] = useState<Record<string, 'Can View' | 'Can Edit' | 'Full Access'>>({});

    // Member data with names and images - initialize with current team members
    const [memberData, setMemberData] = useState<Record<string, MemberData>>({});

    // Initialize member data when members are loaded
    React.useEffect(() => {
        if (members) {
            const initialPermissions: Record<string, 'Can View' | 'Can Edit'> = {};
            const initialData: Record<string, MemberData> = {};

            members.forEach((member: any) => {
                const email = member.user.email || '';
                initialPermissions[email] = 'Can View'; // Default permission
                initialData[email] = {
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
        // Check if there are selected emails or input value
        const hasSelectedEmails = selectedEmails.length > 0;
        const hasInputValue = inputValue.trim() !== '';

        if (!hasSelectedEmails && !hasInputValue) {
            setEmailError('Please fill this field');
            return;
        }

        // Validate input value if exists
        if (hasInputValue && !validateEmail(inputValue.trim())) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Combine selected emails and input value
        const allEmails = [...selectedEmails];
        if (hasInputValue && validateEmail(inputValue.trim())) {
            allEmails.push(inputValue.trim());
        }

        if (allEmails.length === 0) {
            setEmailError('Please add at least one email address');
            return;
        }

        // Check for duplicates and add to memberPermissions
        const newMemberPermissions = { ...memberPermissions };
        const newMemberData = { ...memberData };
        let addedCount = 0;
        let duplicateEmails: string[] = [];

        allEmails.forEach(email => {
            if (memberPermissions[email]) {
                duplicateEmails.push(email);
                return;
            }

            newMemberPermissions[email] = permission;
            newMemberData[email] = {
                name: email.split('@')[0] || email,
                image: `https://ui-avatars.com/api/?name=${email.split('@')[0] || email}&background=random&color=fff&size=40`,
                status: 'pending',
                invitedAt: new Date()
            };
            addedCount++;
        });

        // Show error for duplicate emails
        if (duplicateEmails.length > 0) {
            setEmailError(`Email already exists`);
            return;
        }

        setMemberPermissions(newMemberPermissions);
        setMemberData(newMemberData);

        // Clear selected emails and input
        setSelectedEmails([]);
        setInputValue('');
        setEmailError('');

        // Show success message
        if (addedCount === 1) {
            showSuccessToast("Invitation sent successfully!");
        } else {
            showSuccessToast("Invitations sent successfully!");
        }
    };





    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            // Close all dropdowns when clicking outside
            setShowPermissionDropdown(false);
            setShowLinkPermissionDropdown(false);
            setActiveMemberDropdown(null);
            setOpen(false);
        }
    };

    // Add click handler to close dropdowns when clicking anywhere in the modal
    const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only close dropdowns if clicking on the modal content, not on dropdown elements
        const target = e.target as HTMLElement;
        const isDropdownButton = target.closest('[data-dropdown-button]');
        const isDropdownContent = target.closest('[data-dropdown-content]');

        if (!isDropdownButton && !isDropdownContent) {
            setShowPermissionDropdown(false);
            setShowLinkPermissionDropdown(false);
            setActiveMemberDropdown(null);
        }
    };

    // Helper functions to separate members by status
    const getActiveMembers = () => {
        return Object.keys(memberPermissions).filter(email =>
            memberData[email]?.status === 'accepted'
        );
    };

    const getPendingMembers = () => {
        return Object.keys(memberPermissions).filter(email =>
            memberData[email]?.status === 'pending'
        );
    };

    const getDeclinedMembers = () => {
        return Object.keys(memberPermissions).filter(email =>
            memberData[email]?.status === 'declined'
        );
    };

    const getStatusIcon = (status: 'pending' | 'accepted' | 'declined') => {
        switch (status) {
            case 'accepted':
                return <Check className="w-4 h-4 text-green-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-orange-500" />;
            case 'declined':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: 'pending' | 'accepted' | 'declined') => {
        switch (status) {
            case 'accepted':
                return 'Active';
            case 'pending':
                return 'Pending';
            case 'declined':
                return 'Declined';
            default:
                return '';
        }
    };

    const getStatusColor = (status: 'pending' | 'accepted' | 'declined') => {
        switch (status) {
            case 'accepted':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'pending':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'declined':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Action functions for invitation management
    const cancelInvitation = (email: string) => {
        // Remove from memberPermissions
        setMemberPermissions(prev => {
            const newPermissions = { ...prev };
            delete newPermissions[email];
            return newPermissions;
        });

        // Remove from memberData
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



    // Reset all dropdown states when modal closes
    React.useEffect(() => {
        if (!open) {
            setShowPermissionDropdown(false);
            setShowLinkPermissionDropdown(false);
            setActiveMemberDropdown(null);
            // Clear selected emails and input field when modal closes
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

                    {/* Show +N for remaining members */}
                    {members && members.length > 3 && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">+{members.length - 3}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setOpen(true)}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-400" />
                    </button>
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
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Invite to {project?.name || "Project"}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            Collaborate with members on this project.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Dotted Divider */}
                            <div className="px-4 flex-shrink-0">
                                <div className="border-t border-dotted border-gray-300"></div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="max-h-[80vh] overflow-y-auto">
                                {/* Invite Members Section */}
                                <div className="p-4">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <h4 className="text-sm font-medium leading-none">Anyone with the link</h4>
                                            {/* Permission Dropdown */}
                                            <div className="relative">
                                                <Button
                                                    data-dropdown-button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowPermissionDropdown(false);
                                                        setActiveMemberDropdown(null);
                                                        setShowLinkPermissionDropdown(!showLinkPermissionDropdown);
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded bg-white"
                                                >
                                                    {linkPermission === 'Public' && <Globe className="w-4 h-4 text-gray-500" />}
                                                    {linkPermission === 'Team Only' && <UsersRound className="w-4 h-4 text-gray-500" />}
                                                    {linkPermission === 'Restricted' && <OctagonMinus className="w-4 h-4 text-gray-500" />}
                                                    <span>{linkPermission}</span>
                                                    <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform ${showLinkPermissionDropdown ? 'rotate-180' : ''}`} />
                                                </Button>

                                                <AnimatePresence>
                                                    {showLinkPermissionDropdown && (
                                                        <motion.div
                                                            data-dropdown-content
                                                            className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] min-w-[140px]"
                                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setLinkPermission('Public');
                                                                    setShowLinkPermissionDropdown(false);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-2"
                                                            >
                                                                <Globe className="w-4 h-4 text-gray-500" />
                                                                Public
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setLinkPermission('Team Only');
                                                                    setShowLinkPermissionDropdown(false);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <UsersRound className="w-4 h-4 text-gray-500" />
                                                                Team Only
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setLinkPermission('Restricted');
                                                                    setShowLinkPermissionDropdown(false);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg flex items-center gap-2"
                                                            >
                                                                <OctagonMinus className="w-4 h-4 text-gray-500" />
                                                                Restricted
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center bg-muted rounded-md px-3 py-2 min-w-0">
                                                <span className="text-sm text-muted-foreground flex-1 truncate pr-2">
                                                    {inviteLink}
                                                </span>
                                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-8 px-3"
                                            onClick={copyToClipboard}
                                        >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy Link
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-8 px-3"
                                            onClick={openInviteLink}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Get Embedded Code
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3 pt-4">
                                        <h3 className="text-sm font-medium text-gray-900">Invite Members</h3>
                                        <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white font-medium">i</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* New Email MultiSelect Component with dropdown inside */}
                                        <div className="w-full">
                                            <div className="border-2 border-blue-300 rounded-lg p-2 bg-white min-h-[40px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <EmailMultiSelect
                                                            selectedEmails={selectedEmails}
                                                            onEmailsChange={handleEmailsChange}
                                                            placeholder="Enter email addresses..."
                                                            className="border-none p-0 bg-transparent"
                                                            inputValue={inputValue}
                                                            onInputChange={handleInputChange}
                                                            validateEmail={validateEmail}
                                                            onValidationError={setEmailError}
                                                        />
                                                    </div>

                                                    <div className="relative flex-shrink-0">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    data-dropdown-button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowLinkPermissionDropdown(false);
                                                                        setActiveMemberDropdown(null);
                                                                        setShowPermissionDropdown(!showPermissionDropdown);
                                                                    }}
                                                                    className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                                                                >
                                                                    {permission === 'Can Edit' && <Pencil className="w-4 h-4 text-gray-500" />}
                                                                    {permission === 'Can View' && <Eye className="w-4 h-4 text-gray-500" />}
                                                                    {permission === 'Full Access' && <Users className="w-4 h-4 text-gray-500" />}
                                                                    <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform ${showPermissionDropdown ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{permission}</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <AnimatePresence>
                                                            {showPermissionDropdown && (
                                                                <motion.div
                                                                    data-dropdown-content
                                                                    className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] min-w-[140px]"
                                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                    transition={{ duration: 0.15 }}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            setPermission('Full Access');
                                                                            setShowPermissionDropdown(false);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-2"
                                                                    >
                                                                        <Users className="w-4 h-4 text-gray-500" />
                                                                        Full Access
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setPermission('Can Edit');
                                                                            setShowPermissionDropdown(false);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <Pencil className="w-4 h-4 text-gray-500" />
                                                                        Can Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setPermission('Can View');
                                                                            setShowPermissionDropdown(false);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg flex items-center gap-2"
                                                                    >
                                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                                        Can View
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Error Message */}
                                            {emailError && (
                                                <div className="mt-1 text-sm text-red-600">
                                                    {emailError}
                                                </div>
                                            )}
                                        </div>

                                        {/* Invite Button */}
                                        <button
                                            onClick={handleInviteClick}
                                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Invite
                                        </button>
                                    </div>
                                </div>

                                {/* Project Members Section */}
                                {getActiveMembers().length > 0 && (
                                    <div className="px-4 pb-4 pt-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-sm font-medium text-gray-900">Members with Access ({getActiveMembers().length})</h3>
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        </div>

                                        <div className="space-y-4">
                                            {getActiveMembers().map((email) => (
                                                <div key={email} className="flex items-center justify-between p-1.5 bg-white rounded-lg">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <img
                                                            src={memberData[email]?.image || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff&size=32`}
                                                            alt={memberData[email]?.name || email}
                                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-gray-900 text-sm truncate">{memberData[email]?.name || email.split('@')[0]}</div>
                                                            <div className="text-xs text-gray-500 truncate">{email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border flex-shrink-0 ${getStatusColor(memberData[email]?.status || 'accepted')}`}>
                                                            {getStatusIcon(memberData[email]?.status || 'accepted')}
                                                            <span>{getStatusText(memberData[email]?.status || 'accepted')}</span>
                                                        </div>
                                                        <div className="relative">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        data-dropdown-button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowLinkPermissionDropdown(false);
                                                                            setShowPermissionDropdown(false);
                                                                            setActiveMemberDropdown(activeMemberDropdown === email ? null : email);
                                                                        }}
                                                                        className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 px-2 py-1 rounded"
                                                                    >
                                                                        {memberPermissions[email] === 'Full Access' && <Users className="w-4 h-4 text-gray-400" />}
                                                                        {memberPermissions[email] === 'Can Edit' && <Pencil className="w-4 h-4 text-gray-400" />}
                                                                        {memberPermissions[email] === 'Can View' && <Eye className="w-4 h-4 text-gray-400" />}

                                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeMemberDropdown === email ? 'rotate-180' : ''}`} />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{memberPermissions[email]}</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {activeMemberDropdown === email && (
                                                                <div data-dropdown-content className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] min-w-[140px]">
                                                                    <button
                                                                        onClick={() => {
                                                                            setMemberPermissions(prev => ({ ...prev, [email]: 'Full Access' }));
                                                                            setActiveMemberDropdown(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-2"
                                                                    >
                                                                        <Users className="w-4 h-4 text-gray-500" />
                                                                        Full Access
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setMemberPermissions(prev => ({ ...prev, [email]: 'Can Edit' }));
                                                                            setActiveMemberDropdown(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <Pencil className="w-4 h-4 text-gray-500" />
                                                                        Can Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setMemberPermissions(prev => ({ ...prev, [email]: 'Can View' }));
                                                                            setActiveMemberDropdown(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                                        Can View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            // Remove member logic
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
                                                                            setActiveMemberDropdown(null);
                                                                        }}
                                                                        disabled={email === 'rimshahassan607@gmail.com'} // Disable for owner
                                                                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 last:rounded-b-lg whitespace-nowrap ${email === 'rimshahassan607@gmail.com'
                                                                            ? 'text-gray-400 cursor-not-allowed'
                                                                            : 'text-red-600 hover:bg-red-50'
                                                                            }`}
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                        Remove Access
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pending Invitations Section */}
                                {getPendingMembers().length > 0 && (
                                    <div className="px-4 pb-4 pt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-gray-900">Pending Invitations ({getPendingMembers().length})</h3>
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            </div>

                                        </div>

                                        <div className="space-y-1">
                                            {getPendingMembers().map((email) => (
                                                <div key={email} className="flex items-center justify-between p-1 bg-white rounded-lg">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <img
                                                            src={memberData[email]?.image || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff&size=40`}
                                                            alt={memberData[email]?.name || email}
                                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-gray-900 text-sm truncate">{memberData[email]?.name || email.split('@')[0]}</div>
                                                            <div className="text-xs text-gray-500 truncate">{email}</div>
                                                            <div className="text-xs text-orange-600">
                                                                Invited {memberData[email]?.invitedAt ? new Date(memberData[email].invitedAt).toLocaleDateString() : 'recently'} • {memberPermissions[email]}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border flex-shrink-0 ${getStatusColor(memberData[email]?.status || 'pending')}`}>
                                                            {getStatusIcon(memberData[email]?.status || 'pending')}
                                                            <span>{getStatusText(memberData[email]?.status || 'pending')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => resendInvitation(email)}
                                                                        className="text-orange-600 hover:text-orange-700 p-1 rounded hover:bg-orange-100"
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Resend</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => cancelInvitation(email)}
                                                                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-100"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Cancel</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Declined Invitations Section */}
                                {getDeclinedMembers().length > 0 && (
                                    <div className="px-4 pb-4 pt-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-gray-900">Declined Invitations ({getDeclinedMembers().length})</h3>
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            </div>

                                        </div>

                                        <div className="space-y-1">
                                            {getDeclinedMembers().map((email) => (
                                                <div key={email} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <img
                                                            src={memberData[email]?.image || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff&size=40`}
                                                            alt={memberData[email]?.name || email}
                                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-gray-900 text-sm truncate">{memberData[email]?.name || email.split('@')[0]}</div>
                                                            <div className="text-xs text-gray-500 truncate">{email}</div>
                                                            <div className="text-xs text-red-600">
                                                                Declined {memberData[email]?.invitedAt ? new Date(memberData[email].invitedAt).toLocaleDateString() : 'recently'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border flex-shrink-0 ${getStatusColor(memberData[email]?.status || 'declined')}`}>
                                                            {getStatusIcon(memberData[email]?.status || 'declined')}
                                                            <span>{getStatusText(memberData[email]?.status || 'declined')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => resendInvitation(email)}
                                                                className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-100"
                                                            >
                                                                Resend
                                                            </button>
                                                            <button
                                                                onClick={() => {
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
                                                                }}
                                                                className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-6 pb-4 pr-4">
                                    <Button
                                        variant="outline"
                                        className="h-9 px-4 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => setOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="h-9 px-6 text-sm bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={() => setOpen(false)}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>



                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default TeamMembers