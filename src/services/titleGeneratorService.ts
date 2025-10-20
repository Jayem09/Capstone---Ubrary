/**
 * AI-Powered Capstone Title Generator Service
 * Generates intelligent, academic-quality titles for thesis and capstone projects
 */

export interface TitleGenerationRequest {
  program: string;
  keywords: string[];
  abstract: string;
  authors: string[];
  year: number;
  adviser?: string;
  researchArea?: string;
  methodology?: string;
  targetAudience?: string;
}

export interface TitleSuggestion {
  title: string;
  confidence: number;
  reasoning: string;
  category: 'academic' | 'descriptive' | 'innovative' | 'traditional';
  keywords: string[];
  length: 'short' | 'medium' | 'long';
}

export interface TitleAnalysis {
  quality: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  academicStandards: {
    clarity: number;
    specificity: number;
    relevance: number;
    originality: number;
  };
}

export class TitleGeneratorService {
  private static readonly PROGRAM_TEMPLATES = {
    'Information Technology': {
      prefixes: ['Development of', 'Implementation of', 'Design and Development of', 'Analysis and Design of'],
      connectors: ['for', 'using', 'based on', 'with'],
      technologies: ['Web Application', 'Mobile Application', 'Desktop Application', 'Database System', 'AI System', 'IoT System'],
      domains: ['E-Learning', 'E-Commerce', 'Healthcare', 'Education', 'Business', 'Finance', 'Security', 'Automation']
    },
    'Engineering': {
      prefixes: ['Design and Analysis of', 'Development of', 'Optimization of', 'Implementation of'],
      connectors: ['for', 'using', 'based on', 'with'],
      technologies: ['Mechanical System', 'Electrical System', 'Control System', 'Robotic System', 'Sensor Network'],
      domains: ['Manufacturing', 'Energy', 'Transportation', 'Construction', 'Environment', 'Safety', 'Quality Control']
    },
    'Business': {
      prefixes: ['Analysis of', 'Study on', 'Evaluation of', 'Assessment of'],
      connectors: ['in', 'for', 'among', 'within'],
      technologies: ['Business Model', 'Management System', 'Marketing Strategy', 'Financial Analysis'],
      domains: ['Small Business', 'Corporate', 'Startup', 'Non-Profit', 'Government', 'Healthcare', 'Education']
    },
    'Education': {
      prefixes: ['Effectiveness of', 'Impact of', 'Implementation of', 'Development of'],
      connectors: ['in', 'for', 'among', 'with'],
      technologies: ['Teaching Method', 'Learning System', 'Educational Tool', 'Assessment Method'],
      domains: ['Elementary', 'Secondary', 'Higher Education', 'Special Education', 'Adult Learning', 'Online Learning']
    },
    'Nursing': {
      prefixes: ['Effectiveness of', 'Impact of', 'Implementation of', 'Development of'],
      connectors: ['in', 'for', 'among', 'with'],
      technologies: ['Care Protocol', 'Intervention Method', 'Assessment Tool', 'Treatment Approach'],
      domains: ['Patient Care', 'Community Health', 'Mental Health', 'Pediatric Care', 'Geriatric Care', 'Emergency Care']
    }
  };

  private static readonly ACADEMIC_PATTERNS = [
    '{prefix} {technology} {connector} {domain} Management',
    '{prefix} {technology} {connector} {domain} System',
    '{prefix} {technology} {connector} {domain} Application',
    '{prefix} {technology} {connector} {domain} Platform',
    '{prefix} {technology} {connector} {domain} Solution',
    '{prefix} {technology} {connector} {domain} Framework',
    '{prefix} {technology} {connector} {domain} Model',
    '{prefix} {technology} {connector} {domain} Tool',
    '{prefix} {technology} {connector} {domain} Method',
    '{prefix} {technology} {connector} {domain} Approach'
  ];

  private static readonly QUALITY_KEYWORDS = [
    'intelligent', 'smart', 'automated', 'efficient', 'effective', 'innovative',
    'advanced', 'modern', 'comprehensive', 'integrated', 'optimized', 'enhanced',
    'adaptive', 'dynamic', 'real-time', 'interactive', 'user-friendly', 'scalable'
  ];

  private static readonly DOMAIN_KEYWORDS = [
    'management', 'system', 'application', 'platform', 'solution', 'framework',
    'model', 'tool', 'method', 'approach', 'strategy', 'protocol', 'technique'
  ];

  /**
   * Generate multiple title suggestions based on input parameters
   */
  static async generateTitles(request: TitleGenerationRequest): Promise<TitleSuggestion[]> {
    const suggestions: TitleSuggestion[] = [];
    
    // Extract key terms from abstract
    const keyTerms = this.extractKeyTerms(request.abstract);
    const programTemplates = this.PROGRAM_TEMPLATES[request.program as keyof typeof this.PROGRAM_TEMPLATES] || 
                           this.PROGRAM_TEMPLATES['Information Technology'];

    // Generate different types of titles
    suggestions.push(...this.generateAcademicTitles(request, keyTerms, programTemplates));
    suggestions.push(...this.generateDescriptiveTitles(request, keyTerms));
    suggestions.push(...this.generateInnovativeTitles(request, keyTerms));
    suggestions.push(...this.generateTraditionalTitles(request, keyTerms));

    // Sort by confidence and remove duplicates
    return this.deduplicateAndSort(suggestions);
  }

