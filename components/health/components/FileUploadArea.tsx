import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FileUploadAreaProps {
  file: File | null
  onFileSelect: (file: File) => void
  error?: string | null
  isProcessing?: boolean
}

export function FileUploadArea({ file, onFileSelect, error, isProcessing }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        alert('文件大小不能超过10MB')
        return
      }
      
      const fileType = selectedFile.type
      if (!fileType.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      
      onFileSelect(selectedFile)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-colors rounded-lg p-6">
        {file ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">{file.name}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <Button 
              onClick={triggerFileSelect} 
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isProcessing}
            >
              重新选择文件
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">上传体检报告</p>
                <p className="text-xs text-gray-500">支持 JPG、PNG、PDF，不超过 10MB</p>
              </div>
            </div>
            <Button 
              onClick={triggerFileSelect} 
              className="w-full"
              disabled={isProcessing}
            >
              选择文件
            </Button>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 