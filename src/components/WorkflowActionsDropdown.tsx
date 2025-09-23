import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Clock, CheckCircle, XCircle, MessageSquare, Download, Star } from 'lucide-react';

interface WorkflowActionsDropdownProps {
  document: {
    id: string;
    title: string;
    status?: string;
  };
  onView?: () => void;
  onDownload?: () => void;
  onStartReview?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestRevision?: () => void;
  onStar?: () => void;
  userRole?: 'student' | 'faculty' | 'library_staff' | 'admin';
}

export function WorkflowActionsDropdown({
  document,
  onView,
  onDownload,
  onStartReview,
  onApprove,
  onReject,
  onRequestRevision,
  onStar,
  userRole = 'student'
}: WorkflowActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getAvailableActions = () => {
    const actions = [];

    // Common actions for all roles
    if (onView) {
      actions.push({
        label: 'View Document',
        icon: Eye,
        onClick: onView,
        className: 'text-blue-600 hover:bg-blue-50'
      });
    }

    if (onDownload) {
      actions.push({
        label: 'Download',
        icon: Download,
        onClick: onDownload,
        className: 'text-green-600 hover:bg-green-50'
      });
    }

    if (onStar) {
      actions.push({
        label: 'Star Document',
        icon: Star,
        onClick: onStar,
        className: 'text-yellow-600 hover:bg-yellow-50'
      });
    }

    // Role-specific actions
    if (userRole === 'faculty' || userRole === 'library_staff' || userRole === 'admin') {
      if (document.status === 'pending' && onStartReview) {
        actions.push({
          label: 'Start Review',
          icon: Clock,
          onClick: onStartReview,
          className: 'text-orange-600 hover:bg-orange-50'
        });
      }

      if (document.status === 'under_review') {
        if (onApprove) {
          actions.push({
            label: 'Approve',
            icon: CheckCircle,
            onClick: onApprove,
            className: 'text-green-600 hover:bg-green-50'
          });
        }

        if (onReject) {
          actions.push({
            label: 'Reject',
            icon: XCircle,
            onClick: onReject,
            className: 'text-red-600 hover:bg-red-50'
          });
        }

        if (onRequestRevision) {
          actions.push({
            label: 'Request Revision',
            icon: MessageSquare,
            onClick: onRequestRevision,
            className: 'text-blue-600 hover:bg-blue-50'
          });
        }
      }
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="More actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] py-1">
            {availableActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 transition-colors ${action.className}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