  /**
   * Generate academic-style titles
   */
  private static generateAcademicTitles(
    request: TitleGenerationRequest, 
    _keyTerms: string[], 
    templates: any
  ): TitleSuggestion[] {
    const suggestions: TitleSuggestion[] = [];
    
    for (const pattern of this.ACADEMIC_PATTERNS.slice(0, 3)) {
      const prefix = this.randomChoice(templates.prefixes);
      const technology = this.randomChoice(templates.technologies);
      const connector = this.randomChoice(templates.connectors);
      const domain = this.randomChoice(templates.domains);
      
      let title = pattern
        .replace('{prefix}', String(prefix))
        .replace('{technology}', String(technology))
        .replace('{connector}', String(connector))
        .replace('{domain}', String(domain));

      // Enhance with keywords if available
      if (request.keywords.length > 0) {
        const keyword = this.randomChoice(request.keywords);
        title = `${title}: A Case Study on ${keyword}`;
      }

      suggestions.push({
        title: this.capitalizeTitle(title),
        confidence: 0.85,
        reasoning: 'Follows academic title conventions with clear structure and domain specificity',
        category: 'academic',
        keywords: this.extractKeywords(title),
        length: this.categorizeLength(title)
      });
    }

    return suggestions;
  }

  /**
   * Generate descriptive titles
   */
  private static generateDescriptiveTitles(
    request: TitleGenerationRequest, 
    keyTerms: string[]
  ): TitleSuggestion[] {
    const suggestions: TitleSuggestion[] = [];
    
    if (keyTerms.length >= 2) {
      const term1 = keyTerms[0];
      const term2 = keyTerms[1];
      
      suggestions.push({
        title: `${term1} and ${term2}: An Integrated Approach for ${request.program}`,
        confidence: 0.80,
        reasoning: 'Descriptive title highlighting key concepts and their integration',
        category: 'descriptive',
        keywords: [term1, term2, 'integrated approach'],
        length: 'medium'
      });

      suggestions.push({
        title: `Enhancing ${term1} through ${term2}: A ${request.program} Perspective`,
        confidence: 0.75,
        reasoning: 'Focuses on improvement and enhancement of key concepts',
        category: 'descriptive',
        keywords: [term1, term2, 'enhancing'],
        length: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Generate innovative titles
   */
  private static generateInnovativeTitles(
    _request: TitleGenerationRequest, 
    keyTerms: string[]
  ): TitleSuggestion[] {
    const suggestions: TitleSuggestion[] = [];
    
    if (keyTerms.length > 0) {
      const qualityWord = this.randomChoice(this.QUALITY_KEYWORDS);
      const domainWord = this.randomChoice(this.DOMAIN_KEYWORDS);
      const keyTerm = keyTerms[0];

      suggestions.push({
        title: `${qualityWord.charAt(0).toUpperCase() + qualityWord.slice(1)} ${domainWord} for ${keyTerm}: A Modern Approach`,
        confidence: 0.70,
        reasoning: 'Innovative title emphasizing modern solutions and quality improvements',
        category: 'innovative',
        keywords: [qualityWord, domainWord, keyTerm],
        length: 'medium'
      });

      suggestions.push({
        title: `Next-Generation ${keyTerm} ${domainWord}: Leveraging Technology for Better Outcomes`,
        confidence: 0.65,
        reasoning: 'Forward-looking title emphasizing technological advancement',
        category: 'innovative',
        keywords: ['next-generation', keyTerm, domainWord],
        length: 'long'
      });
    }

    return suggestions;
  }

  /**
   * Generate traditional titles
   */
  private static generateTraditionalTitles(
    request: TitleGenerationRequest, 
    keyTerms: string[]
  ): TitleSuggestion[] {
    const suggestions: TitleSuggestion[] = [];
    
    if (keyTerms.length > 0) {
      const keyTerm = keyTerms[0];
      
      suggestions.push({
        title: `A Study on ${keyTerm} in ${request.program}`,
        confidence: 0.90,
        reasoning: 'Traditional academic title format with clear study focus',
        category: 'traditional',
        keywords: [keyTerm, 'study'],
        length: 'short'
      });

      suggestions.push({
        title: `${keyTerm}: An Analysis and Implementation`,
        confidence: 0.85,
        reasoning: 'Classic academic title emphasizing analysis and practical implementation',
        category: 'traditional',
        keywords: [keyTerm, 'analysis', 'implementation'],
        length: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Analyze title quality and provide feedback
   */
  static analyzeTitle(title: string, context: Partial<TitleGenerationRequest>): TitleAnalysis {
    const words = title.split(' ');
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // Length analysis
    if (words.length < 5) {
      weaknesses.push('Title is too short and may lack specificity');
      suggestions.push('Consider adding more descriptive terms or domain context');
    } else if (words.length > 15) {
      weaknesses.push('Title is too long and may be difficult to remember');
      suggestions.push('Consider shortening while maintaining key concepts');
    } else {
      strengths.push('Title length is appropriate for academic standards');
    }

    // Academic standards analysis
    const academicStandards = {
      clarity: this.assessClarity(title),
      specificity: this.assessSpecificity(title, context),
      relevance: this.assessRelevance(title, context),
      originality: this.assessOriginality(title)
    };

    // Overall quality score
    const quality = (academicStandards.clarity + academicStandards.specificity + 
                   academicStandards.relevance + academicStandards.originality) / 4;

    return {
      quality,
      strengths,
      weaknesses,
      suggestions,
      academicStandards
    };
  }

  /**
   * Extract key terms from abstract
   */
  private static extractKeyTerms(abstract: string): string[] {
    // Simple keyword extraction - in a real implementation, you'd use NLP
    const words = abstract.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top 5 most frequent words
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  }

  /**
   * Extract keywords from title
   */
  private static extractKeywords(title: string): string[] {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word))
      .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'must', 'shall', 'it', 'its', 'they', 'them', 'their', 'there',
      'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Categorize title length
   */
  private static categorizeLength(title: string): 'short' | 'medium' | 'long' {
    const wordCount = title.split(' ').length;
    if (wordCount <= 6) return 'short';
    if (wordCount <= 12) return 'medium';
    return 'long';
  }

  /**
   * Capitalize title properly
   */
  private static capitalizeTitle(title: string): string {
    const words = title.split(' ');
    return words.map((word, index) => {
      if (index === 0 || index === words.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Capitalize important words
      const importantWords = ['and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      if (importantWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  /**
   * Random choice from array
   */
  private static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Remove duplicates and sort by confidence
   */
  private static deduplicateAndSort(suggestions: TitleSuggestion[]): TitleSuggestion[] {
    const unique = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.title === suggestion.title)
    );
    
    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Assess title clarity
   */
  private static assessClarity(title: string): number {
    const words = title.split(' ');
    let score = 100;
    
    // Penalize very short or very long titles
    if (words.length < 4) score -= 20;
    if (words.length > 15) score -= 15;
    
    // Check for unclear words
    const unclearWords = ['thing', 'stuff', 'something', 'various', 'different'];
    unclearWords.forEach(word => {
      if (title.toLowerCase().includes(word)) score -= 10;
    });
    
    return Math.max(0, score);
  }

  /**
   * Assess title specificity
   */
  private static assessSpecificity(title: string, context: Partial<TitleGenerationRequest>): number {
    let score = 50;
    
    // Bonus for including program
    if (context.program && title.toLowerCase().includes(context.program.toLowerCase())) {
      score += 20;
    }
    
    // Bonus for including keywords
    if (context.keywords) {
      context.keywords.forEach(keyword => {
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
    }
    
    // Bonus for specific technical terms
    const technicalTerms = ['system', 'application', 'framework', 'methodology', 'algorithm', 'protocol'];
    technicalTerms.forEach(term => {
      if (title.toLowerCase().includes(term)) score += 5;
    });
    
    return Math.min(100, score);
  }

  /**
   * Assess title relevance
   */
  private static assessRelevance(title: string, context: Partial<TitleGenerationRequest>): number {
    let score = 60;
    
    // Check relevance to program
    if (context.program) {
      const programKeywords = this.getProgramKeywords(context.program);
      programKeywords.forEach(keyword => {
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          score += 15;
        }
      });
    }
    
    return Math.min(100, score);
  }

  /**
   * Assess title originality
   */
  private static assessOriginality(title: string): number {
    let score = 70;
    
    // Penalize overly generic terms
    const genericTerms = ['study', 'analysis', 'research', 'investigation'];
    genericTerms.forEach(term => {
      if (title.toLowerCase().includes(term)) score -= 5;
    });
    
    // Bonus for innovative terms
    const innovativeTerms = ['smart', 'intelligent', 'automated', 'innovative', 'advanced', 'next-generation'];
    innovativeTerms.forEach(term => {
      if (title.toLowerCase().includes(term)) score += 10;
    });
    
    return Math.min(100, score);
  }

  /**
   * Get program-specific keywords
   */
  private static getProgramKeywords(program: string): string[] {
    const keywords: Record<string, string[]> = {
      'Information Technology': ['software', 'application', 'system', 'database', 'web', 'mobile', 'ai', 'iot'],
      'Engineering': ['design', 'analysis', 'mechanical', 'electrical', 'control', 'robotic', 'sensor'],
      'Business': ['management', 'strategy', 'marketing', 'finance', 'analysis', 'evaluation'],
      'Education': ['teaching', 'learning', 'education', 'pedagogy', 'curriculum', 'assessment'],
      'Nursing': ['care', 'health', 'patient', 'medical', 'nursing', 'intervention', 'treatment']
    };
    
    return keywords[program] || keywords['Information Technology'];
  }
}
