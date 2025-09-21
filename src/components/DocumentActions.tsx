import { Download, Star, Share2, Printer, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { PermissionGuard } from './PermissionGuard';
import { toast } from 'sonner';

interface DocumentActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}

export function DocumentActions({ 
  onEdit, 
  onDelete, 
  onApprove, 
  onReject,
  isPending = false
}: DocumentActionsProps) {

  const handleDownload = () => {
    toast.success('Download started', {
      description: 'The document is being downloaded...'
    });
  };

  const handleStar = () => {
    toast.success('Document starred', {
      description: 'Added to your starred documents'
    });
  };

  const handleShare = () => {
    toast.success('Link copied', {
      description: 'Document link copied to clipboard'
    });
  };

  const handlePrint = () => {
    toast.info('Opening print dialog', {
      description: 'Preparing document for printing...'
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Basic actions available to all users with view permission */}
      <PermissionGuard permission="canDownload">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </PermissionGuard>

      <Button variant="outline" size="sm" onClick={handleStar}>
        <Star className="w-4 h-4 mr-2" />
        Star
      </Button>

      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>

      {/* Review actions for faculty and librarians */}
      {isPending && (
        <>
          <PermissionGuard permission="canApprove">
            <Button variant="default" size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </PermissionGuard>

          <PermissionGuard permission="canReview">
            <Button variant="destructive" size="sm" onClick={onReject}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </PermissionGuard>
        </>
      )}

      {/* Edit actions for librarians and admins */}
      <PermissionGuard permission="canEdit">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </PermissionGuard>

      {/* Delete actions for librarians and admins */}
      <PermissionGuard permission="canDelete">
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </PermissionGuard>
    </div>
  );
}
