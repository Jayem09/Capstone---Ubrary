import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Clock,
  Shield,
  Info,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { PDFConversionService } from '../services/pdfConversionService';
import type { PDFAValidationResult, ConversionResult } from '../services/pdfConversionService';
import { toast } from 'sonner';

interface PDFAValidationProps {
  file: File;
  onConversionComplete?: (result: ConversionResult) => void;
  showConvertButton?: boolean;
  className?: string;
}

export function PDFAValidation({ 
  file, 
  onConversionComplete, 
  showConvertButton = true,
  className = '' 
}: PDFAValidationProps) {
  const [validationResult, setValidationResult] = useState<PDFAValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // Auto-validate when file changes
  useEffect(() => {
    if (file) {
      validatePDFA();
    }
  }, [file]);

  const validatePDFA = async () => {
    setIsValidating(true);
    try {
      const result = await PDFConversionService.validatePDFA(file);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate PDF/A compliance');
    } finally {
      setIsValidating(false);
    }
  };

  const convertToPDFA = async () => {
    setIsConverting(true);
    try {
      const result = await PDFConversionService.convertToPDFA(file);
      setConversionResult(result);
      onConversionComplete?.(result);
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to convert to PDF/A');
    } finally {
      setIsConverting(false);
    }
  };

  const getComplianceIcon = () => {
    if (!validationResult) return <Clock className="w-5 h-5 text-gray-400" />;
    
    if (validationResult.isCompliant) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (validationResult.score >= 70) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getComplianceColor = () => {
    if (!validationResult) return 'bg-gray-100 text-gray-800';
    
    if (validationResult.isCompliant) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (validationResult.score >= 70) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getComplianceText = () => {
    if (!validationResult) return 'Validating...';
    
    if (validationResult.isCompliant) {
      return 'PDF/A Compliant';
    } else if (validationResult.score >= 70) {
      return 'Partially Compliant';
    } else {
      return 'Not PDF/A Compliant';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">PDF/A Digital Preservation</h3>
          </div>
          <Badge className={getComplianceColor()}>
            {getComplianceIcon()}
            <span className="ml-1">{getComplianceText()}</span>
          </Badge>
        </div>

        {/* File Info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FileText className="w-8 h-8 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-3">
            {/* Compliance Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Compliance Score</span>
                <span className="font-medium">{validationResult.score}/100</span>
              </div>
              <Progress 
                value={validationResult.score} 
                className="h-2"
              />
            </div>

            {/* Issues */}
            {validationResult.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-700 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  Issues ({validationResult.issues.length})
                </h4>
                <ul className="space-y-1">
                  {validationResult.issues.map((issue, index) => (
                    <li key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-700 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Warnings ({validationResult.warnings.length})
                </h4>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {validationResult.isCompliant && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Document is PDF/A compliant
                  </p>
                  <p className="text-xs text-green-600">
                    Ready for long-term digital preservation
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversion Results */}
        {conversionResult && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <RefreshCw className="w-4 h-4 mr-1" />
                Conversion Results
              </h4>
              
              {conversionResult.success ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Successfully converted to PDF/A
                      </p>
                      <p className="text-xs text-green-600">
                        Conversion time: {conversionResult.conversionTime}ms
                      </p>
                    </div>
                    {conversionResult.convertedFile && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                        onClick={() => {
                          const url = URL.createObjectURL(conversionResult.convertedFile!);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = conversionResult.convertedFile!.name;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    Conversion failed
                  </p>
                  <p className="text-xs text-red-600">
                    {conversionResult.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={validatePDFA}
            disabled={isValidating}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-1" />
                Re-validate
              </>
            )}
          </Button>
          
          {showConvertButton && !validationResult?.isCompliant && (
            <Button
              size="sm"
              onClick={convertToPDFA}
              disabled={isConverting || isValidating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Convert to PDF/A
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium">About PDF/A</p>
            <p>
              PDF/A ensures long-term preservation by embedding fonts, removing external dependencies, 
              and following international archival standards. This guarantees your document will be 
              readable for decades to come.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
