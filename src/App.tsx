import { useState, useEffect } from 'react'
import { Sparkles, Shield, Zap } from 'lucide-react'
import { VideoUploader } from './components/VideoUploader'
import { ProcessingStatus } from './components/ProcessingStatus'
import { VideoPreview } from './components/VideoPreview'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { blink } from './blink/client'
import { VideoProcessor, ProcessingProgress } from './utils/videoProcessor'

interface ProcessingState {
  isProcessing: boolean
  progress: number
  currentStep: string
  currentFrame?: number
  totalFrames?: number
  detectedWatermarks?: number
  message?: string
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null)
  const [processedVideoBlob, setProcessedVideoBlob] = useState<Blob | null>(null)
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    message: ''
  })
  const [processingError, setProcessingError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const processVideo = async (file: File) => {
    setProcessingError(null)
    setProcessedVideoUrl(null)
    setProcessedVideoBlob(null)
    
    try {
      const processor = new VideoProcessor()
      
      const processedBlob = await processor.processVideo(file, (progress: ProcessingProgress) => {
        setProcessingState({
          isProcessing: true,
          progress: progress.progress,
          currentStep: progress.stage,
          currentFrame: progress.currentFrame,
          totalFrames: progress.totalFrames,
          detectedWatermarks: progress.detectedWatermarks,
          message: progress.message
        })
      })
      
      // Create URL for the processed video
      const processedUrl = URL.createObjectURL(processedBlob)
      setProcessedVideoUrl(processedUrl)
      setProcessedVideoBlob(processedBlob)
      
      setProcessingState({
        isProcessing: false,
        progress: 100,
        currentStep: 'complete',
        message: 'Video processing completed successfully!'
      })
      
    } catch (error) {
      console.error('Video processing failed:', error)
      setProcessingError(error instanceof Error ? error.message : 'Processing failed')
      setProcessingState({
        isProcessing: false,
        progress: 0,
        currentStep: '',
        message: 'Processing failed'
      })
    }
  }

  const handleVideoSelect = async (file: File) => {
    setSelectedFile(file)
    await processVideo(file)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setProcessedVideoUrl(null)
    setProcessedVideoBlob(null)
    setProcessingError(null)
    setProcessingState({ 
      isProcessing: false, 
      progress: 0, 
      currentStep: '',
      message: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be signed in to use the AI Video Watermark Remover.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Video Watermark Remover</h1>
                <p className="text-sm text-muted-foreground">Intelligent watermark detection and removal</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-accent/20">
              <Zap className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          {!selectedFile && !processingState.isProcessing && (
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Complete Watermark Removal with AI Precision
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Our advanced AI analyzes every single frame of your video to detect watermarks at any location and timestamp, then intelligently removes them while preserving original video quality.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">Complete Frame Analysis</h3>
                  <p className="text-sm text-muted-foreground">AI analyzes every single frame to detect watermarks at any location, timestamp, or pixel position</p>
                </Card>
                
                <Card className="p-6 text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">Intelligent Removal</h3>
                  <p className="text-sm text-muted-foreground">AI inpainting technology removes watermarks from any screen location while preserving original content</p>
                </Card>
                
                <Card className="p-6 text-center bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">Comprehensive Coverage</h3>
                  <p className="text-sm text-muted-foreground">Detects and removes watermarks regardless of position, size, transparency, or duration in video</p>
                </Card>
              </div>
            </div>
          )}

          {/* Video Upload */}
          {!processingState.isProcessing && !processedVideoUrl && (
            <VideoUploader 
              onVideoSelect={handleVideoSelect}
              isProcessing={processingState.isProcessing}
            />
          )}

          {/* Processing Status */}
          <ProcessingStatus 
            isProcessing={processingState.isProcessing}
            progress={processingState.progress}
            currentStep={processingState.currentStep}
            currentFrame={processingState.currentFrame}
            totalFrames={processingState.totalFrames}
            detectedWatermarks={processingState.detectedWatermarks}
            message={processingState.message}
            error={processingError}
          />

          {/* Video Preview */}
          <VideoPreview 
            originalFile={selectedFile}
            processedVideoUrl={processedVideoUrl}
            processedVideoBlob={processedVideoBlob}
            onReset={handleReset}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">AI Video Watermark Remover - Powered by Advanced Machine Learning</p>
            <p className="text-sm">Process videos with confidence and precision</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App