import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-[#8B0000]" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Lazy load heavy components
export const LazyDocumentViewer = lazy(() => 
  import('./DocumentViewer').then(module => ({ default: module.DocumentViewer }))
);

export const LazyAdminDashboard = lazy(() => 
  import('./AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);

export const LazyWorkflowDashboard = lazy(() => 
  import('./WorkflowDashboard').then(module => ({ default: module.WorkflowDashboard }))
);

export const LazyAnalyticsDashboard = lazy(() => 
  import('./AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard }))
);

export const LazyUserManagement = lazy(() => 
  import('./UserManagement').then(module => ({ default: module.UserManagement }))
);

export const LazySystemSettings = lazy(() => 
  import('./SystemSettings').then(module => ({ default: module.SystemSettings }))
);

export const LazyUploadDialog = lazy(() => 
  import('./UploadDialog').then(module => ({ default: module.UploadDialog }))
);

export const LazyPDFAValidation = lazy(() => 
  import('./PDFAValidation').then(module => ({ default: module.PDFAValidation }))
);

export const LazyTitleGenerator = lazy(() => 
  import('./TitleGeneratorPanel').then(module => ({ default: module.TitleGeneratorPanel }))
);

export const LazyCurationNotes = lazy(() => 
  import('./CurationNotes').then(module => ({ default: module.CurationNotes }))
);

export const LazyWorkflowHistory = lazy(() => 
  import('./WorkflowHistory').then(module => ({ default: module.WorkflowHistory }))
);

export const LazyDocumentReview = lazy(() => 
  import('./DocumentReview').then(module => ({ default: module.DocumentReview }))
);

export const LazyRevisionRequest = lazy(() => 
  import('./RevisionRequest').then(module => ({ default: module.RevisionRequest }))
);

// Higher-order component for lazy loading with suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
};

// Preload critical components
export const preloadComponents = () => {
  // Preload components that are likely to be used
  import('./DocumentViewer');
  import('./UploadDialog');
  import('./PDFAValidation');
  import('./WorkflowDashboard');
};

// Preload workflow components
export const preloadWorkflowComponents = () => {
  import('./CurationNotes');
  import('./WorkflowHistory');
  import('./DocumentReview');
  import('./RevisionRequest');
};
