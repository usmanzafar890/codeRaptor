import React from 'react';
import { X, Users } from 'lucide-react';

interface TeamModalHeaderProps {
  projectName: string;
  onClose: () => void;
}

const TeamModalHeader = ({ projectName, onClose }: TeamModalHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Invite to {projectName}
            </h2>
            <p className="text-sm text-gray-500">
              Collaborate with members on this project.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-4 flex-shrink-0">
        <div className="border-t border-dotted border-gray-300"></div>
      </div>
    </>
  );
};

export default TeamModalHeader;
