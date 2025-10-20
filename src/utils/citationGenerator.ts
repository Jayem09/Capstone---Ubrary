// Citation Generator Utility
// Generates proper academic citations in various formats

interface DocumentCitation {
  id: string
  title: string
  author_names: string | null
  adviser_name: string | null
  program: string
  year: number
  created_at: string
  published_at: string | null
  pages?: number | null
  university?: string
}

export class CitationGenerator {
  private static readonly DEFAULT_UNIVERSITY = "University of Batangas"

  /**
   * Generate APA citation in simplified format
   * Format: Author, A. A. (Year). Title of the work. Publisher.
   * Example: Rowling, J. K. (1997). Harry Potter and the Philosopher's Stone. Bloomsbury.
   */
  static generateAPA(document: DocumentCitation): string {
    const {
      title,
      author_names,
      year,
      published_at,
      university = this.DEFAULT_UNIVERSITY
    } = document

    // Parse author names
    const authors = this.parseAuthors(author_names)
    const authorString = this.formatAPAAuthors(authors)

    // Format title (keep original capitalization)
    const formattedTitle = title

    // Format publication year
    const pubYear = published_at ? new Date(published_at).getFullYear() : year

    // Simple APA Format: Author, A. A. (Year). Title. Publisher.
    return `${authorString} (${pubYear}). ${formattedTitle}. ${university}.`
  }

  /**
   * Generate MLA 9th Edition citation
   */
  static generateMLA(document: DocumentCitation): string {
    const {
      title,
      author_names,
      adviser_name,
      program,
      year,
      published_at,
      university = this.DEFAULT_UNIVERSITY
    } = document

    const authors = this.parseAuthors(author_names)
    const authorString = this.formatMLAAuthors(authors)
    const formattedTitle = this.formatTitle(title)
    const pubYear = published_at ? new Date(published_at).getFullYear() : year
    const degreeType = this.getDegreeType(program)
    const adviserInfo = adviser_name ? `, supervised by ${adviser_name}` : ""

    // MLA Format: Author. "Title." Year. University, Degree type.
    return `${authorString}. "${formattedTitle}." ${pubYear}. ${university}, ${degreeType}${adviserInfo}.`
  }

  /**
   * Generate Chicago 17th Edition citation
   */
  static generateChicago(document: DocumentCitation): string {
    const {
      title,
      author_names,
      adviser_name,
      program,
      year,
      published_at,
      university = this.DEFAULT_UNIVERSITY
    } = document

    const authors = this.parseAuthors(author_names)
    const authorString = this.formatChicagoAuthors(authors)
    const formattedTitle = this.formatTitle(title)
    const pubYear = published_at ? new Date(published_at).getFullYear() : year
    const degreeType = this.getDegreeType(program)
    const adviserInfo = adviser_name ? ` Supervised by ${adviser_name}.` : ""

    // Chicago Format: Author. "Title." Degree type, University, Year.
    return `${authorString}. "${formattedTitle}." ${degreeType}, ${university}, ${pubYear}.${adviserInfo}`
  }

  /**
   * Generate BibTeX entry
   */
  static generateBibTeX(document: DocumentCitation): string {
    const {
      title,
      author_names,
      adviser_name,
      program,
      year,
      published_at,
      university = this.DEFAULT_UNIVERSITY
    } = document

    const authors = this.parseAuthors(author_names)
    const authorString = authors.join(" and ")
    const pubYear = published_at ? new Date(published_at).getFullYear() : year
    const degreeType = this.getDegreeType(program).toLowerCase()
    const cleanTitle = title.replace(/[{}]/g, "")
    const citeKey = this.generateCiteKey(authors[0] || "unknown", pubYear)

    const adviserField = adviser_name ? `  note = {Supervised by ${adviser_name}},\n` : ""

    return `@${degreeType.includes('master') ? 'mastersthesis' : 'phdthesis'}{${citeKey},
  title = {${cleanTitle}},
  author = {${authorString}},
  year = {${pubYear}},
  school = {${university}},
  type = {${degreeType}},
${adviserField}}`
  }

