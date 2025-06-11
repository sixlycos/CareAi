export interface ProcessingStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
  progress?: number
}

export interface OCRResult {
  extractedText: string[]
  confidence: number
  totalSegments: number
} 