import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportOperations } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 验证用户身份
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const reportType = formData.get('reportType') as string

    if (!file || !reportType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 上传文件到存储
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('health-reports')
      .upload(fileName, file)

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: '文件上传失败' },
        { status: 500 }
      )
    }

    // 创建报告记录
    const reportData = {
      user_id: user.id,
      title: file.name,
      description: `${reportType}类型医疗报告`,
      file_url: uploadData.path,
      file_type: file.type,
      report_type: reportType as 'modern' | 'tcm' | 'imaging' | 'pathology' | 'mixed',
      status: 'pending' as const,
      upload_date: new Date().toISOString()
    }

    const report = await reportOperations.createReport(reportData)

    return NextResponse.json({
      success: true,
      report,
      message: '报告上传成功'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
} 