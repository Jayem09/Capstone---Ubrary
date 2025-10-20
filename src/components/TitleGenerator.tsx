import { useState } from 'react';
import { 
  Lightbulb, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Star,
  Copy,
  Sparkles,
  Target,
  BookOpen,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { TitleGeneratorService, type TitleGenerationRequest, type TitleSuggestion, type TitleAnalysis } from '../services/titleGeneratorService';

interface TitleGeneratorProps {
  onTitleSelect?: (title: string) => void;
  initialData?: Partial<TitleGenerationRequest>;
  className?: string;
}

export function TitleGenerator({ onTitleSelect, initialData, className = '' }: TitleGeneratorProps) {
  const [formData, setFormData] = useState({
    program: initialData?.program || '',
    keywords: initialData?.keywords?.join(', ') || '',
    abstract: initialData?.abstract || '',
    authors: initialData?.authors?.join(', ') || '',
    year: initialData?.year || new Date().getFullYear(),
    adviser: initialData?.adviser || '',
    researchArea: initialData?.researchArea || '',
    methodology: initialData?.methodology || '',
    targetAudience: initialData?.targetAudience || ''
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
    onTitleSelect?.(title);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <BookOpen className="w-4 h-4" />;
      case 'descriptive': return <Target className="w-4 h-4" />;
      case 'innovative': return <Zap className="w-4 h-4" />;
      case 'traditional': return <Star className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
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

  return (
    <div className={`space-y-6 bg-white ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-gray-900">AI Title Generator</h3>
        </div>
        <p className="text-gray-600">
          Generate intelligent, academic-quality titles for your capstone project
        </p>
      </div>

      {/* Input Form */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="e.g., machine learning, web development, database"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adviser">Adviser</Label>
            <Input
              id="adviser"
              value={formData.adviser}
              onChange={(e) => handleInputChange('adviser', e.target.value)}
              placeholder="Your adviser's name"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="abstract">Abstract *</Label>
            <Textarea
              id="abstract"
              value={formData.abstract}
              onChange={(e) => handleInputChange('abstract', e.target.value)}
              placeholder="Enter your project abstract or description..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Provide a detailed description of your project to generate better title suggestions
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button 
            onClick={generateTitles} 
            disabled={isGenerating || !formData.program || !formData.abstract}
            className="px-8"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4 mr-2" />
                Generate Titles
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Title Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Generated Titles</h4>
            <Badge variant="secondary">{suggestions.length} suggestions</Badge>
          </div>

          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                  selectedTitle === suggestion.title 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-2">{suggestion.title}</h5>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(suggestion.category)}>
                        {getCategoryIcon(suggestion.category)}
                        <span className="ml-1 capitalize">{suggestion.category}</span>
                      </Badge>
                      
                      <Badge variant="outline" className={getConfidenceColor(suggestion.confidence)}>
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                      
                      <Badge variant="outline">
                        {suggestion.length} length
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{suggestion.reasoning}</p>
                    
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

                  <div className="flex items-center gap-2 ml-4">
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
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Title Analysis */}
      {titleAnalysis && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Title Analysis</h4>
            <Badge variant="secondary">
              {Math.round(titleAnalysis.quality)}% Quality Score
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Quality Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Quality</span>
                <span className="text-sm text-gray-600">{Math.round(titleAnalysis.quality)}%</span>
              </div>
              <Progress value={titleAnalysis.quality} className="h-2" />
            </div>

            {/* Academic Standards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(titleAnalysis.academicStandards).map(([standard, score]) => (
                <div key={standard} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(score)}%</div>
                  <div className="text-xs text-gray-600 capitalize">{standard}</div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Strengths */}
            {titleAnalysis.strengths.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
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

            {/* Weaknesses */}
            {titleAnalysis.weaknesses.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
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

            {/* Suggestions */}
            {titleAnalysis.suggestions.length > 0 && (
              <div>
                <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Suggestions
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {titleAnalysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
