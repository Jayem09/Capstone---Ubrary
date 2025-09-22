import { useState } from "react";
import { Upload, FileText, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentUpload } from "../hooks/useDocuments";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const { user } = useAuth();
  const { uploadProgress, error, uploadDocument, resetUpload } = useDocumentUpload();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    adviser: "",
    program: "",
    year: "",
    abstract: "",
    keywords: "",
    file: null as File | null,
    thumbnail: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Invalid file type", {
          description: "Please upload a PDF file only"
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("File too large", {
          description: "File size must be less than 50MB"
        });
        return;
      }
      setFormData({ ...formData, file });
      toast.success("File selected", {
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", {
          description: "Please upload an image file only"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast.error("Image too large", {
          description: "Image size must be less than 5MB"
        });
        return;
      }
      setFormData({ ...formData, thumbnail: file });
      toast.success("Thumbnail selected", {
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.authors || !formData.adviser) {
        toast.error("Required fields missing", {
          description: "Please fill in all required fields"
        });
        return;
      }
    }
    if (step === 2) {
      if (!formData.program || !formData.year || !formData.abstract) {
        toast.error("Required fields missing", {
          description: "Please fill in all required fields"
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.file) {
      toast.error("No file selected", {
        description: "Please upload a PDF file"
      });
      return;
    }

    if (!user) {
      toast.error("Authentication required", {
        description: "Please log in to upload documents"
      });
      return;
    }

    setStep(4); // Upload progress step
    
    try {
      const result = await uploadDocument({
        title: formData.title,
        abstract: formData.abstract,
        program: formData.program,
        year: parseInt(formData.year),
        userId: user.id,
        adviserId: undefined,
        adviserName: formData.adviser.trim() || undefined,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        authors: formData.authors.split(',').map(a => a.trim()).filter(a => a),
        file: formData.file,
        thumbnail: formData.thumbnail || undefined
      });

      if (result.error) {
        toast.error("Upload failed", {
          description: "Please try again later"
        });
        setStep(3); // Go back to file upload step
        return;
      }

      toast.success("Thesis uploaded successfully!", {
        description: "Your submission is now under review by your adviser"
      });

      // Reset form and close
      setFormData({
        title: "",
        authors: "",
        adviser: "",
        program: "",
        year: "",
        abstract: "",
        keywords: "",
        file: null,
        thumbnail: null
      });
      setStep(1);
      resetUpload();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Upload failed", {
        description: "An unexpected error occurred"
      });
      setStep(3); // Go back to file upload step
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-medium mb-4">Basic Information</h3>
            <div>
              <Label htmlFor="title">Thesis Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter your thesis title"
              />
            </div>
            <div>
              <Label htmlFor="authors">Authors *</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="e.g., John Doe, Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="adviser">Thesis Adviser *</Label>
              <Input
                id="adviser"
                value={formData.adviser}
                onChange={(e) => handleInputChange("adviser", e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-medium mb-4">Academic Details</h3>
            <div>
              <Label htmlFor="program">Program *</Label>
              <Select onValueChange={(value) => handleInputChange("program", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bsit">BS Information Technology</SelectItem>
                  <SelectItem value="bscs">BS Computer Science</SelectItem>
                  <SelectItem value="bsee">BS Electrical Engineering</SelectItem>
                  <SelectItem value="bsba">BS Business Administration</SelectItem>
                  <SelectItem value="bsed">Bachelor of Secondary Education</SelectItem>
                  <SelectItem value="bsn">BS Nursing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Academic Year *</Label>
              <Select onValueChange={(value) => handleInputChange("year", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={(e) => handleInputChange("abstract", e.target.value)}
                placeholder="Provide a brief abstract of your thesis"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                placeholder="e.g., Machine Learning, Healthcare, Data Analysis"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="font-medium mb-4">Upload Document & Thumbnail</h3>
            
            {/* PDF Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">PDF Document *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">
                    {formData.file ? "PDF Selected" : "Upload PDF Document"}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    {formData.file 
                      ? `${formData.file.name} (${(formData.file.size / 1024 / 1024).toFixed(2)} MB)`
                      : "Click to browse or drag and drop your PDF file here"
                    }
                  </p>
                  <Button type="button" variant="outline" size="sm">
                    {formData.file ? "Change PDF" : "Browse PDF"}
                  </Button>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 50MB. Only PDF files are accepted.
              </p>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Document Thumbnail (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  {formData.thumbnail ? (
                    <div className="space-y-3">
                      <img 
                        src={URL.createObjectURL(formData.thumbnail)} 
                        alt="Thumbnail preview" 
                        className="w-24 h-32 object-cover mx-auto rounded border"
                      />
                      <p className="text-sm text-gray-600">
                        {formData.thumbnail.name} ({(formData.thumbnail.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <Button type="button" variant="outline" size="sm">
                        Change Thumbnail
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Upload Thumbnail Image</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        Add a custom thumbnail image for your document
                      </p>
                      <Button type="button" variant="outline" size="sm">
                        Browse Images
                      </Button>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 5MB. JPG, PNG, or WebP images accepted.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-[#8B0000] rounded-full flex items-center justify-center">
              {uploadProgress === 100 ? (
                <Check className="w-8 h-8 text-white" />
              ) : (
                <Upload className="w-8 h-8 text-white" />
              )}
            </div>
            <h3 className="font-medium">
              {uploadProgress === 100 ? "Upload Complete!" : "Uploading Document..."}
            </h3>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-500">
              {uploadProgress === 100 
                ? "Your thesis has been uploaded and is now under review"
                : `${uploadProgress}% complete`
              }
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-2">
                Error: {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <FileText className="w-5 h-5 text-[#8B0000]" />
            <span>Upload Thesis</span>
          </DialogTitle>
          <DialogDescription>
            Upload your thesis document and provide the required information for review.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        {step < 4 && (
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step >= stepNum
                      ? "bg-[#8B0000] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 ${
                      step > stepNum ? "bg-[#8B0000]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="min-h-[300px] sm:min-h-[350px]">
          {renderStep()}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              Back
            </Button>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto sm:space-x-2">
            {step < 3 && (
              <Button onClick={handleNext} className="bg-[#8B0000] hover:bg-red-800 w-full sm:w-auto">
                Next
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSubmit} className="bg-[#8B0000] hover:bg-red-800 w-full sm:w-auto">
                Upload Thesis
              </Button>
            )}
            {step === 4 && uploadProgress === 100 && (
              <Button onClick={onClose} className="bg-[#8B0000] hover:bg-red-800 w-full sm:w-auto">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}