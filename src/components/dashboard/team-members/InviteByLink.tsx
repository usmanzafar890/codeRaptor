import React from 'react';
import { ChevronDown, Globe, UsersRound, OctagonMinus, ExternalLink, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

interface InviteByLinkProps {
  inviteLink: string;
  linkPermission: 'Public' | 'Team Only' | 'Restricted';
  setLinkPermission: (permission: 'Public' | 'Team Only' | 'Restricted') => void;
  showLinkPermissionDropdown: boolean;
  setShowLinkPermissionDropdown: (show: boolean) => void;
  copyToClipboard: () => void;
  openInviteLink: () => void;
  setShowPermissionDropdown: (show: boolean) => void;
  setActiveMemberDropdown: (active: string | null) => void;
}

const InviteByLink = ({
  inviteLink,
  linkPermission,
  setLinkPermission,
  showLinkPermissionDropdown,
  setShowLinkPermissionDropdown,
  copyToClipboard,
  openInviteLink,
  setShowPermissionDropdown,
  setActiveMemberDropdown,
}: InviteByLinkProps) => {
  return (
    <div className="p-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-sm font-medium leading-none">Anyone with the link</h4>
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
    </div>
  );
};

export default InviteByLink;
