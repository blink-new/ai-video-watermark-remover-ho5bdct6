import { useState, useCallback } from 'react'
import { Upload, Video, AlertCircle } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void
  isProcessing: boolean
}

export function VideoUploader({ onVideoSelect, isProcessing }: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm']
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, AVI, MOV, MKV, WebM)')
      return false
    }
    
    if (file.size > maxSize) {
      setError('File size must be less than 100MB')
      return false
    }
    
    setError(null)
    return true
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (isProcessing) return
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (validateFile(file)) {
        onVideoSelect(file)
      }
    }
  }, [onVideoSelect, isProcessing])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return
    
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (validateFile(file)) {
        onVideoSelect(file)
      }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card 
        className={`
          relative border-2 border-dashed transition-all duration-300 ease-out
          ${dragActive 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <div className={`
            mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300
            ${dragActive ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'}
          `}>
            {dragActive ? <Upload className="w-8 h-8" /> : <Video className="w-8 h-8" />}
          </div>
          
          <h3 className="text-xl font-medium mb-2 text-foreground">
            {dragActive ? 'Drop your video here' : 'Upload your video'}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            Drag and drop your video file or click to browse
          </p>
          
          <div className="space-y-2 text-sm text-muted-foreground mb-6">
            <p>Supported formats: MP4, AVI, MOV, MKV, WebM</p>
            <p>Maximum file size: 100MB</p>
          </div>
          
          <input
            type="file"
            accept="video/*"
            onChange={handleFileInput}
            disabled={isProcessing}
            className="hidden"
            id="video-upload"
          />
          
          <Button 
            asChild
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg transition-all duration-200"
          >
            <label htmlFor="video-upload" className="cursor-pointer">
              Choose Video File
            </label>
          </Button>
        </div>
      </Card>
      
      {error && (
        <Alert className="mt-4 border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}