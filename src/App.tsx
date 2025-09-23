import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DocumentGrid } from "./components/DocumentGrid";
import { SearchFilters } from "./components/SearchFilters";
import { DocumentViewer } from "./components/DocumentViewer";
import { UploadDialog } from "./components/UploadDialog";
import { AdminDashboard } from "./components/AdminDashboard";
import { WorkflowDashboard } from "./components/WorkflowDashboard";
import { LoginDialog } from "./components/LoginDialog";
import { RegisterDialog } from "./components/RegisterDialog";
import { Toaster } from "./components/ui/sonner";
import { RoleSwitcher } from "./components/RoleSwitcher";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SidebarStatsProvider } from "./contexts/SidebarStatsContext";
import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "./components/ui/button";

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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedSort, setSelectedSort] = useState("date");

  const handleDocumentView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
    setIsViewerFullscreen(false); // Regular viewer from main app
  };

  const handleUploadClick = () => {
    setIsUploadOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading UBrary...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="mb-6">
              <LogIn className="w-16 h-16 text-[#8B0000] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to UBrary</h2>
              <p className="text-gray-600">
                Sign in to access the University of Batangas Repository for Academic Research and Yields
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => setIsLoginOpen(true)}
                className="w-full bg-[#8B0000] hover:bg-red-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setIsRegisterOpen(true)}
                variant="outline"
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
        
        {/* Login/Register Dialogs */}
        <LoginDialog 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)}
          onShowRegister={() => {
            setIsLoginOpen(false);
            setIsRegisterOpen(true);
          }}
        />
        <RegisterDialog 
          isOpen={isRegisterOpen} 
          onClose={() => setIsRegisterOpen(false)}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role Switcher for Demo - Disabled */}
      {!isViewerFullscreen && (
        <div className="fixed top-16 right-4 z-50">
          <RoleSwitcher />
        </div>
      )}
      {/* Header */}
      {!isViewerFullscreen && <Header />}
      
      <div className="flex relative">
        {/* Mobile Menu Button */}
        {!isViewerFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-[60] bg-white shadow-md hover:bg-gray-50"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        )}

        {/* Mobile Overlay */}
        {!isViewerFullscreen && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[35] lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* Sidebar */}
        {!isViewerFullscreen && (
          <div className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:static
            inset-y-0 left-0 z-[40]
            w-64 bg-white border-r border-gray-200
            transition-transform duration-300 ease-in-out
            lg:transition-none
            overflow-y-auto
          `}>
            <Sidebar 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onUploadClick={handleUploadClick}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}
        
        {/* Main Content */}
        {!isViewerFullscreen && (
          <main className="flex-1 p-4 lg:p-6 lg:ml-0 relative z-0">
            {selectedCategory === 'admin' ? (
              <AdminDashboard />
            ) : selectedCategory === 'workflow' ? (
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Document Workflow</h1>
                <WorkflowDashboard 
                  onDocumentView={(document) => {
                    setSelectedDocument(document);
                    setIsViewerOpen(true);
                    setIsViewerFullscreen(true); // Fullscreen mode for workflow
                  }}
                />
              </div>
            ) : selectedCategory === 'analytics' ? (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Analytics</h1>
              <p className="text-gray-600">Analytics dashboard is available in the Admin Panel.</p>
            </div>
          ) : selectedCategory === 'users' ? (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">User Management</h1>
              <p className="text-gray-600">User management is available in the Admin Panel.</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Search and Filters */}
              <SearchFilters 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onYearFilter={setSelectedYear}
                onProgramFilter={setSelectedProgram}
                onSortChange={setSelectedSort}
                selectedYear={selectedYear}
                selectedProgram={selectedProgram}
                selectedSort={selectedSort}
              />
              
              {/* Document Grid/List */}
              <DocumentGrid 
                searchQuery={searchQuery}
                category={selectedCategory}
                viewMode={viewMode}
                onDocumentView={handleDocumentView}
                yearFilter={selectedYear}
                programFilter={selectedProgram}
                sortBy={selectedSort}
              />
            </div>
          )}
          </main>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={isViewerOpen}
        fullscreen={isViewerFullscreen}
        onClose={() => {
          setIsViewerOpen(false);
          setIsViewerFullscreen(false);
        }}
      />

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarStatsProvider>
        <AppContent />
      </SidebarStatsProvider>
    </AuthProvider>
  );
}