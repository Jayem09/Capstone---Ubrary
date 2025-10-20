import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface OptimizedPDFViewerProps {
  file: File | string;
  className?: string;
  onLoadSuccess?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
}

// Memoized PDF page component
const MemoizedPDFPage = memo(({ 
  pageNumber, 
  scale, 
  rotation, 
  onLoadSuccess 
}: {
  pageNumber: number;
  scale: number;
  rotation: number;
  onLoadSuccess?: () => void;
}) => (
  <PDFPage
    pageNumber={pageNumber}
    scale={scale}
    rotate={rotation}
    onLoadSuccess={onLoadSuccess}
    loading={
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B0000]" />
      </div>
    }
    error={
      <div className="flex items-center justify-center h-96 bg-red-50 text-red-600">
        Failed to load page {pageNumber}
      </div>
    }
    className="shadow-lg"
  />
));

export const OptimizedPDFViewer = memo<OptimizedPDFViewerProps>(({
  file,
  className = '',
  onLoadSuccess,
  onLoadError
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Memoize PDF options for better performance
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
    disableAutoFetch: false,
    disableStream: false,
    disableRange: false,
  }), []);

  // Optimized document load success handler
  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    onLoadSuccess?.(numPages);
  }, [onLoadSuccess]);

  // Optimized document load error handler
  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
    setLoadingProgress(0);
    onLoadError?.(error);
  }, [onLoadError]);

  // Optimized page load success handler
  const handlePageLoadSuccess = useCallback(() => {
    // Update progress based on loaded pages
    if (numPages) {
      const progress = (pageNumber / numPages) * 100;
      setLoadingProgress(progress);
    }
  }, [pageNumber, numPages]);

  // Navigation handlers
  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3.0, prev + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  }, []);

  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetView = useCallback(() => {
    setScale(1.0);
    setRotation(0);
    setPageNumber(1);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case 'r':
          rotate();
          break;
        case '0':
          resetView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, rotate, resetView]);

  // Preload adjacent pages for smoother navigation
  const preloadPages = useMemo(() => {
    if (!numPages) return [];
    
    const pages = [];
    const start = Math.max(1, pageNumber - 1);
    const end = Math.min(numPages, pageNumber + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== pageNumber) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [pageNumber, numPages]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-red-50 text-red-600 ${className}`}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Failed to load PDF</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading Progress */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <Progress value={loadingProgress} className="h-1" />
        </div>
      )}

      {/* PDF Document */}
      <div className="relative">
        <PDFDocument
          file={file}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          options={pdfOptions}
          loading={
            <div className="flex items-center justify-center h-96 bg-gray-50">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#8B0000] mx-auto mb-4" />
                <p className="text-gray-600">Loading PDF...</p>
                <Progress value={loadingProgress} className="mt-4 w-64" />
              </div>
            </div>
          }
        >
          {/* Current Page */}
          <div className="flex justify-center mb-4">
            <MemoizedPDFPage
              pageNumber={pageNumber}
              scale={scale}
              rotation={rotation}
              onLoadSuccess={handlePageLoadSuccess}
            />
          </div>

          {/* Preload adjacent pages (hidden) */}
          {preloadPages.map(pageNum => (
            <div key={pageNum} className="hidden">
              <MemoizedPDFPage
                pageNumber={pageNum}
                scale={scale}
                rotation={rotation}
              />
            </div>
          ))}
        </PDFDocument>
      </div>

      {/* Controls */}
      {numPages && (
        <div className="flex items-center justify-between mt-4 p-4 bg-white border rounded-lg shadow-sm">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600 min-w-[100px] text-center">
              {pageNumber} of {numPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={rotate}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
            >
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>Use arrow keys to navigate, +/- to zoom, R to rotate, 0 to reset</p>
      </div>
    </div>
  );
});

OptimizedPDFViewer.displayName = 'OptimizedPDFViewer';
