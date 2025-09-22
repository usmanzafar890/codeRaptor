import React from 'react';
import { ChevronDown, Users, Eye, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmailMultiSelect from '@/components/ui/combobox-multiple-expandable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface InviteByEmailProps {
  selectedEmails: string[];
  onEmailsChange: (emails: string[]) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  validateEmail: (email: string) => boolean;
  onValidationError: (error: string) => void;
  emailError: string;
  permission: 'Can View' | 'Can Edit' | 'Full Access';
  setPermission: (permission: 'Can View' | 'Can Edit' | 'Full Access') => void;
  showPermissionDropdown: boolean;
  setShowPermissionDropdown: (show: boolean) => void;
  handleInviteClick: () => void;
  setShowLinkPermissionDropdown: (show: boolean) => void;
  setActiveMemberDropdown: (active: string | null) => void;
}

const InviteByEmail = ({
  selectedEmails,
  onEmailsChange,
  inputValue,
  onInputChange,
  validateEmail,
  onValidationError,
  emailError,
  permission,
  setPermission,
  showPermissionDropdown,
  setShowPermissionDropdown,
  handleInviteClick,
  setShowLinkPermissionDropdown,
  setActiveMemberDropdown,
}: InviteByEmailProps) => {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3 pt-4">
        <h3 className="text-sm font-medium text-gray-900">Invite Members</h3>
        <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-medium">i</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-full">
          <div className="border-2 border-blue-300 rounded-lg p-2 bg-white min-h-[40px]">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <EmailMultiSelect
                  selectedEmails={selectedEmails}
                  onEmailsChange={onEmailsChange}
                  placeholder="Enter email addresses..."
                  className="border-none p-0 bg-transparent"
                  inputValue={inputValue}
                  onInputChange={onInputChange}
                  validateEmail={validateEmail}
                  onValidationError={onValidationError}
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
          {emailError && (
            <div className="mt-1 text-sm text-red-600">
              {emailError}
            </div>
          )}
        </div>

        <button
          onClick={handleInviteClick}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Invite
        </button>
      </div>
    </div>
  );
};

export default InviteByEmail;
