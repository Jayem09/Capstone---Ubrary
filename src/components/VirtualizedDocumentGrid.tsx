import { useMemo, memo } from 'react';
import { DocumentCard } from './DocumentCard';
import { DocumentList } from './DocumentList';

// Use the same Document interface as App.tsx
interface Document {
  id: string;
  title: string;
  authors: string[];
  year: number;
  program: string;
  adviser: string;
  abstract: string;
  keywords: string[];
  downloadCount: number;
  dateAdded: string;
  fileSize: string;
  pages: number;
  thumbnail: string;
}

interface VirtualizedDocumentGridProps {
  documents: Document[];
  viewMode: 'grid' | 'list';
  onDocumentView: (document: Document) => void;
  containerHeight?: number;
  containerWidth?: number;
}

// Memoized document card to prevent unnecessary re-renders
const MemoizedDocumentCard = memo(({ 
  document, 
  onDocumentView 
}: { 
  document: Document; 
  onDocumentView: (document: Document) => void;
}) => (
  <DocumentCard 
    document={document} 
    onDocumentView={onDocumentView}
  />
));

// Memoized document list item
const MemoizedDocumentListItem = memo(({ 
  document, 
  onDocumentView 
}: { 
  document: Document; 
  onDocumentView: (document: Document) => void;
}) => (
  <div className="p-2">
    <DocumentList 
      documents={[document]} 
      onDocumentView={onDocumentView}
    />
  </div>
));

export const VirtualizedDocumentGrid = memo<VirtualizedDocumentGridProps>(({
  documents,
  viewMode,
  onDocumentView,
  containerHeight = 600,
  containerWidth = 1200
}) => {
  // Memoize grid configuration for performance
  const gridConfig = useMemo(() => {
    if (viewMode === 'list') {
      return {
        className: 'space-y-2',
        itemClassName: 'w-full'
      };
    } else {
      // Grid mode with responsive columns
      const columns = Math.max(1, Math.floor(containerWidth / 300));
      return {
        className: `grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${Math.min(columns, 4)}`,
        itemClassName: 'w-full'
      };
    }
  }, [viewMode, containerWidth]);

  // Don't render if no documents
  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No documents found</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: containerHeight, overflowY: 'auto' }}>
      <div className={gridConfig.className}>
        {documents.map((document) => (
          <div key={document.id} className={gridConfig.itemClassName}>
            {viewMode === 'grid' ? (
              <MemoizedDocumentCard 
                document={document} 
                onDocumentView={onDocumentView}
              />
            ) : (
              <MemoizedDocumentListItem 
                document={document} 
                onDocumentView={onDocumentView}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedDocumentGrid.displayName = 'VirtualizedDocumentGrid';
