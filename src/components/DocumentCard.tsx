import { Download, Eye, Star, Calendar, User, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Image } from "./ui/image";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { DocumentService } from "../services/documentService";
import { StarredService } from "../services/starredService";

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

interface DocumentCardProps {
  document: Document;
  onDocumentView: (document: Document) => void;
  onDownloadUpdate?: (documentId: string, newCount: number) => void;
}

export function DocumentCard({ document, onDocumentView, onDownloadUpdate }: DocumentCardProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [downloadCount, setDownloadCount] = useState(document.downloadCount);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStarring, setIsStarring] = useState(false);

  // Check if document is starred on component mount
  useEffect(() => {
    const checkStarredStatus = async () => {
      const starred = await StarredService.isDocumentStarred(document.id);
      setIsStarred(starred);
    };
    checkStarredStatus();
  }, [document.id]);

  const handleView = () => {
    onDocumentView(document);
  };

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isStarring) return;
    
    setIsStarring(true);
    
    try {
      const { isStarred: newStarredState } = await StarredService.toggleStar(document.id);
      setIsStarred(newStarredState);
    } catch (error) {
      console.error('Error toggling star:', error);
    } finally {
      setIsStarring(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDownloading) return;
    
    setIsDownloading(true);
    
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
          const newCount = downloadCount + 1;
          setDownloadCount(newCount);
          
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
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        <Image
          src={document.thumbnail}
          alt={document.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Action buttons overlay */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className={`h-8 w-8 p-0 ${isStarred ? "text-yellow-500 border-yellow-500" : ""}`}
            onClick={handleStar}
            disabled={isStarring}
          >
            <Star className={`w-4 h-4 ${isStarred ? "fill-yellow-500" : ""} ${isStarring ? "animate-pulse" : ""}`} />
          </Button>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 bg-white/90 text-gray-900 hover:bg-white"
            onClick={handleView}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-[#8B0000] hover:bg-red-800"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-1" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-[#8B0000] transition-colors">
          {document.title}
        </h3>

        {/* Authors */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <User className="w-3 h-3 mr-1" />
          <span className="line-clamp-1">{document.authors.join(", ")}</span>
        </div>

        {/* Adviser */}
        {document.adviser && document.adviser !== 'Unknown Adviser' && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="font-medium mr-1">Adviser:</span>
            <span className="line-clamp-1">{document.adviser}</span>
          </div>
        )}

        {/* Program and Year */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="line-clamp-1">{document.program}</span>
          <span>{document.year}</span>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1 mb-3">
          {document.keywords.slice(0, 2).map((keyword) => (
            <Badge key={keyword} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {document.keywords.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{document.keywords.length - 2}
            </Badge>
          )}
        </div>

        {/* Abstract preview */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {document.abstract}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        {/* Stats */}
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Download className="w-3 h-3 mr-1" />
              {downloadCount}
            </div>
            <div className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {document.pages} pages
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(document.dateAdded).toLocaleDateString()}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}