import React, { useState, useEffect } from "react";
import { DocumentCard } from "./DocumentCard";
import { DocumentList } from "./DocumentList";
import { Search } from "lucide-react";
import { useDocuments } from "../hooks/useDocuments";
import { DocumentService } from "../services/documentService";
import { StarredService } from "../services/starredService";
import { useAuth } from "../contexts/AuthContext";
import type { Document as DBDocument } from "../types/database";

interface DocumentGridProps {
  searchQuery: string;
  category: string;
  viewMode: "grid" | "list";
  onDocumentView: (document: Document) => void;
  yearFilter?: string;
  programFilter?: string;
  sortBy?: string;
}

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

// Extended database document type with joined data
interface ExtendedDBDocument extends DBDocument {
  authors?: Array<{
    users: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  adviser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  keywords?: Array<{
    keywords: {
      id: string;
      name: string;
    };
  }>;
  files?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: string;
    file_type: string;
    is_primary: boolean;
  }>;
}

// Mock data removed - now using real data from Supabase

// Hook to manage thumbnail URLs
function useThumbnailUrls(documents: ExtendedDBDocument[]) {
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchThumbnailUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const doc of documents) {
        const thumbnailFile = doc.files?.find(file => 
          !file.is_primary && file.file_type.startsWith('image/')
        );
        
        if (thumbnailFile) {
          try {
            const result = await DocumentService.getDocumentFileUrl(thumbnailFile.file_path);
            if (result.data?.signedUrl) {
              urls[doc.id] = result.data.signedUrl;
            }
          } catch (error) {
            console.warn(`Failed to get thumbnail URL for document ${doc.id}:`, error);
          }
        }
      }
      
      setThumbnailUrls(urls);
    };

    if (documents.length > 0) {
      fetchThumbnailUrls();
    }
  }, [documents]);

  return thumbnailUrls;
}

// Convert database document to local document format
function convertDBDocumentToLocal(dbDoc: ExtendedDBDocument, thumbnailUrl?: string): Document {
  // Use author_names field directly if available, otherwise fall back to joined data
  const authors = dbDoc.author_names 
    ? dbDoc.author_names.split(',').map(name => name.trim())
    : (dbDoc.authors?.map(author => 
        `${author.users.first_name} ${author.users.last_name}`
      ) || ['Unknown Author']);

  // Use adviser_name field directly if available, otherwise fall back to joined data
  const adviser = dbDoc.adviser_name || 
    (dbDoc.adviser ? 
      `${dbDoc.adviser.first_name} ${dbDoc.adviser.last_name}` : 
      'Unknown Adviser');

  // Extract keywords from joined data
  const keywords = dbDoc.keywords?.map(kw => kw.keywords.name) || [];

  // Get primary file for file info
  const primaryFile = dbDoc.files?.find(file => file.is_primary);

  // Default fallback thumbnail
  const defaultThumbnail = "https://images.unsplash.com/photo-1749660354104-9a5ab1225805?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGJvb2tzJTIwYWNhZGVtaWN8ZW58MXx8fHwxNzU4MzY5MzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

  return {
    id: dbDoc.id,
    title: dbDoc.title,
    authors,
    year: dbDoc.year,
    program: dbDoc.program,
    adviser,
    abstract: dbDoc.abstract,
    keywords,
    downloadCount: dbDoc.download_count || 0,
    dateAdded: dbDoc.created_at,
    fileSize: primaryFile?.file_size || dbDoc.file_size || 'Unknown',
    pages: dbDoc.pages || 0,
    thumbnail: thumbnailUrl || defaultThumbnail
  };
}

