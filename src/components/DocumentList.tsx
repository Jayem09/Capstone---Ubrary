import { Download, Eye, Star, Calendar, User, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Image } from "./ui/image";
import { DocumentService } from "../services/documentService";
import { StarredService } from "../services/starredService";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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

interface DocumentListProps {
  documents: Document[];
  onDocumentView: (document: Document) => void;
  onDownloadUpdate?: (documentId: string, newCount: number) => void;
}

export function DocumentList({ documents, onDocumentView, onDownloadUpdate }: DocumentListProps) {
  const [downloadStates, setDownloadStates] = useState<Record<string, { isDownloading: boolean; count: number }>>({});
  const [starredStates, setStarredStates] = useState<Record<string, { isStarred: boolean; isStarring: boolean }>>({});

  // Load starred states for all documents
  useEffect(() => {
    const loadStarredStates = async () => {
      const documentIds = documents.map(doc => doc.id);
      const starredMap = await StarredService.getDocumentsStarredStatus(documentIds);
      
      const initialStates: Record<string, { isStarred: boolean; isStarring: boolean }> = {};
      documentIds.forEach(id => {
        initialStates[id] = { isStarred: starredMap[id] || false, isStarring: false };
      });
      
      setStarredStates(initialStates);
    };

    if (documents.length > 0) {
      loadStarredStates();
    }
  }, [documents]);

  const handleStar = async (document: Document) => {
    const currentState = starredStates[document.id] || { isStarred: false, isStarring: false };
    
    if (currentState.isStarring) return;
    
    setStarredStates(prev => ({
      ...prev,
      [document.id]: { ...currentState, isStarring: true }
    }));
    
    try {
      const { isStarred: newStarredState } = await StarredService.toggleStar(document.id);
      setStarredStates(prev => ({
        ...prev,
        [document.id]: { isStarred: newStarredState, isStarring: false }
      }));
    } catch (error) {
      console.error('Error toggling star:', error);
      setStarredStates(prev => ({
        ...prev,
        [document.id]: { ...currentState, isStarring: false }
      }));
    }
  };

  const handleDownload = async (document: Document) => {
    const currentState = downloadStates[document.id] || { isDownloading: false, count: document.downloadCount };
    
    if (currentState.isDownloading) return;
    
    setDownloadStates(prev => ({
      ...prev,
      [document.id]: { ...currentState, isDownloading: true }
    }));
    
    try {
      // Get the document file path first
      const filePathResult = await DocumentService.getDocumentFilePath(document.id);
      
      if (filePathResult.data && filePathResult.data.file_path) {
        // Get the signed URL for download
        const urlResult = await DocumentService.getDocumentFileUrl(filePathResult.data.file_path);
        
        if (urlResult.data && urlResult.data.signedUrl) {
          console.log('Download URL:', urlResult.data.signedUrl); // Debug log
          
          // Increment download count
          await DocumentService.incrementDownloadCount(document.id);
          
          // Update local count
          const newCount = currentState.count + 1;
          setDownloadStates(prev => ({
            ...prev,
            [document.id]: { isDownloading: false, count: newCount }
          }));
          
          // Notify parent component
          if (onDownloadUpdate) {
            onDownloadUpdate(document.id, newCount);
          }
          
          // Try multiple download approaches
          try {
            // Method 1: Fetch and create blob URL (most reliable)
            try {
              const response = await fetch(urlResult.data.signedUrl);
              if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                const link = window.document.createElement('a');
                link.href = blobUrl;
                link.download = `${document.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`;
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
                
                // Clean up blob URL
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                
                toast.success(`Downloaded "${document.title}"`, {
                  description: "PDF file has been downloaded to your device"
                });
                return;
              }
            } catch (fetchError) {
              console.warn('Fetch download failed, trying alternative:', fetchError);
            }
            
            // Method 2: Direct programmatic download link
            const link = window.document.createElement('a');
            link.href = urlResult.data.signedUrl;
            link.download = `${document.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            // Force download attribute
            link.setAttribute('download', `${document.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`);
            
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            
            toast.success(`Download started for "${document.title}"`, {
              description: "Check your downloads folder"
            });
          } catch (downloadError) {
            console.error('All download methods failed:', downloadError);
            // Final fallback: open URL in new tab
            window.open(urlResult.data.signedUrl, '_blank');
            toast.info("Download opened in new tab", {
              description: "Right-click the PDF and select 'Save as' to download"
            });
          }
        } else {
          throw new Error('Could not get download URL');
        }
      } else {
        throw new Error('Document file not found');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Download failed", {
        description: "Please try again or contact support"
      });
      setDownloadStates(prev => ({
        ...prev,
        [document.id]: { ...currentState, isDownloading: false }
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
          <div className="col-span-5">Document</div>
          <div className="col-span-2">Program</div>
          <div className="col-span-2">Date Added</div>
          <div className="col-span-1">Downloads</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Document List */}
      <div className="divide-y divide-gray-200">
        {documents.map((document) => {
          const currentState = downloadStates[document.id] || { isDownloading: false, count: document.downloadCount };
          return (
          <div key={document.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Document Info */}
              <div className="col-span-5 flex items-center space-x-3">
                <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={document.thumbnail}
                    alt={document.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 line-clamp-1 hover:text-[#8B0000] cursor-pointer transition-colors">
                    {document.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <User className="w-3 h-3 mr-1" />
                    <span className="line-clamp-1">{document.authors.join(", ")}</span>
                  </div>
                  {document.adviser && document.adviser !== 'Unknown Adviser' && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="font-medium mr-1">Adviser:</span>
                      <span className="line-clamp-1">{document.adviser}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {document.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {document.keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{document.keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Program */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900 line-clamp-1">{document.program}</span>
                <span className="text-xs text-gray-500">{document.year}</span>
              </div>

              {/* Date Added */}
              <div className="col-span-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(document.dateAdded).toLocaleDateString()}
                </div>
              </div>

              {/* Downloads */}
              <div className="col-span-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Download className="w-3 h-3 mr-1" />
                  {currentState.count}
                </div>
              </div>

              {/* File Size */}
              <div className="col-span-1">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-3 h-3 mr-1" />
                  {document.fileSize}
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center space-x-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`h-8 w-8 p-0 ${starredStates[document.id]?.isStarred ? "text-yellow-500" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStar(document);
                  }}
                  disabled={starredStates[document.id]?.isStarring}
                >
                  <Star className={`w-4 h-4 ${starredStates[document.id]?.isStarred ? "fill-yellow-500" : ""} ${starredStates[document.id]?.isStarring ? "animate-pulse" : ""}`} />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => onDocumentView(document)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-[#8B0000] hover:text-red-800"
                  onClick={() => handleDownload(document)}
                  disabled={currentState.isDownloading}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}