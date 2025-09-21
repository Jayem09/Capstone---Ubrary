import React from "react";
import { DocumentCard } from "./DocumentCard";
import { DocumentList } from "./DocumentList";
import { Search } from "lucide-react";
import { useDocuments } from "../hooks/useDocuments";
import type { Document as DBDocument } from "../types/database";

interface DocumentGridProps {
  searchQuery: string;
  category: string;
  viewMode: "grid" | "list";
  onDocumentView: (document: Document) => void;
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

// Convert database document to local document format
function convertDBDocumentToLocal(dbDoc: ExtendedDBDocument): Document {
  // Extract authors from joined data
  const authors = dbDoc.authors?.map(author => 
    `${author.users.first_name} ${author.users.last_name}`
  ) || ['Unknown Author'];

  // Extract adviser name from joined data
  const adviser = dbDoc.adviser ? 
    `${dbDoc.adviser.first_name} ${dbDoc.adviser.last_name}` : 
    'Unknown Adviser';

  // Extract keywords from joined data
  const keywords = dbDoc.keywords?.map(kw => kw.keywords.name) || [];

  // Get primary file for thumbnail and file info
  const primaryFile = dbDoc.files?.find(file => file.is_primary);

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
    thumbnail: "https://images.unsplash.com/photo-1749660354104-9a5ab1225805?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGJvb2tzJTIwYWNhZGVtaWN8ZW58MXx8fHwxNzU4MzY5MzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  };
}

export function DocumentGrid({ searchQuery, category, viewMode, onDocumentView }: DocumentGridProps) {
  const categoryMap: Record<string, string> = {
    'all': '',
    'recent': 'recent',
    'it': 'Information Technology',
    'engineering': 'Engineering',
    'business': 'Business',
    'education': 'Education',
    'nursing': 'Nursing'
  };

  const { documents, loading, error, fetchDocuments, refreshDocuments } = useDocuments({
    search: searchQuery || undefined,
    category: categoryMap[category] || undefined,
    limit: 50,
    autoFetch: false // Disable auto-fetch since we control it manually
  });

  // Initial load on mount
  React.useEffect(() => {
    refreshDocuments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh when search or category changes
  React.useEffect(() => {
    refreshDocuments();
  }, [searchQuery, category]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Search className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading documents</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button 
          onClick={() => fetchDocuments(true)}
          className="px-4 py-2 bg-[#8B0000] text-white rounded-md hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Convert database documents to local format
  const displayDocuments = documents.map(convertDBDocumentToLocal);

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
    return <DocumentList documents={displayDocuments} onDocumentView={onDocumentView} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayDocuments.map((document) => (
        <DocumentCard key={document.id} document={document} onDocumentView={onDocumentView} />
      ))}
    </div>
  );
}