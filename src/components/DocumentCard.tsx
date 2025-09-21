import { Download, Eye, Star, Calendar, User, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { useState } from "react";

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
}

export function DocumentCard({ document, onDocumentView }: DocumentCardProps) {
  const [isStarred, setIsStarred] = useState(false);

  const handleView = () => {
    onDocumentView(document);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Downloaded "${document.title}"`, {
      description: "PDF file has been downloaded to your device"
    });
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
    toast.success(isStarred ? "Removed from starred" : "Added to starred");
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        <ImageWithFallback
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
          >
            <Star className={`w-4 h-4 ${isStarred ? "fill-yellow-500" : ""}`} />
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
          >
            <Download className="w-4 h-4 mr-1" />
            Download
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
              {document.downloadCount}
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