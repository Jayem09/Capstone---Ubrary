import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { TitleGenerator } from './TitleGenerator';

interface TitleGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TitleGeneratorDialog({ isOpen, onClose }: TitleGeneratorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-purple-600">✨</span>
            AI Title Generator
          </DialogTitle>
          <DialogDescription>
            Generate intelligent, academic-quality titles for your capstone project
          </DialogDescription>
        </DialogHeader>
        
        <TitleGenerator
          onTitleSelect={(title) => {
            // Copy to clipboard when title is selected
            navigator.clipboard.writeText(title).then(() => {
              onClose();
            }).catch(() => {
              onClose();
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
