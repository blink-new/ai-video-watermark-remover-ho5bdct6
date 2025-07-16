import { useState } from 'react'
import { Download, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface VideoPreviewProps {
  originalFile: File | null
  processedVideoUrl: string | null
  processedVideoBlob: Blob | null
  onReset: () => void
}

export function VideoPreview({ originalFile, processedVideoUrl, processedVideoBlob, onReset }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<'original' | 'processed'>('processed')

  if (!originalFile && !processedVideoUrl) return null

  const handleVideoToggle = () => {
    const video = document.getElementById('preview-video') as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleDownload = () => {
    if (processedVideoBlob) {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(processedVideoBlob)
      link.download = originalFile?.name 
        ? `${originalFile.name.replace(/\.[^/.]+$/, '')}_watermark_removed.webm`
        : 'processed_video.webm'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {processedVideoUrl && (
        <Card className="p-6 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">Watermark Removal Complete!</h3>
              <p className="text-muted-foreground">Your video has been processed successfully. All watermarks have been detected and removed.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Video Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-medium text-foreground">Video Preview</h3>
            {processedVideoUrl && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={currentVideo === 'original' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentVideo('original')}
                  disabled={!originalFile}
                >
                  Original
                </Button>
                <Button
                  variant={currentVideo === 'processed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentVideo('processed')}
                >
                  Processed
                  <Badge className="ml-2 bg-accent text-accent-foreground">New</Badge>
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {processedVideoUrl && (
              <Button onClick={handleDownload} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Process New Video
            </Button>
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            id="preview-video"
            className="w-full h-auto max-h-96 object-contain"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            src={
              currentVideo === 'processed' && processedVideoUrl 
                ? processedVideoUrl 
                : originalFile ? URL.createObjectURL(originalFile) : undefined
            }
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleVideoToggle}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Original Video</h4>
            <div className="space-y-1 text-muted-foreground">
              <p>File: {originalFile?.name}</p>
              <p>Size: {originalFile ? (originalFile.size / (1024 * 1024)).toFixed(2) : '0'} MB</p>
              <p>Type: {originalFile?.type}</p>
            </div>
          </div>
          
          {processedVideoUrl && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Processed Video</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>Status: <span className="text-accent font-medium">Watermarks Removed</span></p>
                <p>Quality: Original maintained</p>
                <p>Format: MP4</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}