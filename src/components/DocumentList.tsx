import { Download, Eye, Star, Calendar, User, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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
}

export function DocumentList({ documents, onDocumentView }: DocumentListProps) {
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
        {documents.map((document) => (
          <div key={document.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Document Info */}
              <div className="col-span-5 flex items-center space-x-3">
                <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
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
                  {document.downloadCount}
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
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Star className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#8B0000] hover:text-red-800">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}