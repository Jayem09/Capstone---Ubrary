import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  BookOpen, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  X, 
  Share2, 
  Star, 
  StarOff, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Copy, 
  Facebook, 
  Twitter, 
  Mail,
  FileText,
  Quote,
  Check
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import { DocumentService } from "../services/documentService";
import { CitationGenerator } from "../utils/citationGenerator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker properly
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Sample PDF data URL (properly formatted as a string)
const SAMPLE_PDF_DATA = 'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMQovS2lkcyBbMyAwIFJdCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA1IDAgUgo+Pgo+Pgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFNhbXBsZSBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCjUgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzQgMDAwMDAgbiAKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMjc5IDAwMDAwIG4gCjAwMDAwMDAzNzMgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NzAKJSVFT0Y=';

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

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  fullscreen?: boolean; // New prop for fullscreen mode
}

export function DocumentViewer({ document, isOpen, onClose, fullscreen = false }: DocumentViewerProps) {
  const [downloadCount, setDownloadCount] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [showCitation, setShowCitation] = useState(false);
  const [citationFormat, setCitationFormat] = useState<'APA' | 'MLA' | 'Chicago' | 'BibTeX'>('APA');
  const [citationCopied, setCitationCopied] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('scroll');
  const [inputPageNumber, setInputPageNumber] = useState('1');
  const citationPanelRef = useRef<HTMLDivElement>(null);

  // Memoize the PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
  }), []);

  // Memoize callback functions to prevent unnecessary re-renders
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setInputPageNumber('1');
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF document');
  }, []);

  // Update download count when document changes
  useEffect(() => {
    if (document) {
      setDownloadCount(document.downloadCount || 0);
    }
  }, [document]);

  // Handle click outside citation panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citationPanelRef.current && !citationPanelRef.current.contains(event.target as Node)) {
        setShowCitation(false);
      }
    };

    if (showCitation) {
      window.document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCitation]);

  // Load PDF URL when document changes
  useEffect(() => {
    if (document && isOpen) {
      loadPdfUrl();
      // Prevent background scrolling and interaction
      window.document.body.style.overflow = 'hidden';
      window.document.body.style.position = 'fixed';
      window.document.body.style.width = '100%';
      window.document.body.style.height = '100%';
    } else if (!isOpen) {
      // Restore background scrolling when closed
      window.document.body.style.overflow = '';
      window.document.body.style.position = '';
      window.document.body.style.width = '';
      window.document.body.style.height = '';
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (!isOpen) {
        // Reset PDF state when closing
        setPdfUrl(null);
        setNumPages(null);
        setPageNumber(1);
        setPdfError(null);
        setPdfLoading(false);
      }
      // Always restore body styles on cleanup
      window.document.body.style.overflow = '';
      window.document.body.style.position = '';
      window.document.body.style.width = '';
      window.document.body.style.height = '';
    };
  }, [document, isOpen]);

  // Auto-hide toolbar after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      setShowToolbar(true);
      timeout = setTimeout(() => {
        setShowToolbar(false);
      }, 3000);
    };

    if (isOpen) {
      resetTimeout();
      const handleMouseMove = () => resetTimeout();
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [isOpen]);

  // Sync input page number with actual page number
  useEffect(() => {
    setInputPageNumber(pageNumber.toString());
  }, [pageNumber]);

  // Handle escape key to close viewer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.document.addEventListener('keydown', handleEscape);
      return () => window.document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Early return after all hooks
  if (!document) {
    return null;
  }

  const loadPdfUrl = async () => {
    if (!document) return;
    
    console.log('🔍 Loading PDF for document:', document.id);
    setPdfLoading(true);
    setPdfError(null);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF loading timeout')), 10000); // 10 second timeout
      });

      const loadPromise = (async () => {
        const filePathResult = await DocumentService.getDocumentFilePath(document.id);
        
        if (filePathResult.data && filePathResult.data.file_path) {
          const result = await DocumentService.getDocumentFileUrl(filePathResult.data.file_path);
          if (result.data && result.data.signedUrl) {
            console.log('✅ Found PDF at primary path');
            return result.data.signedUrl;
          }
        }
        
        // Fallback paths with shorter timeout per attempt
        const possiblePaths = [
          `documents/${document.id}/${document.id}.pdf`,
          `documents/${document.id}/${document.id}.PDF`,
          `documents/${document.id}/${document.title}.pdf`,
          `documents/${document.id}/${document.title}.PDF`
        ];
        
        for (const filePath of possiblePaths) {
          try {
            console.log('🔍 Trying path:', filePath);
            const result = await Promise.race([
              DocumentService.getDocumentFileUrl(filePath),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Path timeout')), 2000))
            ]) as any;
            if (result?.data && result.data.signedUrl) {
              console.log('✅ Found PDF at fallback path:', filePath);
              return result.data.signedUrl;
            }
          } catch (pathError: any) {
            console.log('❌ Path failed:', filePath, pathError?.message || 'Unknown error');
            continue;
          }
        }
        
        throw new Error('No PDF found');
      })();

      const pdfUrl = await Promise.race([loadPromise, timeoutPromise]);
      setPdfUrl(pdfUrl);
      
    } catch (error: any) {
      console.log('⚠️ PDF loading failed, using sample PDF:', error?.message || 'Unknown error');
      setPdfUrl(SAMPLE_PDF_DATA);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await DocumentService.incrementDownloadCount(document.id);
      setDownloadCount(prev => prev + 1);
      
      if (pdfUrl) {
        const link = window.document.createElement('a');
        link.href = pdfUrl;
        link.download = `${document.title}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
      
      toast.success(`Downloaded "${document.title}"`);
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      if (numPages && newPageNumber >= 1 && newPageNumber <= numPages) {
        return newPageNumber;
      }
      return prevPageNumber;
    });
  };

  const goToPage = (pageNum: number) => {
    if (numPages && pageNum >= 1 && pageNum <= numPages) {
      setPageNumber(pageNum);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputPageNumber(value);
    
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputPageNumber, 10);
      if (!isNaN(pageNum)) {
        goToPage(pageNum);
      } else {
        setInputPageNumber(pageNumber.toString());
      }
    }
  };

  const handlePageInputBlur = () => {
    const pageNum = parseInt(inputPageNumber, 10);
    if (isNaN(pageNum) || !numPages || pageNum < 1 || pageNum > numPages) {
      setInputPageNumber(pageNumber.toString());
    }
  };

  const changeScale = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3.0, newScale)));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleStar = async () => {
    setIsStarred(!isStarred);
    toast.success(
      isStarred ? "Removed from favorites" : "Added to favorites"
    );
  };

  const handleShare = async (type: 'copy' | 'facebook' | 'twitter' | 'linkedin' | 'email') => {
    const url = `${window.location.origin}/documents/${document?.id}`;
    const title = document?.title || 'Document';
    const description = document?.abstract?.slice(0, 150) + '...' || 'Check out this document';

    try {
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`, '_blank');
          break;
      }
    } catch (error) {
      toast.error("Failed to share document");
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success("Opening document for printing");
    } else {
      toast.error("Document not available for printing");
    }
  };

  // Citation generation functions
  const generateCitation = (format: 'APA' | 'MLA' | 'Chicago' | 'BibTeX'): string => {
    try {
      if (!document) {
        return 'No document available for citation generation.';
      }

      const citationData = {
        id: document.id,
        title: document.title || 'Untitled Document',
        author_names: document.authors?.join(', ') || 'Unknown Author',
        adviser_name: document.adviser || null,
        program: document.program || 'Unknown Program',
        year: document.year || new Date().getFullYear(),
        created_at: document.dateAdded || new Date().toISOString(),
        published_at: null, // We don't have publishedAt in the Document interface
        pages: null // We don't have pages in the Document interface
      };

      switch (format) {
        case 'APA':
          return CitationGenerator.generateAPA(citationData);
        case 'MLA':
          return CitationGenerator.generateMLA(citationData);
        case 'Chicago':
          return CitationGenerator.generateChicago(citationData);
        case 'BibTeX':
          return CitationGenerator.generateBibTeX(citationData);
        default:
          return CitationGenerator.generateAPA(citationData);
      }
    } catch (error) {
      console.error('Error generating citation:', error);
      return 'Error generating citation. Please try again.';
    }
  };

  const handleCopyCitation = async () => {
    const citation = generateCitation(citationFormat);
    const success = await CitationGenerator.copyToClipboard(citation);
    
    if (success) {
      setCitationCopied(true);
      toast.success(`${citationFormat} citation copied to clipboard!`);
      setTimeout(() => setCitationCopied(false), 2000);
    } else {
      toast.error("Failed to copy citation");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen bg-black overflow-hidden ${fullscreen ? 'z-[9999]' : 'z-50'}`}
      style={{ 
        width: '100vw', 
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
        zIndex: 999999, // Maximum z-index to ensure it's above everything
        isolation: 'isolate' // Create new stacking context
      }}
      onClick={(e) => e.stopPropagation()} // Prevent any click-through
      onKeyDown={(e) => e.stopPropagation()} // Prevent any key events from bubbling
    >
        {/* Floating Toolbar - Top */}
        <div className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <div className="bg-black/80 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold truncate max-w-md">{document.title}</h1>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {document.year}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Info Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                <Info className="w-5 h-5" />
              </Button>

              {/* Star Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStar}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                {isStarred ? (
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="w-5 h-5" />
                )}
              </Button>

              {/* Citation Button */}
              <div className="relative" ref={citationPanelRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/20"
                  onClick={() => setShowCitation(!showCitation)}
                >
                  <Quote className="w-5 h-5" />
                </Button>
                
                {/* Citation Panel */}
                {showCitation && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/20 z-[9998]"
                      onClick={() => setShowCitation(false)}
                    />
                    {/* Panel */}
                    <div className="fixed top-20 right-4 w-96 max-w-[calc(100vw-2rem)] p-4 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Generate Citation</h3>
                      <button
                        onClick={() => setShowCitation(false)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Format Selection */}
                    <div className="flex flex-wrap gap-2">
                      {(['APA', 'MLA', 'Chicago', 'BibTeX'] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setCitationFormat(format)}
                          className={`text-sm font-medium px-3 py-2 rounded-md border transition-colors ${
                            citationFormat === format 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                    
                    {/* Citation Preview */}
                    <div className="bg-gray-50 p-4 rounded-md border max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">
                        {generateCitation(citationFormat) || 'Loading citation...'}
                      </p>
                    </div>
                    
                    {/* Copy Button */}
                    <button
                      onClick={handleCopyCitation}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md border border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={citationCopied}
                    >
                      {citationCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy {citationFormat} Citation
                        </>
                      )}
                    </button>
                    </div>
                    </div>
                  </>
                )}
              </div>

              {/* Share Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-white/20"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-white/95 backdrop-blur-md border-white/20">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Share this document</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('copy')}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('email')}
                        className="flex items-center space-x-2"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('facebook')}
                        className="flex items-center space-x-2"
                      >
                        <Facebook className="w-3 h-3" />
                        <span>Facebook</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('twitter')}
                        className="flex items-center space-x-2"
                      >
                        <Twitter className="w-3 h-3" />
                        <span>Twitter</span>
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Print Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                <Printer className="w-5 h-5" />
              </Button>

              {/* Download Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                <Download className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Controls - Bottom */}
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}>
          <div className="bg-black/80 backdrop-blur-md text-white px-8 py-4 rounded-t-2xl flex items-center space-x-6 shadow-2xl">
            {/* Navigation Controls - Only show in single page mode */}
            {viewMode === 'single' && (
              <div className="flex items-center space-x-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="text-gray-300 hover:text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="bg-white/20 rounded-lg px-4 py-2 min-w-0 flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputPageNumber}
                    onChange={handlePageInputChange}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={handlePageInputBlur}
                    className="bg-transparent text-sm font-medium w-12 text-center outline-none"
                  />
                  <span className="text-sm font-medium">
                    of {numPages || '?'}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= (numPages || 1)}
                  className="text-gray-300 hover:text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            <div className="w-px h-8 bg-white/30"></div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeScale(scale - 0.2)}
                disabled={scale <= 0.5}
                className="text-gray-300 hover:text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              
              <div className="bg-white/20 rounded-lg px-3 py-2 min-w-0">
                <span className="text-sm font-medium">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeScale(scale + 0.2)}
                disabled={scale >= 3.0}
                className="text-gray-300 hover:text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
            </div>

            <div className="w-px h-8 bg-white/30"></div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'single' ? 'default' : 'ghost'}
                onClick={() => setViewMode('single')}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                Single
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'scroll' ? 'default' : 'ghost'}
                onClick={() => setViewMode('scroll')}
                className="text-gray-300 hover:text-white hover:bg-white/20"
              >
                Scroll
              </Button>
            </div>

            <div className="w-px h-8 bg-white/30"></div>

            {/* Rotate Control */}
            <Button
              size="sm"
              variant="ghost"
              onClick={rotate}
              className="text-gray-300 hover:text-white hover:bg-white/20"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="absolute top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md border-l border-white/20 overflow-y-auto z-40 shadow-2xl">
            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div>
                <h3 className="font-bold text-xl mb-4 text-gray-900">{document.title}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Authors:</span>
                    <p className="text-gray-600 mt-1">{document.authors.join(", ")}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Adviser:</span>
                    <p className="text-gray-600 mt-1">{document.adviser}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold text-gray-700">Program:</span>
                      <p className="text-gray-600 mt-1">{document.program}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Year:</span>
                      <p className="text-gray-600 mt-1">{document.year}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-700">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {document.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Abstract */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-700">Abstract</h4>
                <p className="text-gray-600 leading-relaxed text-sm">{document.abstract}</p>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-700">Statistics</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Downloads</span>
                    </div>
                    <span className="font-bold text-blue-600">{downloadCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Pages</span>
                    </div>
                    <span className="font-bold text-green-600">{document.pages}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">File Size</span>
                    </div>
                    <span className="font-bold text-purple-600">{document.fileSize}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleDownload} 
                  className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  onClick={handlePrint} 
                  variant="outline" 
                  className="w-full border-2"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Document
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main PDF Viewer */}
        <div className="w-full h-full bg-black overflow-hidden">
          {pdfLoading ? (
            <div className="flex items-center justify-center h-full text-center text-white">
              <div>
                <BookOpen className="w-20 h-20 mx-auto text-gray-400 mb-6 animate-pulse" />
                <h4 className="text-xl font-semibold mb-3">Loading PDF...</h4>
                <p className="text-gray-300">Please wait while we load the document</p>
              </div>
            </div>
          ) : pdfError ? (
            <div className="flex items-center justify-center h-full text-center text-white">
              <div>
                <BookOpen className="w-20 h-20 mx-auto text-red-400 mb-6" />
                <h4 className="text-xl font-semibold mb-3">Error Loading PDF</h4>
                <p className="text-gray-300 mb-6">{pdfError}</p>
                <Button 
                  onClick={handleDownload} 
                  className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF ({document.fileSize})
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full overflow-auto">
              <PDFDocument
                key={pdfUrl} // Force re-render when URL changes
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={pdfOptions}
                loading={
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                      <p className="text-sm">Loading PDF...</p>
                    </div>
                  </div>
                }
              >
                {viewMode === 'single' ? (
                  // Single Page View
                  <div className="flex items-center justify-center h-full p-4">
                    <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-full max-h-full">
                      <PDFPage
                        pageNumber={pageNumber}
                        scale={scale}
                        rotate={rotation}
                        loading={
                          <div className="flex items-center justify-center h-96 w-96 bg-gray-100">
                            <p className="text-sm text-gray-500">Loading page...</p>
                          </div>
                        }
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-lg max-w-full max-h-full"
                        onLoadError={(error) => {
                          console.warn('Page load error:', error);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  // Scrollable Multi-Page View
                  <div className="flex flex-col items-center space-y-4 p-4">
                    {numPages && Array.from({ length: numPages }, (_, index) => (
                      <div key={index + 1} className="bg-white shadow-2xl rounded-lg overflow-hidden">
                        <PDFPage
                          pageNumber={index + 1}
                          scale={scale}
                          rotate={rotation}
                          loading={
                            <div className="flex items-center justify-center h-96 w-96 bg-gray-100">
                              <p className="text-sm text-gray-500">Loading page {index + 1}...</p>
                            </div>
                          }
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-lg"
                          onLoadError={(error) => {
                            console.warn(`Page ${index + 1} load error:`, error);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </PDFDocument>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-white">
              <div>
                <BookOpen className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                <h4 className="text-xl font-semibold mb-3">PDF Preview</h4>
                <p className="text-gray-300 mb-6">Click download to view the full document</p>
                <Button 
                  onClick={handleDownload} 
                  className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF ({document.fileSize})
                </Button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}