export function DocumentGrid({ 
  searchQuery, 
  category, 
  viewMode, 
  onDocumentView, 
  yearFilter = "all", 
  programFilter = "all", 
  sortBy = "date" 
}: DocumentGridProps) {
  // State to track download count updates
  const [downloadUpdates, setDownloadUpdates] = useState<Record<string, number>>({});
  const [starredDocuments, setStarredDocuments] = useState<ExtendedDBDocument[]>([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [starredError, setStarredError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  const categoryMap: Record<string, string> = {
    'all': '',
    'recent': 'recent',
    'it': 'Information Technology',
    'engineering': 'Engineering',
    'business': 'Business',
    'education': 'Education',
    'nursing': 'Nursing'
  };

  // Determine if we should use starred documents instead of regular documents
  const useStarredDocs = category === 'starred';
  const useMyUploads = category === 'my-uploads';
  
  const { documents, loading, error, fetchDocuments, refreshDocuments } = useDocuments({
    search: searchQuery || undefined,
    category: (useStarredDocs || useMyUploads) ? undefined : (categoryMap[category] || undefined),
    userId: useMyUploads ? user?.id : undefined,
    limit: 50,
    autoFetch: false // Disable auto-fetch since we control it manually
  });

  // Fetch starred documents separately
  const fetchStarredDocuments = async () => {
    if (!useStarredDocs) return;
    
    setStarredLoading(true);
    setStarredError(null);
    
    try {
      const { data, error } = await StarredService.getStarredDocuments(50, 0);
      if (error) {
        setStarredError('Failed to load starred documents');
        setStarredDocuments([]);
      } else {
        // Convert starred documents to the expected format
        const convertedDocs: ExtendedDBDocument[] = data.map((doc: any) => ({
          ...doc,
          // Ensure all required fields are present
          status: doc.status || 'published',
          program: doc.program || 'Unknown',
          year: doc.year || new Date().getFullYear()
        }));
        setStarredDocuments(convertedDocs);
      }
    } catch (err) {
      console.error('Error fetching starred documents:', err);
      setStarredError('Failed to load starred documents');
      setStarredDocuments([]);
    } finally {
      setStarredLoading(false);
    }
  };

  // Get the appropriate documents and loading/error states
  const currentDocuments = useStarredDocs ? starredDocuments : documents;
  const currentLoading = useStarredDocs ? starredLoading : loading;
  const currentError = useStarredDocs ? starredError : error;

  // Get thumbnail URLs for documents
  const thumbnailUrls = useThumbnailUrls(currentDocuments);

  // Initial load on mount
  React.useEffect(() => {
    if (useStarredDocs) {
      fetchStarredDocuments();
    } else {
      refreshDocuments();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh when search, category, or filters change
  React.useEffect(() => {
    if (useStarredDocs) {
      fetchStarredDocuments();
    } else {
      refreshDocuments();
    }
  }, [searchQuery, category, yearFilter, programFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (currentLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading documents...</h3>
        <p className="text-gray-500">Please wait while we fetch the latest documents</p>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Search className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading documents</h3>
        <p className="text-gray-500 mb-4">{currentError}</p>
        <button 
          onClick={() => useStarredDocs ? fetchStarredDocuments() : fetchDocuments(true)}
          className="px-4 py-2 bg-[#8B0000] text-white rounded-md hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle download count updates
  const handleDownloadUpdate = (documentId: string, newCount: number) => {
    setDownloadUpdates(prev => ({
      ...prev,
      [documentId]: newCount
    }));
  };

  // Convert database documents to local format and apply filters
  let displayDocuments = currentDocuments.map(doc => {
    const convertedDoc = convertDBDocumentToLocal(doc, thumbnailUrls[doc.id]);
    // Apply download count updates if available
    if (downloadUpdates[doc.id] !== undefined) {
      convertedDoc.downloadCount = downloadUpdates[doc.id];
    }
    return convertedDoc;
  });

  // Apply year filter
  if (yearFilter && yearFilter !== "all") {
    displayDocuments = displayDocuments.filter(doc => doc.year.toString() === yearFilter);
  }

  // Apply program filter
  if (programFilter && programFilter !== "all") {
    displayDocuments = displayDocuments.filter(doc => doc.program === programFilter);
  }

  // Apply sorting
  displayDocuments = displayDocuments.sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.authors[0]?.localeCompare(b.authors[0] || "") || 0;
      case "downloads":
        return b.downloadCount - a.downloadCount;
      case "date":
      default:
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
  });

  if (displayDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-500">Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <DocumentList 
        documents={displayDocuments} 
        onDocumentView={onDocumentView}
        onDownloadUpdate={handleDownloadUpdate}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayDocuments.map((document) => (
        <DocumentCard 
          key={document.id} 
          document={document} 
          onDocumentView={onDocumentView}
          onDownloadUpdate={handleDownloadUpdate}
        />
      ))}
    </div>
  );
}