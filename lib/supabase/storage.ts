import { createClient } from '@/lib/supabase/client'

export class HealthStorageService {
  private supabase
  private bucketName = 'health-reports'

  constructor() {
    this.supabase = createClient()
  }

  /**
   * 上传健康报告文件
   * @param file 文件对象
   * @param userId 用户ID
   * @param reportId 报告ID
   */
  async uploadReportFile(file: File, userId: string, reportId: string): Promise<{
    success: boolean
    fileUrl?: string
    error?: string
  }> {
    try {
      // 生成文件路径：用户ID/报告ID/文件名
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${userId}/${reportId}/${fileName}`

      // 上传文件
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('文件上传失败:', error)
        return {
          success: false,
          error: error.message
        }
      }

      // 获取公共URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      return {
        success: true,
        fileUrl: publicUrlData.publicUrl
      }
    } catch (error) {
      console.error('上传过程中发生错误:', error)
      return {
        success: false,
        error: '上传过程中发生未知错误'
      }
    }
  }

  /**
   * 删除报告文件
   * @param filePath 文件路径
   */
  async deleteReportFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('文件删除失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('删除过程中发生错误:', error)
      return false
    }
  }

  /**
   * 获取用户的所有报告文件
   * @param userId 用户ID
   */
  async getUserReportFiles(userId: string): Promise<{
    success: boolean
    files?: any[]
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userId, {
          limit: 100,
          offset: 0
        })

      if (error) {
        console.error('获取文件列表失败:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        files: data
      }
    } catch (error) {
      console.error('获取文件列表过程中发生错误:', error)
      return {
        success: false,
        error: '获取文件列表过程中发生未知错误'
      }
    }
  }

  /**
   * 生成临时下载链接
   * @param filePath 文件路径
   * @param expiresIn 过期时间（秒）
   */
  async createSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{
    success: boolean
    signedUrl?: string
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('生成签名URL失败:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        signedUrl: data.signedUrl
      }
    } catch (error) {
      console.error('生成签名URL过程中发生错误:', error)
      return {
        success: false,
        error: '生成签名URL过程中发生未知错误'
      }
    }
  }

  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          search: filePath
        })

      return !error && data.length > 0
    } catch (error) {
      console.error('检查文件存在性时发生错误:', error)
      return false
    }
  }

  /**
   * 获取文件大小限制（MB）
   */
  getFileSizeLimit(): number {
    return 50 // 50MB
  }

  /**
   * 检查文件类型是否支持
   * @param fileType 文件类型
   */
  isSupportedFileType(fileType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    
    return supportedTypes.includes(fileType)
  }

  /**
   * 验证文件
   * @param file 文件对象
   */
  validateFile(file: File): {
    valid: boolean
    error?: string
  } {
    // 检查文件大小
    const maxSize = this.getFileSizeLimit() * 1024 * 1024 // 转换为字节
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小超过限制（${this.getFileSizeLimit()}MB）`
      }
    }

    // 检查文件类型
    if (!this.isSupportedFileType(file.type)) {
      return {
        valid: false,
        error: '不支持的文件类型，请上传PDF、图片或文档文件'
      }
    }

    return { valid: true }
  }
} 