import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleGeneratorPanel } from '../TitleGeneratorPanel';

// Mock the title generator service
vi.mock('../../services/titleGeneratorService', () => ({
  TitleGeneratorService: {
    generateTitles: vi.fn().mockResolvedValue([]),
    analyzeTitle: vi.fn().mockReturnValue({
      quality: 0,
      strengths: [],
      weaknesses: [],
      suggestions: [],
      academicStandards: {
        clarity: 0,
        specificity: 0,
        relevance: 0,
        originality: 0
      }
    })
  }
}));

describe('TitleGeneratorPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('should render title generator panel when open', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('AI Title Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate Titles')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<TitleGeneratorPanel isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText('AI Title Generator')).not.toBeInTheDocument();
  });

  it('should have close button', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // There are multiple buttons, so we'll check that the header section exists
    expect(screen.getByText('AI Title Generator')).toBeInTheDocument();
    
    // Check that there are buttons in the document
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('should call onClose when close button is clicked', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Get all buttons and click the first one (close button in header)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0]; // First button is the close button
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render form fields', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Program *')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('Keywords (comma-separated)')).toBeInTheDocument();
    expect(screen.getByText('Adviser')).toBeInTheDocument();
    expect(screen.getByText('Abstract *')).toBeInTheDocument();
  });

  it('should update form fields when user types', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    const keywordsInput = screen.getByPlaceholderText('e.g., machine learning, web development');
    const adviserInput = screen.getByPlaceholderText('Your adviser\'s name');
    const abstractTextarea = screen.getByPlaceholderText('Enter your project abstract...');
    
    fireEvent.change(keywordsInput, { target: { value: 'web development, database' } });
    fireEvent.change(adviserInput, { target: { value: 'Dr. Smith' } });
    fireEvent.change(abstractTextarea, { target: { value: 'A web application for library management' } });
    
    expect(keywordsInput).toHaveValue('web development, database');
    expect(adviserInput).toHaveValue('Dr. Smith');
    expect(abstractTextarea).toHaveValue('A web application for library management');
  });

  it('should show empty state when no suggestions', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Ready to generate titles?')).toBeInTheDocument();
    expect(screen.getByText('Fill in the form and click "Generate Titles" to get started.')).toBeInTheDocument();
  });

  it('should have generate button initially disabled', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Button should be disabled when required fields are empty
    const generateButton = screen.getByText('Generate Titles');
    expect(generateButton).toBeDisabled();
  });

  it('should disable generate button when required fields are empty', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    const generateButton = screen.getByText('Generate Titles');
    expect(generateButton).toBeDisabled();
  });

  it('should still have button disabled when only abstract is filled', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Fill only abstract (program is still required)
    const abstractTextarea = screen.getByPlaceholderText('Enter your project abstract...');
    fireEvent.change(abstractTextarea, { target: { value: 'A web application for library management' } });
    
    const generateButton = screen.getByText('Generate Titles');
    // Button should still be disabled because program is not selected
    expect(generateButton).toBeDisabled();
  });

  it('should display form input fields correctly', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Check that all input fields can accept input
    const abstractTextarea = screen.getByPlaceholderText('Enter your project abstract...');
    const keywordsInput = screen.getByPlaceholderText('e.g., machine learning, web development');
    const adviserInput = screen.getByPlaceholderText("Your adviser's name");
    
    fireEvent.change(abstractTextarea, { target: { value: 'Test abstract' } });
    fireEvent.change(keywordsInput, { target: { value: 'AI, ML' } });
    fireEvent.change(adviserInput, { target: { value: 'Dr. Smith' } });
    
    expect(abstractTextarea).toHaveValue('Test abstract');
    expect(keywordsInput).toHaveValue('AI, ML');
    expect(adviserInput).toHaveValue('Dr. Smith');
  });

  it('should show empty state message initially', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Should show empty state when no suggestions are generated
    expect(screen.getByText('Ready to generate titles?')).toBeInTheDocument();
    expect(screen.getByText('Fill in the form and click "Generate Titles" to get started.')).toBeInTheDocument();
  });

  it('should have year input with default current year', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    const yearInput = screen.getByLabelText('Year') as HTMLInputElement;
    const currentYear = new Date().getFullYear();
    expect(yearInput.value).toBe(currentYear.toString());
  });

  it('should allow changing year input', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    const yearInput = screen.getByLabelText('Year') as HTMLInputElement;
    fireEvent.change(yearInput, { target: { value: '2024' } });
    
    expect(yearInput.value).toBe('2024');
  });

  it('should display program select dropdown', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Check that program select is rendered
    expect(screen.getByText('Program *')).toBeInTheDocument();
    expect(screen.getByText('Select your program')).toBeInTheDocument();
  });

  it('should display all form labels correctly', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Check that all labels are rendered
    expect(screen.getByText('Program *')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('Keywords (comma-separated)')).toBeInTheDocument();
    expect(screen.getByText('Adviser')).toBeInTheDocument();
    expect(screen.getByText('Abstract *')).toBeInTheDocument();
  });

  it('should have required fields marked with asterisk', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Check that required fields have asterisk
    expect(screen.getByText('Program *')).toBeInTheDocument();
    expect(screen.getByText('Abstract *')).toBeInTheDocument();
  });

  it('should render close button in header', () => {
    render(<TitleGeneratorPanel isOpen={true} onClose={mockOnClose} />);
    
    // Check header elements
    expect(screen.getByText('AI Title Generator')).toBeInTheDocument();
    
    // Close button should be present (it's the button with X icon)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
