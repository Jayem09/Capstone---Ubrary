import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Star, 
  MessageSquare, 
 
  Clock,
  User,
  Calendar,
  
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { WorkflowService, type DocumentReview, type ReviewType, type ReviewStatus } from '../services/workflowService'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'


interface DocumentReviewProps {
  documentId: string
  onReviewUpdate?: () => void
}

interface ReviewFormData {
  review_type: ReviewType
  comments: string
  recommendations: string
  score: number
  is_approved: boolean
}

export function DocumentReview({ documentId, onReviewUpdate }: DocumentReviewProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<DocumentReview[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    review_type: 'initial',
    comments: '',
    recommendations: '',
    score: 5,
    is_approved: true
  })

  const fetchReviews = async () => {
    setLoading(true)
    try {
      // This would typically come from a specific endpoint
      // For now, we'll simulate fetching reviews
      const { data, error } = await supabase
        .from('document_reviews')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      setReviews(data || [])
    } catch (error) {
      console.error('Error in fetchReviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [documentId])

  const handleSubmitReview = async () => {
    if (!user) return

    setSubmitting(true)
    try {
      const result = await WorkflowService.createReview({
        document_id: documentId,
        reviewer_id: user.id,
        review_type: reviewForm.review_type,
        comments: reviewForm.comments,
        recommendations: reviewForm.recommendations,
        score: reviewForm.score
      })

      if (result.error) {
        return
      }

      // Reset form and close dialog
      setReviewForm({
        review_type: 'initial',
        comments: '',
        recommendations: '',
        score: 5,
        is_approved: true
      })
      setShowReviewForm(false)
      
      // Refresh reviews
      fetchReviews()
      onReviewUpdate?.()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
    try {
      const result = await WorkflowService.updateReview(reviewId, { status })
      
      if (result.error) {
        return
      }

      fetchReviews()
      onReviewUpdate?.()
    } catch (error) {
      console.error('Error updating review status:', error)
    }
  }

  const getReviewTypeColor = (type: ReviewType) => {
    switch (type) {
      case 'initial': return 'bg-blue-100 text-blue-800'
      case 'revision': return 'bg-orange-100 text-orange-800'
      case 'final': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading reviews...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Document Reviews</span>
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Document Review</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="review_type">Review Type</Label>
                  <Select
                    value={reviewForm.review_type}
                    onValueChange={(value: ReviewType) => 
                      setReviewForm(prev => ({ ...prev, review_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Review</SelectItem>
                      <SelectItem value="revision">Revision Review</SelectItem>
                      <SelectItem value="final">Final Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="score">Rating (1-5 stars)</Label>
                  <div className="flex items-center space-x-1 mt-2">
                    {renderStars(reviewForm.score)}
                    <span className="ml-2 text-sm text-gray-600">
                      {reviewForm.score}/5
                    </span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Button
                        key={score}
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewForm(prev => ({ ...prev, score }))}
                        className={reviewForm.score === score ? 'bg-yellow-100' : ''}
                      >
                        {score}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments">Review Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Provide detailed feedback on the document..."
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Textarea
                    id="recommendations"
                    placeholder="Suggestions for improvement..."
                    value={reviewForm.recommendations}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, recommendations: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="approve"
                      name="decision"
                      checked={reviewForm.is_approved}
                      onChange={() => setReviewForm(prev => ({ ...prev, is_approved: true }))}
                    />
                    <Label htmlFor="approve" className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1 text-green-600" />
                      Approve
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reject"
                      name="decision"
                      checked={!reviewForm.is_approved}
                      onChange={() => setReviewForm(prev => ({ ...prev, is_approved: false }))}
                    />
                    <Label htmlFor="reject" className="flex items-center">
                      <ThumbsDown className="w-4 h-4 mr-1 text-red-600" />
                      Reject
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting || !reviewForm.comments.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500">Be the first to review this document</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getReviewTypeColor(review.review_type)}>
                        {review.review_type}
                      </Badge>
                      <Badge className={getStatusColor(review.status)}>
                        {review.status}
                      </Badge>
                      {review.is_approved !== null && (
                        <Badge className={review.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {review.is_approved ? 'Approved' : 'Rejected'}
                        </Badge>
                      )}
                    </div>
                    
                    {review.status === 'pending' && user?.id === review.reviewer_id && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateReviewStatus(review.id, 'in_progress')}
                        >
                          Start Review
                        </Button>
                      </div>
                    )}
                    
                    {review.status === 'in_progress' && user?.id === review.reviewer_id && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateReviewStatus(review.id, 'completed')}
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Reviewer ID: {review.reviewer_id}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                    {review.score && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {review.score}/5
                      </div>
                    )}
                  </div>

                  {review.comments && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1">Comments</h4>
                      <p className="text-gray-700 text-sm">{review.comments}</p>
                    </div>
                  )}

                  {review.recommendations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Recommendations</h4>
                      <p className="text-gray-700 text-sm">{review.recommendations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
