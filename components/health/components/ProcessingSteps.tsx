import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ProcessingStep } from '../types'

interface ProcessingStepsProps {
  steps: ProcessingStep[]
  title: string
}

export function ProcessingSteps({ steps, title }: ProcessingStepsProps) {
  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'processing':
        return 'text-blue-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          {getStepIcon(step.status)}
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${getStepColor(step.status)}`}>
              {step.name}
            </div>
            {step.message && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {step.message}
              </div>
            )}
            {step.status === 'processing' && step.progress !== undefined && (
              <Progress value={step.progress} className="mt-2 h-2" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 