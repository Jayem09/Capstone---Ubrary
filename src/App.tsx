import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DocumentGrid } from "./components/DocumentGrid";
import { SearchFilters } from "./components/SearchFilters";
import { DocumentViewer } from "./components/DocumentViewer";
import { UploadDialog } from "./components/UploadDialog";
import { AdminDashboard } from "./components/AdminDashboard";
import { WorkflowDashboard } from "./components/WorkflowDashboard";
import { Toaster } from "./components/ui/sonner";
// import { RoleSwitcher } from "./components/RoleSwitcher";
import { AuthProvider } from "./contexts/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleDocumentView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };

  const handleUploadClick = () => {
    setIsUploadOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role Switcher for Demo - Disabled */}
      {/* <div className="fixed top-16 right-4 z-50">
        <RoleSwitcher />
      </div> */}
      {/* Header */}
      <Header />
      
      <div className="flex relative">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:static
          inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out
          lg:transition-none
        `}>
          <Sidebar 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onUploadClick={handleUploadClick}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 lg:ml-0">
          {selectedCategory === 'admin' ? (
            <AdminDashboard />
          ) : selectedCategory === 'workflow' ? (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Document Workflow</h1>
              <WorkflowDashboard />
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
              />
              
              {/* Document Grid/List */}
              <DocumentGrid 
                searchQuery={searchQuery}
                category={selectedCategory}
                viewMode={viewMode}
                onDocumentView={handleDocumentView}
              />
            </div>
          )}
        </main>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
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
      <AppContent />
    </AuthProvider>
  );
}