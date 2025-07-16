import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, Eye, Zap, Sparkles } from 'lucide-react'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

interface ProcessingStatusProps {
  isProcessing: boolean
  progress: number
  currentStep: string
}

const processingSteps = [
  { id: 'upload', label: 'Uploading video', icon: Loader2, color: 'text-blue-500' },
  { id: 'analyze', label: 'Analyzing frames', icon: Eye, color: 'text-purple-500' },
  { id: 'detect', label: 'Detecting watermarks', icon: Zap, color: 'text-orange-500' },
  { id: 'remove', label: 'Removing watermarks', icon: Sparkles, color: 'text-green-500' },
  { id: 'complete', label: 'Processing complete', icon: CheckCircle, color: 'text-emerald-500' }
]

export function ProcessingStatus({ isProcessing, progress, currentStep }: ProcessingStatusProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  useEffect(() => {
    if (isProcessing) {
      const timer = setInterval(() => {
        setAnimatedProgress(prev => {
          if (prev < progress) {
            return Math.min(prev + 2, progress)
          }
          return prev
        })
      }, 50)
      
      return () => clearInterval(timer)
    }
  }, [progress, isProcessing])

  if (!isProcessing && progress === 0) return null

  const currentStepIndex = processingSteps.findIndex(step => step.id === currentStep)
  const CurrentIcon = processingSteps[currentStepIndex]?.icon || Loader2

  return (
    <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-background to-muted/30">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CurrentIcon 
            className={`w-10 h-10 ${processingSteps[currentStepIndex]?.color || 'text-primary'} ${
              isProcessing && currentStep !== 'complete' ? 'animate-spin' : ''
            }`} 
          />
        </div>
        
        <h3 className="text-2xl font-medium mb-2 text-foreground">
          {processingSteps[currentStepIndex]?.label || 'Processing...'}
        </h3>
        
        <p className="text-muted-foreground">
          AI is analyzing your video frame by frame to detect and remove watermarks
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(animatedProgress)}%</span>
          </div>
          <Progress 
            value={animatedProgress} 
            className="h-3 bg-muted"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {processingSteps.slice(0, -1).map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            const StepIcon = step.icon
            
            return (
              <div 
                key={step.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-300
                  ${isActive ? 'bg-primary/10 border border-primary/20' : ''}
                  ${isCompleted ? 'bg-accent/10' : ''}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-accent text-accent-foreground' : ''}
                  ${isActive ? 'bg-primary/20' : 'bg-muted'}
                `}>
                  <StepIcon 
                    className={`w-4 h-4 ${
                      isCompleted ? 'text-accent-foreground' : 
                      isActive ? step.color : 'text-muted-foreground'
                    } ${isActive && isProcessing ? 'animate-spin' : ''}`} 
                  />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-foreground' : 
                  isCompleted ? 'text-accent-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}