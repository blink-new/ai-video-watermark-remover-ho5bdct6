import { blink } from '../blink/client'

export interface WatermarkDetection {
  frameIndex: number
  timestamp: number
  boundingBoxes: Array<{
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }>
}

export interface ProcessingProgress {
  stage: 'extracting' | 'analyzing' | 'detecting' | 'removing' | 'reconstructing' | 'complete'
  progress: number
  currentFrame?: number
  totalFrames?: number
  detectedWatermarks?: number
  message: string
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private video: HTMLVideoElement

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.video = document.createElement('video')
  }

  async processVideo(
    file: File,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<Blob> {
    try {
      // Stage 1: Extract frames from video
      onProgress({
        stage: 'extracting',
        progress: 5,
        message: 'Extracting frames from video...'
      })

      const frames = await this.extractFrames(file, onProgress)
      
      // Stage 2: Analyze frames for watermarks
      onProgress({
        stage: 'analyzing',
        progress: 25,
        totalFrames: frames.length,
        message: 'Analyzing frames with AI...'
      })

      const detections = await this.analyzeFramesForWatermarks(frames, onProgress)
      
      // Stage 3: Detect watermark patterns
      onProgress({
        stage: 'detecting',
        progress: 50,
        detectedWatermarks: detections.length,
        message: `Found ${detections.length} watermark instances across ${frames.length} frames`
      })

      // Stage 4: Remove watermarks from affected frames
      onProgress({
        stage: 'removing',
        progress: 70,
        message: 'Removing watermarks using AI inpainting...'
      })

      const cleanedFrames = await this.removeWatermarks(frames, detections, onProgress)
      
      // Stage 5: Reconstruct video
      onProgress({
        stage: 'reconstructing',
        progress: 90,
        message: 'Reconstructing video from cleaned frames...'
      })

      const processedVideo = await this.reconstructVideo(cleanedFrames, file)
      
      onProgress({
        stage: 'complete',
        progress: 100,
        message: 'Video processing complete!'
      })

      return processedVideo
    } catch (error) {
      console.error('Video processing error:', error)
      throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async extractFrames(
    file: File, 
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ImageData[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const frames: ImageData[] = []

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const duration = video.duration
        const frameRate = 30 // Extract 30 frames per second
        const totalFrames = Math.floor(duration * frameRate)
        let currentFrame = 0

        const extractFrame = () => {
          if (currentFrame >= totalFrames) {
            resolve(frames)
            return
          }

          const timestamp = currentFrame / frameRate
          video.currentTime = timestamp

          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            frames.push(imageData)

            currentFrame++
            const progress = 5 + (currentFrame / totalFrames) * 15 // 5-20% progress
            
            onProgress({
              stage: 'extracting',
              progress,
              currentFrame,
              totalFrames,
              message: `Extracting frame ${currentFrame}/${totalFrames}...`
            })

            setTimeout(extractFrame, 10) // Small delay to prevent blocking
          }
        }

        extractFrame()
      }

      video.onerror = () => reject(new Error('Failed to load video'))
      video.src = URL.createObjectURL(file)
    })
  }

  private async analyzeFramesForWatermarks(
    frames: ImageData[], 
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<WatermarkDetection[]> {
    const detections: WatermarkDetection[] = []
    const batchSize = 5 // Process frames in batches to avoid overwhelming the AI

    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, Math.min(i + batchSize, frames.length))
      
      // Convert ImageData to base64 for AI analysis
      const frameImages = await Promise.all(
        batch.map(async (frameData, batchIndex) => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          canvas.width = frameData.width
          canvas.height = frameData.height
          ctx.putImageData(frameData, 0, 0)
          
          return new Promise<string>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader()
                reader.onload = () => {
                  const base64 = (reader.result as string).split(',')[1]
                  resolve(base64)
                }
                reader.readAsDataURL(blob)
              }
            }, 'image/jpeg', 0.8)
          })
        })
      )

      // Analyze each frame for watermarks using AI
      for (let j = 0; j < frameImages.length; j++) {
        const frameIndex = i + j
        const timestamp = frameIndex / 30 // Assuming 30 FPS
        
        try {
          const analysis = await blink.ai.generateText({
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this video frame for watermarks, logos, text overlays, or any branded content that appears to be added on top of the original video content. 
                  
                  Look for:
                  - Text watermarks (company names, websites, copyright notices)
                  - Logo watermarks (brand symbols, icons)
                  - Semi-transparent overlays
                  - Repeated patterns or elements
                  - Any content that appears to be overlaid on the original video
                  
                  Respond with a JSON object containing:
                  {
                    "hasWatermark": boolean,
                    "watermarks": [
                      {
                        "type": "text|logo|overlay",
                        "description": "description of the watermark",
                        "location": "top-left|top-right|bottom-left|bottom-right|center|custom",
                        "boundingBox": {
                          "x": number (0-1, relative position),
                          "y": number (0-1, relative position), 
                          "width": number (0-1, relative size),
                          "height": number (0-1, relative size)
                        },
                        "confidence": number (0-1)
                      }
                    ]
                  }`
                },
                {
                  type: 'image',
                  image: `data:image/jpeg;base64,${frameImages[j]}`
                }
              ]
            }]
          })

          // Parse AI response
          try {
            const result = JSON.parse(analysis.text)
            if (result.hasWatermark && result.watermarks?.length > 0) {
              detections.push({
                frameIndex,
                timestamp,
                boundingBoxes: result.watermarks.map((w: any) => ({
                  x: w.boundingBox.x * frames[frameIndex].width,
                  y: w.boundingBox.y * frames[frameIndex].height,
                  width: w.boundingBox.width * frames[frameIndex].width,
                  height: w.boundingBox.height * frames[frameIndex].height,
                  confidence: w.confidence
                }))
              })
            }
          } catch (parseError) {
            console.warn(`Failed to parse AI response for frame ${frameIndex}:`, parseError)
          }
        } catch (aiError) {
          console.warn(`AI analysis failed for frame ${frameIndex}:`, aiError)
        }

        const progress = 25 + ((frameIndex + 1) / frames.length) * 25 // 25-50% progress
        onProgress({
          stage: 'analyzing',
          progress,
          currentFrame: frameIndex + 1,
          totalFrames: frames.length,
          message: `Analyzing frame ${frameIndex + 1}/${frames.length} for watermarks...`
        })
      }

      // Small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return detections
  }

  private async removeWatermarks(
    frames: ImageData[],
    detections: WatermarkDetection[],
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ImageData[]> {
    const cleanedFrames = [...frames] // Start with original frames
    
    // Group detections by frame for efficient processing
    const detectionsByFrame = new Map<number, WatermarkDetection>()
    detections.forEach(detection => {
      detectionsByFrame.set(detection.frameIndex, detection)
    })

    let processedFrames = 0
    const totalFramesToProcess = detections.length

    for (const [frameIndex, detection] of detectionsByFrame) {
      try {
        // Convert frame to base64 for AI processing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const frameData = frames[frameIndex]
        
        canvas.width = frameData.width
        canvas.height = frameData.height
        ctx.putImageData(frameData, 0, 0)

        const originalImage = await new Promise<string>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1]
                resolve(base64)
              }
              reader.readAsDataURL(blob)
            }
          }, 'image/jpeg', 0.9)
        })

        // Create a mask for the watermark areas
        const maskCanvas = document.createElement('canvas')
        const maskCtx = maskCanvas.getContext('2d')!
        maskCanvas.width = frameData.width
        maskCanvas.height = frameData.height
        
        // Fill with black (areas to keep)
        maskCtx.fillStyle = 'black'
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
        
        // Mark watermark areas in white (areas to inpaint)
        maskCtx.fillStyle = 'white'
        detection.boundingBoxes.forEach(box => {
          maskCtx.fillRect(box.x, box.y, box.width, box.height)
        })

        const maskImage = await new Promise<string>((resolve) => {
          maskCanvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1]
                resolve(base64)
              }
              reader.readAsDataURL(blob)
            }
          }, 'image/jpeg', 0.9)
        })

        // Use AI to inpaint the watermarked areas
        const inpaintPrompt = `Remove the watermarks from this image while preserving the original content underneath. Fill in the watermarked areas naturally to match the surrounding content. Maintain the original image quality and style.`
        
        const { data: inpaintedImages } = await blink.ai.modifyImage({
          images: [`data:image/jpeg;base64,${originalImage}`],
          prompt: inpaintPrompt,
          quality: 'high',
          n: 1
        })

        if (inpaintedImages && inpaintedImages.length > 0) {
          // Convert the inpainted image back to ImageData
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = inpaintedImages[0].url
          })

          const cleanCanvas = document.createElement('canvas')
          const cleanCtx = cleanCanvas.getContext('2d')!
          cleanCanvas.width = frameData.width
          cleanCanvas.height = frameData.height
          cleanCtx.drawImage(img, 0, 0, cleanCanvas.width, cleanCanvas.height)
          
          const cleanedImageData = cleanCtx.getImageData(0, 0, cleanCanvas.width, cleanCanvas.height)
          cleanedFrames[frameIndex] = cleanedImageData
        }

      } catch (error) {
        console.warn(`Failed to remove watermark from frame ${frameIndex}:`, error)
        // Keep original frame if inpainting fails
      }

      processedFrames++
      const progress = 70 + (processedFrames / totalFramesToProcess) * 15 // 70-85% progress
      
      onProgress({
        stage: 'removing',
        progress,
        currentFrame: processedFrames,
        totalFrames: totalFramesToProcess,
        message: `Removing watermarks from frame ${frameIndex + 1}...`
      })
    }

    return cleanedFrames
  }

  private async reconstructVideo(frames: ImageData[], originalFile: File): Promise<Blob> {
    // For this implementation, we'll create a simple video reconstruction
    // In a production environment, you'd use a more sophisticated video encoding library
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      if (frames.length === 0) {
        reject(new Error('No frames to reconstruct'))
        return
      }

      canvas.width = frames[0].width
      canvas.height = frames[0].height

      // Create a MediaRecorder to record the canvas
      const stream = canvas.captureStream(30) // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        resolve(blob)
      }

      mediaRecorder.onerror = (error) => {
        reject(error)
      }

      // Start recording
      mediaRecorder.start()

      // Draw frames at 30 FPS
      let frameIndex = 0
      const drawFrame = () => {
        if (frameIndex >= frames.length) {
          mediaRecorder.stop()
          return
        }

        ctx.putImageData(frames[frameIndex], 0, 0)
        frameIndex++
        
        setTimeout(drawFrame, 1000 / 30) // 30 FPS
      }

      drawFrame()
    })
  }
}