  /**
   * Parse author names from string
   */
  private static parseAuthors(authorNames: string | null): string[] {
    if (!authorNames) return ["Unknown Author"]
    
    // Split by common delimiters and clean up
    return authorNames
      .split(/[,;&]|\band\b/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map(name => this.formatName(name))
  }

  /**
   * Format name to proper case
   */
  private static formatName(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Format authors for APA style with initials
   * Format: Last, F. I.
   */
  private static formatAPAAuthors(authors: string[]): string {
    if (authors.length === 1) {
      return this.lastFirstInitialsFormat(authors[0])
    } else if (authors.length === 2) {
      return `${this.lastFirstInitialsFormat(authors[0])}, & ${this.lastFirstInitialsFormat(authors[1])}`
    } else {
      const formatted = authors.slice(0, -1).map(author => this.lastFirstInitialsFormat(author))
      return `${formatted.join(', ')}, & ${this.lastFirstInitialsFormat(authors[authors.length - 1])}`
    }
  }

  /**
   * Format authors for MLA style
   */
  private static formatMLAAuthors(authors: string[]): string {
    if (authors.length === 1) {
      return this.lastFirstFormat(authors[0])
    } else if (authors.length === 2) {
      return `${this.lastFirstFormat(authors[0])}, and ${authors[1]}`
    } else {
      const formatted = authors.slice(0, -1).map((author, index) => 
        index === 0 ? this.lastFirstFormat(author) : author
      )
      return `${formatted.join(', ')}, and ${authors[authors.length - 1]}`
    }
  }

  /**
   * Format authors for Chicago style
   */
  private static formatChicagoAuthors(authors: string[]): string {
    if (authors.length === 1) {
      return this.lastFirstFormat(authors[0])
    } else if (authors.length === 2) {
      return `${this.lastFirstFormat(authors[0])}, and ${authors[1]}`
    } else {
      const formatted = authors.slice(0, -1).map((author, index) => 
        index === 0 ? this.lastFirstFormat(author) : author
      )
      return `${formatted.join(', ')}, and ${authors[authors.length - 1]}`
    }
  }

  /**
   * Convert "First Last" to "Last, First" format
   */
  private static lastFirstFormat(name: string): string {
    const parts = name.trim().split(' ')
    if (parts.length < 2) return name
    
    const firstName = parts.slice(0, -1).join(' ')
    const lastName = parts[parts.length - 1]
    return `${lastName}, ${firstName}`
  }

  /**
   * Convert "First Middle Last" to "Last, F. M." format (with initials)
   * Example: "John Ronald Last" -> "Last, J. R."
   */
  private static lastFirstInitialsFormat(name: string): string {
    const parts = name.trim().split(' ')
    if (parts.length < 2) return name
    
    const lastName = parts[parts.length - 1]
    const firstNames = parts.slice(0, -1)
    
    // Get initials from all first/middle names
    const initials = firstNames
      .map(name => name.charAt(0).toUpperCase() + '.')
      .join(' ')
    
    return `${lastName}, ${initials}`
  }

  /**
   * Format title with proper capitalization
   */
  private static formatTitle(title: string): string {
    // Capitalize first word and proper nouns, lowercase others (sentence case for APA)
    return title
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        // Keep acronyms and proper nouns capitalized
        if (word.toUpperCase() === word && word.length > 1) return word
        return word.toLowerCase()
      })
      .join(' ')
  }

  /**
   * Determine degree type from program
   */
  private static getDegreeType(program: string): string {
    const programLower = program.toLowerCase()
    
    if (programLower.includes('master') || programLower.includes('ms') || programLower.includes('ma')) {
      return "Master's thesis"
    } else if (programLower.includes('phd') || programLower.includes('doctoral') || programLower.includes('doctorate')) {
      return "Doctoral dissertation"
    } else {
      // Default to bachelor's thesis for undergraduate programs
      return "Bachelor's thesis"
    }
  }

  /**
   * Generate BibTeX citation key
   */
  private static generateCiteKey(author: string, year: number): string {
    const lastName = author.includes(',') 
      ? author.split(',')[0].trim() 
      : author.split(' ').pop() || 'unknown'
    
    return `${lastName.toLowerCase().replace(/[^a-z]/g, '')}${year}`
  }

  /**
   * Copy citation to clipboard
   */
  static async copyToClipboard(citation: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(citation)
      return true
    } catch (error) {
      console.error('Failed to copy citation:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = citation
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError)
        return false
      }
    }
  }
}
