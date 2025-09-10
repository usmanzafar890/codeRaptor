"use client"

import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { X, ChevronDown, Users, Globe, ExternalLink, Copy, UsersRound, OctagonMinus, Eye, Pencil, Check, Clock, AlertCircle, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import useProject from "@/hooks/use-project"
import { api } from "@/trpc/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface EmailTag {
  id: string;
  email: string;
}

interface MemberData {
  name: string;
  image: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
}

const InviteButton = () => {
  const { projectId, project } = useProject()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("");
  const [emailTags, setEmailTags] = useState<EmailTag[]>([]);
  const [permission, setPermission] = useState<'Can View' | 'Can Edit'>('Can View');
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [linkPermission, setLinkPermission] = useState<'Public' | 'Team Only' | 'Restricted'>('Public');
  const [showLinkPermissionDropdown, setShowLinkPermissionDropdown] = useState(false);

  // Get team members data
  const { data: members } = api.project.getTeamMembers.useQuery({ projectId })

  // Member permissions state - initialize with current team members
  const [memberPermissions, setMemberPermissions] = useState<Record<string, 'Can View' | 'Can Edit'>>({});

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
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  // Generate invite link
  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/join/${projectId}` : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setShowCopiedMessage(true);
      setTimeout(() => {
        setShowCopiedMessage(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmailTag = () => {
    const trimmedEmail = inputValue.trim();

    if (trimmedEmail && validateEmail(trimmedEmail)) {
      // Check if email already exists in members
      if (memberPermissions[trimmedEmail]) {
        setInviteMessage(`${trimmedEmail} is already a member!`);
        setShowInviteMessage(true);
        setTimeout(() => {
          setShowInviteMessage(false);
        }, 3000);
        return;
      }

      // Check if email already exists in emailTags
      if (emailTags.some(tag => tag.email === trimmedEmail)) {
        setInviteMessage(`${trimmedEmail} is already in invite list!`);
        setShowInviteMessage(true);
        setTimeout(() => {
          setShowInviteMessage(false);
        }, 3000);
        return;
      }

      // Add to emailTags for display in input field
      const newTag: EmailTag = {
        id: Date.now().toString(),
        email: trimmedEmail
      };
      setEmailTags([...emailTags, newTag]);

      // Clear input field immediately
      setInputValue("");
    } else {
      setInviteMessage('Please enter a valid email address (e.g., user@example.com)');
      setShowInviteMessage(true);
      setTimeout(() => {
        setShowInviteMessage(false);
      }, 3000);
    }
  };

  const handleInviteClick = () => {
    // If there are emailTags, invite all of them
    if (emailTags.length > 0) {
      inviteAllEmails();
    } else {
      // If no emailTags, check if there's an email in input field
      const trimmedEmail = inputValue.trim();
      if (trimmedEmail && validateEmail(trimmedEmail)) {
        // Single email mode - add directly
        if (memberPermissions[trimmedEmail]) {
          setInviteMessage(`${trimmedEmail} is already a member!`);
          setShowInviteMessage(true);
          setTimeout(() => {
            setShowInviteMessage(false);
          }, 3000);
          return;
        }

        // Add directly to memberPermissions
        setMemberPermissions(prev => ({
          ...prev,
          [trimmedEmail]: permission
        }));

        setMemberData(prev => ({
          ...prev,
          [trimmedEmail]: {
            name: trimmedEmail.split('@')[0] || trimmedEmail,
            image: `https://ui-avatars.com/api/?name=${trimmedEmail.split('@')[0] || trimmedEmail}&background=random&color=fff&size=40`,
            status: 'pending',
            invitedAt: new Date()
          }
        }));

        // Clear input field
        setInputValue("");

        // Show success message
        setInviteMessage(`Invitation has been sent to ${trimmedEmail}`);
        setShowInviteMessage(true);
        setTimeout(() => {
          setShowInviteMessage(false);
        }, 3000);
      } else {
        setInviteMessage('Please enter a valid email address (e.g., user@example.com)');
        setShowInviteMessage(true);
        setTimeout(() => {
          setShowInviteMessage(false);
        }, 3000);
      }
    }
  };

  const inviteAllEmails = () => {
    if (emailTags.length === 0) {
      setInviteMessage('Please add at least one email address');
      setShowInviteMessage(true);
      setTimeout(() => {
        setShowInviteMessage(false);
      }, 3000);
      return;
    }

    // Store count before clearing
    const emailCount = emailTags.length;

    // Add all emailTags to memberPermissions
    const newMemberPermissions = { ...memberPermissions };
    const newMemberData = { ...memberData };

    emailTags.forEach(tag => {
      if (!memberPermissions[tag.email]) {
        newMemberPermissions[tag.email] = permission;
        newMemberData[tag.email] = {
          name: tag.email.split('@')[0] || tag.email,
          image: `https://ui-avatars.com/api/?name=${tag.email.split('@')[0] || tag.email}&background=random&color=fff&size=40`,
          status: 'pending',
          invitedAt: new Date()
        };
      }
    });

    setMemberPermissions(newMemberPermissions);
    setMemberData(newMemberData);

    // Clear all emailTags
    setEmailTags([]);

    // Show success message
    setInviteMessage(`Invitations have been sent to ${emailCount} members!`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmailTag();
    }
  };

  const removeEmailTag = (tagId: string) => {
    setEmailTags(emailTags.filter(tag => tag.id !== tagId));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Close all dropdowns when clicking outside
      setShowPermissionDropdown(false);
      setShowLinkPermissionDropdown(false);
      setActiveMemberDropdown(null);
      setOpen(false);
    }
  };

  // Add click handler to close dropdowns when clicking anywhere in the modal
  const handleModalClick = (e: React.MouseEvent) => {
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
    setMemberData(prev => ({
      ...prev,
      [email]: {
        ...prev[email]!,
        status: 'declined',
        invitedAt: new Date()
      }
    }));

    setInviteMessage(`Invitation cancelled for ${email}`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
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

    setInviteMessage(`Invitation resent to ${email}`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
  };

  const acceptInvitation = (email: string) => {
    setMemberData(prev => ({
      ...prev,
      [email]: {
        ...prev[email]!,
        status: 'accepted',
        invitedAt: new Date()
      }
    }));

    setInviteMessage(`${email} accepted the invitation!`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
  };

  const declineInvitation = (email: string) => {
    setMemberData(prev => ({
      ...prev,
      [email]: {
        ...prev[email]!,
        status: 'declined',
        invitedAt: new Date()
      }
    }));

    setInviteMessage(`${email} declined the invitation`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
  };

  const cancelAllInvitations = () => {
    const pendingEmails = getPendingMembers();
    pendingEmails.forEach(email => {
      setMemberData(prev => ({
        ...prev,
        [email]: {
          ...prev[email]!,
          status: 'declined',
          invitedAt: new Date()
        }
      }));
    });

    setInviteMessage(`Cancelled ${pendingEmails.length} pending invitations`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
  };

  const resendAllInvitations = () => {
    const pendingEmails = getPendingMembers();
    pendingEmails.forEach(email => {
      setMemberData(prev => ({
        ...prev,
        [email]: {
          ...prev[email]!,
          status: 'pending',
          invitedAt: new Date()
        }
      }));
    });

    setInviteMessage(`Resent ${pendingEmails.length} invitations`);
    setShowInviteMessage(true);
    setTimeout(() => {
      setShowInviteMessage(false);
    }, 3000);
  };

  // Reset all dropdown states when modal closes
  React.useEffect(() => {
    if (!open) {
      setShowPermissionDropdown(false);
      setShowLinkPermissionDropdown(false);
      setActiveMemberDropdown(null);
    }
  }, [open]);

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Invite Members
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
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
              <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Invite to {project?.name || "Project"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Collaborate with members on this project.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dotted Divider */}
              <div className="px-6 flex-shrink-0">
                <div className="border-t border-dotted border-gray-300"></div>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[80vh] overflow-y-auto">
                {/* Invite Members Section */}
                <div className="p-6">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-sm font-medium leading-none">Anyone with the link</h4>
                      {/* Permission Dropdown */}
                      <div className="relative">
                        <Button
                          data-dropdown-button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Close other dropdowns when opening this one
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
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-2"
                              >
                                <Globe className="w-4 h-4 text-gray-500" />
                                Public
                              </button>
                              <button
                                onClick={() => {
                                  setLinkPermission('Team Only');
                                  setShowLinkPermissionDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <UsersRound className="w-4 h-4 text-gray-500" />
                                Team Only
                              </button>
                              <button
                                onClick={() => {
                                  setLinkPermission('Restricted');
                                  setShowLinkPermissionDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg flex items-center gap-2"
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
                      <div className="flex-1 flex items-center bg-muted rounded-md px-3 py-2">
                        <span className="text-sm text-muted-foreground flex-1 truncate">
                          {inviteLink}
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
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
                    <Button variant="ghost" size="sm" className="text-xs h-8 px-3">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get Embedded Code
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Invite Members</h3>
                    <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">i</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Email Input Container */}
                    <div className="border-2 border-blue-300 rounded-lg p-3 bg-white">
                      {/* Email Tags */}
                      {emailTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {emailTags.map((tag) => (
                            <div key={tag.id} className="flex items-center bg-blue-50 rounded px-2 py-1 text-sm">
                              <span className="text-blue-700">{tag.email}</span>
                              <button
                                onClick={() => removeEmailTag(tag.id)}
                                className="ml-2 text-blue-400 hover:text-blue-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input Row */}
                      <div className="flex items-center justify-between">
                        <input
                          type="email"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
                          placeholder="hi@alignui.com"
                        />

                        {/* Permission Dropdown */}
                        <div className="relative">
                          <button
                            data-dropdown-button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Close other dropdowns when opening this one
                              setShowLinkPermissionDropdown(false);
                              setActiveMemberDropdown(null);
                              setShowPermissionDropdown(!showPermissionDropdown);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                          >
                            {permission === 'Can Edit' && <Pencil className="w-4 h-4 text-gray-500" />}
                            {permission === 'Can View' && <Eye className="w-4 h-4 text-gray-500" />}
                            <span>{permission}</span>
                            <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform ${showPermissionDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showPermissionDropdown && (
                              <motion.div
                                data-dropdown-content
                                className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] min-w-[120px]"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                              >
                                <button
                                  onClick={() => {
                                    setPermission('Can Edit');
                                    setShowPermissionDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-2"
                                >
                                  <Pencil className="w-4 h-4 text-gray-500" />
                                  Can Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setPermission('Can View');
                                    setShowPermissionDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg flex items-center gap-2"
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
                  <div className="px-6 pb-4 pt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Members with Access ({getActiveMembers().length})</h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="space-y-1">
                      {getActiveMembers().map((email) => (
                        <div key={email} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={memberData[email]?.image || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff&size=32`}
                              alt={memberData[email]?.name || email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{memberData[email]?.name || email.split('@')[0]}</div>
                              <div className="text-xs text-gray-500">{email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(memberData[email]?.status || 'accepted')}`}>
                              {getStatusIcon(memberData[email]?.status || 'accepted')}
                              <span>{getStatusText(memberData[email]?.status || 'accepted')}</span>
                            </div>
                            <div className="relative">
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
                                {memberPermissions[email] === 'Can Edit' && <Pencil className="w-4 h-4 text-gray-400" />}
                                {memberPermissions[email] === 'Can View' && <Eye className="w-4 h-4 text-gray-400" />}
                                <span>{memberPermissions[email]}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeMemberDropdown === email ? 'rotate-180' : ''}`} />
                              </button>

                              {activeMemberDropdown === email && (
                                <div data-dropdown-content className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] min-w-[120px]">
                                  <button
                                    onClick={() => {
                                      setMemberPermissions(prev => ({ ...prev, [email]: 'Can Edit' }));
                                      setActiveMemberDropdown(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-2"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-500" />
                                    Can Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMemberPermissions(prev => ({ ...prev, [email]: 'Can View' }));
                                      setActiveMemberDropdown(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    Can View
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
                  <div className="px-6 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">Pending Invitations ({getPendingMembers().length})</h3>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={resendAllInvitations}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Resend All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={cancelAllInvitations}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Cancel All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {getPendingMembers().map((email) => (
                        <div key={email} className="flex items-center justify-between p-1.5 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={memberData[email]?.image || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff&size=40`}
                              alt={memberData[email]?.name || email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{memberData[email]?.name || email.split('@')[0]}</div>
                              <div className="text-xs text-gray-500">{email}</div>
                              <div className="text-xs text-orange-600">
                                Invited {memberData[email]?.invitedAt ? new Date(memberData[email].invitedAt).toLocaleDateString() : 'recently'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(memberData[email]?.status || 'pending')}`}>
                              {getStatusIcon(memberData[email]?.status || 'pending')}
                              <span>{getStatusText(memberData[email]?.status || 'pending')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => resendInvitation(email)}
                                className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-100"
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => cancelInvitation(email)}
                                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Declined Invitations Section */}
                {getDeclinedMembers().length > 0 && (
                  <div className="px-6 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">Declined Invitations ({getDeclinedMembers().length})</h3>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const declinedEmails = getDeclinedMembers();
                            declinedEmails.forEach(email => resendInvitation(email));
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Resend All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {getDeclinedMembers().map((email) => (
                        <div key={email} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={memberData[email]?.image || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff&size=40`}
                              alt={memberData[email]?.name || email}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{memberData[email]?.name || email.split('@')[0]}</div>
                              <div className="text-xs text-gray-500">{email}</div>
                              <div className="text-xs text-red-600">
                                Declined {memberData[email]?.invitedAt ? new Date(memberData[email].invitedAt).toLocaleDateString() : 'recently'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(memberData[email]?.status || 'declined')}`}>
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
                                  // Remove from memberPermissions and memberData
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

                <div className="flex items-center justify-end gap-3 pt-6 pb-4 pr-2">
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

              {/* Copied to Clipboard Popup */}
              <AnimatePresence>
                {showCopiedMessage && (
                  <motion.div
                    className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-[70] flex items-center gap-2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">copied to clipboard</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Invite Notification Popup */}
              <AnimatePresence>
                {showInviteMessage && (
                  <motion.div
                    className="fixed bottom-4 left-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg shadow-lg z-[70] flex items-center gap-2 max-w-sm"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{inviteMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InviteButton;
