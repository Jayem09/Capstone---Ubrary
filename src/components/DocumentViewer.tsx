import { useState, useEffect } from "react";
import { BookOpen, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { DocumentActions } from "./DocumentActions";
import { toast } from "sonner";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import { DocumentService } from "../services/documentService";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker using a local worker to avoid CORS issues
const pdfWorkerInstance = new PdfWorker();
pdfjs.GlobalWorkerOptions.workerPort = pdfWorkerInstance as unknown as Worker;

const FALLBACK_PDF_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMQovS2lkcyBbMyAwIFJdCj4+CmVuZG9iagpAODwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFszIDAgUl0KPj4KZW5kb2JqCgozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDUgMCBSCj4+Cj4+Cj4+CmVuZG9iagoKNSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYgo=';

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
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  // Early return before any hooks to avoid hook order issues
  if (!document) return null;

  const [downloadCount, setDownloadCount] = useState(document.downloadCount || 0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  // Load PDF URL when document changes
  useEffect(() => {
    if (document && isOpen) {
      loadPdfUrl();
    }
  }, [document, isOpen]);

  const loadPdfUrl = async () => {
    setPdfLoading(true);
    setPdfError(null);
    
    try {
      // Try to get the signed URL from Supabase storage
      const result = await DocumentService.getDocumentFileUrl(`documents/${document.id}/${document.id}.pdf`);
      
      if (result.data && result.data.signedUrl) {
        setPdfUrl(result.data.signedUrl);
      } else {
        // If no file found in storage, show error instead of fallback
        console.log('No PDF file found in storage');
        setPdfError('PDF file not found in storage');
        setPdfUrl(null);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      // Show error instead of using external fallback that causes CORS issues
      setPdfError('Failed to load PDF from storage');
      setPdfUrl(null);
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
      
      toast.success(`Downloaded "${document.title}"`, {
        description: "PDF file has been downloaded to your device"
      });
    } catch (error) {
      toast.error("Download failed", {
        description: "Please try again later"
      });
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF document');
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= (numPages || 1)) {
        return newPageNumber;
      }
      return prevPageNumber;
    });
  };

  const changeScale = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3.0, newScale)));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-xl mb-2">{document.title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mb-2">
                View and download the thesis document
              </DialogDescription>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Authors:</strong> {document.authors.join(", ")}
                </div>
                <div>
                  <strong>Adviser:</strong> {document.adviser}
                </div>
                <div className="flex items-center space-x-4">
                  <span><strong>Program:</strong> {document.program}</span>
                  <span><strong>Year:</strong> {document.year}</span>
                  <span><strong>Pages:</strong> {document.pages}</span>
                </div>
              </div>
            </div>
            <DocumentActions 
              onEdit={() => toast.info("Edit document", { description: "Opening document editor..." })}
              onDelete={() => toast.warning("Delete document", { description: "Are you sure you want to delete this document?" })}
              onApprove={() => toast.success("Document approved", { description: "The document has been approved and published" })}
              onReject={() => toast.error("Document rejected", { description: "The document has been rejected and returned to author" })}
              isPending={false}
            />
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-auto">
          {/* Keywords */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {document.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Abstract */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">Abstract</h4>
            <p className="text-gray-700 leading-relaxed">{document.abstract}</p>
          </div>

          {/* PDF Viewer */}
          <div className="bg-gray-100 rounded-lg mb-4 overflow-hidden">
            {pdfLoading ? (
              <div className="p-8 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-pulse" />
                <h4 className="font-medium text-gray-600 mb-2">Loading PDF...</h4>
                <p className="text-sm text-gray-500">Please wait while we load the document</p>
              </div>
            ) : pdfError ? (
              <div className="p-8 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h4 className="font-medium text-red-600 mb-2">Error Loading PDF</h4>
                <p className="text-sm text-gray-500 mb-4">{pdfError}</p>
                <Button onClick={handleDownload} className="bg-[#8B0000] hover:bg-red-800">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF ({document.fileSize})
                </Button>
              </div>
            ) : pdfUrl ? (
              <>
                {/* PDF Controls */}
                <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changePage(-1)}
                      disabled={pageNumber <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pageNumber} of {numPages || '?'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changePage(1)}
                      disabled={pageNumber >= (numPages || 1)}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeScale(scale - 0.2)}
                      disabled={scale <= 0.5}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeScale(scale + 0.2)}
                      disabled={scale >= 3.0}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={rotate}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleDownload} size="sm" className="bg-[#8B0000] hover:bg-red-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* PDF Document */}
                <div className="p-4 bg-gray-200 max-h-96 overflow-auto">
                  <div className="flex justify-center">
                    <PDFDocument
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="p-8 text-center">
                          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-pulse" />
                          <p className="text-sm text-gray-500">Loading PDF...</p>
                        </div>
                      }
                    >
                      <PDFPage
                        pageNumber={pageNumber}
                        scale={scale}
                        rotate={rotation}
                        loading={
                          <div className="bg-white border rounded p-8 text-center">
                            <p className="text-sm text-gray-500">Loading page...</p>
                          </div>
                        }
                      />
                    </PDFDocument>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h4 className="font-medium text-gray-600 mb-2">PDF Preview</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Click download to view the full document
                </p>
                <Button onClick={handleDownload} className="bg-[#8B0000] hover:bg-red-800">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF ({document.fileSize})
                </Button>
              </div>
            )}
          </div>

          {/* Document Stats */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900">{downloadCount}</div>
              <div className="text-gray-500">Downloads</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900">{document.pages}</div>
              <div className="text-gray-500">Pages</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900">{document.fileSize}</div>
              <div className="text-gray-500">File Size</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}