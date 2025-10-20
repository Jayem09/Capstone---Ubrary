import { describe, it, expect, beforeEach } from 'vitest';
import { TitleGeneratorService, type TitleGenerationRequest } from '../titleGeneratorService';

describe('TitleGeneratorService', () => {
  let mockRequest: TitleGenerationRequest;

  beforeEach(() => {
    mockRequest = {
      program: 'Information Technology',
      keywords: ['web development', 'database', 'library management'],
      abstract: 'A comprehensive web application for library management system with database integration',
      authors: ['John Doe', 'Jane Smith'],
      year: 2024,
      adviser: 'Dr. Maria Santos',
      researchArea: 'Web Development',
      methodology: 'Agile Development',
      targetAudience: 'Library Staff'
    };
  });

  describe('generateTitles', () => {
    it('should generate multiple title suggestions', async () => {
      const suggestions = await TitleGeneratorService.generateTitles(mockRequest);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate titles with required properties', async () => {
      const suggestions = await TitleGeneratorService.generateTitles(mockRequest);
      
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('reasoning');
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('keywords');
        expect(suggestion).toHaveProperty('length');
        
        expect(typeof suggestion.title).toBe('string');
        expect(typeof suggestion.confidence).toBe('number');
        expect(typeof suggestion.reasoning).toBe('string');
        expect(typeof suggestion.category).toBe('string');
        expect(Array.isArray(suggestion.keywords)).toBe(true);
        expect(['short', 'medium', 'long']).toContain(suggestion.length);
      });
    });

    it('should generate titles with valid confidence scores', async () => {
      const suggestions = await TitleGeneratorService.generateTitles(mockRequest);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate titles with valid categories', async () => {
      const suggestions = await TitleGeneratorService.generateTitles(mockRequest);
      
      const validCategories = ['academic', 'descriptive', 'innovative', 'traditional'];
      suggestions.forEach(suggestion => {
        expect(validCategories).toContain(suggestion.category);
      });
    });

    it('should handle different programs', async () => {
      const programs = ['Information Technology', 'Engineering', 'Business', 'Education', 'Nursing'];
      
      for (const program of programs) {
        const request = { ...mockRequest, program };
        const suggestions = await TitleGeneratorService.generateTitles(request);
        
        expect(suggestions.length).toBeGreaterThan(0);
        suggestions.forEach(suggestion => {
          expect(suggestion.title).toBeDefined();
          expect(suggestion.title.length).toBeGreaterThan(0);
        });
      }
    });

    it('should handle empty keywords', async () => {
      const request = { ...mockRequest, keywords: [] };
      const suggestions = await TitleGeneratorService.generateTitles(request);
      
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle empty abstract', async () => {
      const request = { ...mockRequest, abstract: '' };
      const suggestions = await TitleGeneratorService.generateTitles(request);
      
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate unique titles', async () => {
      const suggestions = await TitleGeneratorService.generateTitles(mockRequest);
      const titles = suggestions.map(s => s.title);
      const uniqueTitles = new Set(titles);
      
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should sort suggestions by confidence', async () => {
      const suggestions = await TitleGeneratorService.generateTitles(mockRequest);
      
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i-1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });
  });

  describe('analyzeTitle', () => {
    it('should analyze title quality', () => {
      const title = 'Development of Web Application for Library Management System';
      const analysis = TitleGeneratorService.analyzeTitle(title, mockRequest);
      
      expect(analysis).toHaveProperty('quality');
      expect(analysis).toHaveProperty('strengths');
      expect(analysis).toHaveProperty('weaknesses');
      expect(analysis).toHaveProperty('suggestions');
      expect(analysis).toHaveProperty('academicStandards');
      
      expect(typeof analysis.quality).toBe('number');
      expect(Array.isArray(analysis.strengths)).toBe(true);
      expect(Array.isArray(analysis.weaknesses)).toBe(true);
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(typeof analysis.academicStandards).toBe('object');
    });

    it('should return valid quality score', () => {
      const title = 'Development of Web Application for Library Management System';
      const analysis = TitleGeneratorService.analyzeTitle(title, mockRequest);
      
      expect(analysis.quality).toBeGreaterThanOrEqual(0);
      expect(analysis.quality).toBeLessThanOrEqual(100);
    });

    it('should analyze academic standards', () => {
      const title = 'Development of Web Application for Library Management System';
      const analysis = TitleGeneratorService.analyzeTitle(title, mockRequest);
      
      expect(analysis.academicStandards).toHaveProperty('clarity');
      expect(analysis.academicStandards).toHaveProperty('specificity');
      expect(analysis.academicStandards).toHaveProperty('relevance');
      expect(analysis.academicStandards).toHaveProperty('originality');
      
      Object.values(analysis.academicStandards).forEach(score => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle short titles', () => {
      const title = 'Web App';
      const analysis = TitleGeneratorService.analyzeTitle(title, mockRequest);
      
      expect(analysis.quality).toBeDefined();
      expect(analysis.weaknesses.length).toBeGreaterThan(0);
      expect(analysis.weaknesses.some(w => w.includes('short'))).toBe(true);
    });

    it('should handle long titles', () => {
      const title = 'Development of a Comprehensive Web Application for Library Management System with Database Integration and User Authentication';
      const analysis = TitleGeneratorService.analyzeTitle(title, mockRequest);
      
      expect(analysis.quality).toBeDefined();
      expect(analysis.weaknesses.length).toBeGreaterThan(0);
      expect(analysis.weaknesses.some(w => w.includes('long'))).toBe(true);
    });

    it('should handle titles with program context', () => {
      const title = 'Web Application for Information Technology';
      const analysis = TitleGeneratorService.analyzeTitle(title, { 
        ...mockRequest, 
        program: 'Information Technology' 
      });
      
      expect(analysis.academicStandards.specificity).toBeGreaterThan(50);
    });

    it('should handle titles with keywords', () => {
      const title = 'Web Development Application';
      const analysis = TitleGeneratorService.analyzeTitle(title, { 
        ...mockRequest, 
        keywords: ['web development', 'application'] 
      });
      
      expect(analysis.academicStandards.specificity).toBeGreaterThan(50);
    });
  });

  describe('edge cases', () => {
    it('should handle very long abstract', async () => {
      const longAbstract = 'A'.repeat(1000);
      const request = { ...mockRequest, abstract: longAbstract };
      const suggestions = await TitleGeneratorService.generateTitles(request);
      
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle special characters in abstract', async () => {
      const request = { 
        ...mockRequest, 
        abstract: 'Web app with @#$%^&*() characters and émojis 🚀' 
      };
      const suggestions = await TitleGeneratorService.generateTitles(request);
      
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle numeric keywords', async () => {
      const request = { 
        ...mockRequest, 
        keywords: ['web2.0', 'api3', 'html5', 'css3'] 
      };
      const suggestions = await TitleGeneratorService.generateTitles(request);
      
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle titles with special characters', () => {
      const title = 'Web App: Development & Implementation (v2.0)';
      const analysis = TitleGeneratorService.analyzeTitle(title, mockRequest);
      
      expect(analysis.quality).toBeDefined();
      expect(analysis.quality).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance', () => {
    it('should generate titles within reasonable time', async () => {
      const startTime = Date.now();
      await TitleGeneratorService.generateTitles(mockRequest);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should analyze title within reasonable time', () => {
      const title = 'Development of Web Application for Library Management System';
      const startTime = Date.now();
      TitleGeneratorService.analyzeTitle(title, mockRequest);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
