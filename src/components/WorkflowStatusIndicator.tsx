import React from 'react'
import { Badge } from './ui/badge'
import { 
  Clock, 
  Eye, 
  Edit, 
  CheckCircle, 
  MessageSquare, 
  XCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import type { DocumentStatus } from '../services/workflowService'

interface WorkflowStatusIndicatorProps {
  status: DocumentStatus
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const workflowSteps = [
  { status: 'pending', label: 'Submitted', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { status: 'under_review', label: 'Under Review', icon: Eye, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { status: 'needs_revision', label: 'Needs Revision', icon: Edit, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { status: 'approved', label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  { status: 'curation', label: 'In Curation', icon: MessageSquare, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { status: 'ready_for_publication', label: 'Ready to Publish', icon: CheckCircle, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { status: 'published', label: 'Published', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  { status: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' }
]

const statusDescriptions = {
  pending: 'Document submitted and awaiting initial review',
  under_review: 'Document is being reviewed by faculty members',
  needs_revision: 'Document requires revisions before approval',
  approved: 'Document approved and ready for curation',
  curation: 'Document being prepared for publication by librarians',
  ready_for_publication: 'Document ready for final publication',
  published: 'Document published and available to the public',
  rejected: 'Document rejected and not suitable for publication'
}

export function WorkflowStatusIndicator({ 
  status, 
  showProgress = false, 
  size = 'md',
  className = '' 
}: WorkflowStatusIndicatorProps) {
  const currentStep = workflowSteps.find(step => step.status === status)
  const currentIndex = workflowSteps.findIndex(step => step.status === status)
  
  if (!currentStep) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Unknown Status
      </Badge>
    )
  }

  const Icon = currentStep.icon
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  if (!showProgress) {
    return (
      <Badge 
        className={`${currentStep.color} ${sizeClasses[size]} ${className}`}
        title={statusDescriptions[status]}
      >
        <Icon className={`${iconSizes[size]} mr-1`} />
        {currentStep.label}
      </Badge>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Current Status Badge */}
      <Badge 
        className={`${currentStep.color} ${sizeClasses[size]}`}
        title={statusDescriptions[status]}
      >
        <Icon className={`${iconSizes[size]} mr-1`} />
        {currentStep.label}
      </Badge>

      {/* Progress Bar */}
      <div className="flex items-center space-x-1">
        {workflowSteps.slice(0, 6).map((step, index) => {
          const StepIcon = step.icon
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          // const _isPending = index > currentIndex

          return (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-gray-200 border-gray-300 text-gray-500'
                    }
                  `}
                  title={step.label}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-600 mt-1 hidden sm:block">
                  {step.label}
                </span>
              </div>
              
              {index < 5 && (
                <ArrowRight 
                  className={`w-4 h-4 ${
                    isCompleted ? 'text-green-500' : 'text-gray-300'
                  }`} 
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Status Description */}
      <p className="text-sm text-gray-600 mt-2">
        {statusDescriptions[status]}
      </p>
    </div>
  )
}

// Compact version for use in lists and cards
export function WorkflowStatusBadge({ 
  status, 
  size = 'sm',
  className = '' 
}: Omit<WorkflowStatusIndicatorProps, 'showProgress'>) {
  return (
    <WorkflowStatusIndicator 
      status={status} 
      size={size} 
      className={className}
      showProgress={false}
    />
  )
}

// Progress bar component for detailed views
export function WorkflowProgressBar({ 
  status, 
  className = '' 
}: Omit<WorkflowStatusIndicatorProps, 'showProgress' | 'size'>) {
  return (
    <WorkflowStatusIndicator 
      status={status} 
      showProgress={true}
      size="md"
      className={className}
    />
  )
}
