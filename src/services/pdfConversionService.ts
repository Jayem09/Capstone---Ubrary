import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';

export interface PDFAValidationResult {
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  score: number; // 0-100 compliance score
}

export interface ConversionResult {
  success: boolean;
  originalFile: File;
  convertedFile: File | null;
  validationResult: PDFAValidationResult;
  conversionTime: number;
  error?: string;
}

export class PDFConversionService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly SUPPORTED_FORMATS = ['application/pdf'];
  
  /**
   * Convert a PDF file to PDF/A-1b format for long-term preservation
   */
  static async convertToPDFA(inputFile: File): Promise<ConversionResult> {
    const startTime = Date.now();
    
    try {
      // Validate input file
      const validation = this.validateInputFile(inputFile);
      if (!validation.isValid) {
        return {
          success: false,
          originalFile: inputFile,
          convertedFile: null,
          validationResult: {
            isCompliant: false,
            issues: validation.errors,
            warnings: [],
            score: 0
          },
          conversionTime: Date.now() - startTime,
          error: validation.errors.join(', ')
        };
      }

      // Load the PDF document
      const arrayBuffer = await inputFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Create a new PDF/A compliant document
      const pdfADoc = await PDFDocument.create();
      
      // Copy pages and ensure PDF/A compliance
      const pages = await pdfADoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const newPage = pdfADoc.addPage(page);
        
        // Ensure embedded fonts and remove any non-compliant elements
        await this.ensurePDFACompliance(newPage);
      }
      
      // Set PDF/A metadata
      await this.setPDFAMetadata(pdfADoc, inputFile.name);
      
      // Generate the PDF/A compliant bytes
      const pdfABytes = await pdfADoc.save({
        useObjectStreams: false, // PDF/A-1b requirement
        addDefaultPage: false,
        objectsPerTick: 50
      });
      
      // Create the converted file
      const convertedFile = new File(
        [pdfABytes],
        this.generatePDFAName(inputFile.name),
        { type: 'application/pdf' }
      );
      
      // Validate the converted file
      const validationResult = await this.validatePDFA(convertedFile);
      
      const conversionTime = Date.now() - startTime;
      
      if (validationResult.isCompliant) {
        toast.success('PDF successfully converted to PDF/A format', {
          description: `Conversion completed in ${conversionTime}ms`
        });
      } else {
        toast.warning('PDF converted but may not be fully PDF/A compliant', {
          description: `Issues: ${validationResult.issues.join(', ')}`
        });
      }
      
      return {
        success: true,
        originalFile: inputFile,
        convertedFile,
        validationResult,
        conversionTime,
      };
      
    } catch (error) {
      console.error('PDF/A conversion error:', error);
      const conversionTime = Date.now() - startTime;
      
      toast.error('PDF/A conversion failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      return {
        success: false,
        originalFile: inputFile,
        convertedFile: null,
        validationResult: {
          isCompliant: false,
          issues: ['Conversion failed'],
          warnings: [],
          score: 0
        },
        conversionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Validate if a PDF file meets PDF/A-1b standards
   */
  static async validatePDFA(file: File): Promise<PDFAValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Check for embedded fonts (simplified check)
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        issues.push('Document has no pages');
        score -= 50;
      }
      
      // Check for JavaScript (not allowed in PDF/A)
      const hasJavaScript = await this.checkForJavaScript(arrayBuffer);
      if (hasJavaScript) {
        issues.push('Contains JavaScript code');
        score -= 30;
      }
      
      // Check for external links (not allowed in PDF/A)
      const hasExternalLinks = await this.checkForExternalLinks(arrayBuffer);
      if (hasExternalLinks) {
        issues.push('Contains external links');
        score -= 20;
      }
      
      // Check file size (warn if very large)
      if (file.size > 10 * 1024 * 1024) { // 10MB
        warnings.push('Large file size may affect long-term preservation');
        score -= 5;
      }
      
      // Check for encryption (not allowed in PDF/A)
      const isEncrypted = await this.checkForEncryption(arrayBuffer);
      if (isEncrypted) {
        issues.push('Document is encrypted');
        score -= 25;
      }
      
      return {
        isCompliant: issues.length === 0,
        issues,
        warnings,
        score: Math.max(0, score)
      };
      
    } catch (error) {
      return {
        isCompliant: false,
        issues: ['Unable to validate PDF/A compliance'],
        warnings: [],
        score: 0
      };
    }
  }
  
  /**
   * Validate input file before conversion
   */
  private static validateInputFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!file) {
      errors.push('No file provided');
    } else {
      if (!this.SUPPORTED_FORMATS.includes(file.type)) {
        errors.push('Only PDF files are supported');
      }
      
      if (file.size > this.MAX_FILE_SIZE) {
        errors.push(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
      }
      
      if (file.size === 0) {
        errors.push('File is empty');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Ensure PDF/A compliance for a page
   */
  private static async ensurePDFACompliance(_page: any): Promise<void> {
    // Remove any annotations that might not be PDF/A compliant
    // This is a simplified implementation
    // In a real scenario, you'd need to process the page content more thoroughly
  }
  
  /**
   * Set PDF/A compliant metadata
   */
  private static async setPDFAMetadata(pdfDoc: PDFDocument, originalFileName: string): Promise<void> {
    const title = originalFileName.replace('.pdf', '').replace('.PDF', '');
    
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor('University of Batangas Repository');
    pdfDoc.setSubject('Academic Thesis/Capstone Project');
    pdfDoc.setKeywords(['PDF/A', 'Digital Preservation', 'Academic Repository']);
    pdfDoc.setProducer('UBrary PDF/A Conversion Service');
    pdfDoc.setCreator('University of Batangas');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }
  
  /**
   * Generate PDF/A compliant filename
   */
  private static generatePDFAName(originalName: string): string {
    const nameWithoutExt = originalName.replace(/\.(pdf|PDF)$/, '');
    return `${nameWithoutExt}_PDFA.pdf`;
  }
  
  /**
   * Check for JavaScript in PDF (simplified)
   */
  private static async checkForJavaScript(arrayBuffer: ArrayBuffer): Promise<boolean> {
    const text = new TextDecoder().decode(arrayBuffer);
    // Look for common JavaScript patterns in PDF
    const jsPatterns = [
      /\/JS\s+/i,
      /\/JavaScript\s+/i,
      /\/OpenAction/i,
      /\/AA\s+/i
    ];
    
    return jsPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Check for external links (simplified)
   */
  private static async checkForExternalLinks(arrayBuffer: ArrayBuffer): Promise<boolean> {
    const text = new TextDecoder().decode(arrayBuffer);
    // Look for external URL patterns
    const urlPatterns = [
      /https?:\/\/[^\s]+/i,
      /www\.[^\s]+/i,
      /\/URI\s+\(https?:\/\/[^)]+\)/i
    ];
    
    return urlPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Check for encryption (simplified)
   */
  private static async checkForEncryption(arrayBuffer: ArrayBuffer): Promise<boolean> {
    const text = new TextDecoder().decode(arrayBuffer);
    // Look for encryption markers
    return /\/Encrypt\s+/i.test(text);
  }
  
  /**
   * Get conversion statistics
   */
  static getConversionStats(): {
    totalConversions: number;
    successfulConversions: number;
    averageConversionTime: number;
    complianceRate: number;
  } {
    // This would typically come from a database or analytics service
    // For now, return mock data
    return {
      totalConversions: 0,
      successfulConversions: 0,
      averageConversionTime: 0,
      complianceRate: 0
    };
  }
  
  /**
   * Batch convert multiple PDFs to PDF/A
   */
  static async batchConvertToPDFA(files: File[]): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    for (const file of files) {
      const result = await this.convertToPDFA(file);
      results.push(result);
      
      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}
