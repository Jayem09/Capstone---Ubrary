import { useState } from 'react';
import { 
  Copy,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { TitleGeneratorService, type TitleGenerationRequest, type TitleSuggestion, type TitleAnalysis } from '../services/titleGeneratorService';

interface TitleGeneratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TitleGeneratorPanel({ isOpen, onClose }: TitleGeneratorPanelProps) {
  const [formData, setFormData] = useState({
    program: '',
    keywords: '',
    abstract: '',
    authors: '',
    year: new Date().getFullYear(),
    adviser: '',
    researchArea: '',
    methodology: '',
    targetAudience: ''
  });

  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysis | null>(null);
  const [, setIsAnalyzing] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateTitles = async () => {
    if (!formData.program || !formData.abstract) {
      toast.error('Please provide program and abstract', {
        description: 'These fields are required for title generation'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const request: TitleGenerationRequest = {
        program: formData.program,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        abstract: formData.abstract,
        authors: formData.authors.split(',').map(a => a.trim()).filter(a => a),
        year: formData.year,
        adviser: formData.adviser || undefined,
        researchArea: formData.researchArea || undefined,
        methodology: formData.methodology || undefined,
        targetAudience: formData.targetAudience || undefined
      };

      const generatedSuggestions = await TitleGeneratorService.generateTitles(request);
      setSuggestions(generatedSuggestions);
      
      toast.success(`Generated ${generatedSuggestions.length} title suggestions`, {
        description: 'Review and select the best option for your capstone project'
      });
    } catch (error) {
      console.error('Title generation error:', error);
      toast.error('Failed to generate titles', {
        description: 'Please try again or check your input'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeTitle = async (title: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = TitleGeneratorService.analyzeTitle(title, {
        program: formData.program,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        abstract: formData.abstract
      });
      setTitleAnalysis(analysis);
    } catch (error) {
      console.error('Title analysis error:', error);
      toast.error('Failed to analyze title');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTitleSelect = (title: string) => {
    setSelectedTitle(title);
    analyzeTitle(title);
    toast.success('Title selected', {
      description: 'You can now use this title for your capstone project'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };


  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'descriptive': return 'bg-green-100 text-green-800';
      case 'innovative': return 'bg-purple-100 text-purple-800';
      case 'traditional': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">AI Title Generator</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Input Form */}
          <div className="w-1/3 border-r p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="program">Program *</Label>
                <Select value={formData.program} onValueChange={(value) => handleInputChange('program', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Nursing">Nursing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                />
              </div>

              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  placeholder="e.g., machine learning, web development"
                />
              </div>

              <div>
                <Label htmlFor="adviser">Adviser</Label>
                <Input
                  id="adviser"
                  value={formData.adviser}
                  onChange={(e) => handleInputChange('adviser', e.target.value)}
                  placeholder="Your adviser's name"
                />
              </div>

              <div>
                <Label htmlFor="abstract">Abstract *</Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => handleInputChange('abstract', e.target.value)}
                  placeholder="Enter your project abstract..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={generateTitles} 
                disabled={isGenerating || !formData.program || !formData.abstract}
                className="w-full bg-[#8B0000] hover:bg-red-800 text-white"
              >
                {isGenerating ? (
                  'Generating...'
                ) : (
                  'Generate Titles'
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 p-6 overflow-y-auto">
            {suggestions.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Titles</h3>
                    <Badge variant="secondary">{suggestions.length} suggestions</Badge>
                  </div>

                  {suggestions.map((suggestion, index) => (
                    <Card key={index} className={`p-4 transition-all ${
                      selectedTitle === suggestion.title 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(suggestion.title)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant={selectedTitle === suggestion.title ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTitleSelect(suggestion.title)}
                            >
                              {selectedTitle === suggestion.title ? (
                                'Selected'
                              ) : (
                                'Select'
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(suggestion.category)}>
                            <span className="capitalize">{suggestion.category}</span>
                          </Badge>
                          
                          <Badge variant="outline" className={getConfidenceColor(suggestion.confidence)}>
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </Badge>
                          
                          <Badge variant="outline">
                            {suggestion.length} length
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                        
                        {suggestion.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {suggestion.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {suggestion.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{suggestion.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium">Ready to generate titles?</p>
                  <p className="text-sm">Fill in the form and click "Generate Titles" to get started.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {titleAnalysis && (
          <div className="border-t p-6 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Title Analysis</h4>
                <Badge variant="secondary">
                  {Math.round(titleAnalysis.quality)}% Quality Score
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {Object.entries(titleAnalysis.academicStandards).map(([standard, score]) => (
                  <div key={standard} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{Math.round(score)}%</div>
                    <div className="text-xs text-gray-600 capitalize">{standard}</div>
                  </div>
                ))}
              </div>

              {titleAnalysis.strengths.length > 0 && (
                <div>
                  <h5 className="font-medium text-green-700 mb-2">
                    Strengths
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {titleAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {titleAnalysis.weaknesses.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-700 mb-2">
                    Areas for Improvement
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {titleAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
