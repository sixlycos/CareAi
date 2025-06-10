/**
 * 调试辅助工具 - 帮助排查OCR和AI调用问题
 */

export class DebugHelper {
  static logOCRTextArray(textArray: string[], prefix: string = 'OCR文本数组') {
    console.group(`🔍 ${prefix}`)
    console.log('数组长度:', textArray.length)
    console.log('原始数组:', textArray)
    
    const joinedText = textArray.join('\n')
    console.log('拼接后文本长度:', joinedText.length)
    console.log('拼接后文本预览:', joinedText.substring(0, 500) + (joinedText.length > 500 ? '...' : ''))
    
    // 检查是否包含健康指标关键词
    const healthKeywords = [
      'WBC', '白细胞', 'RBC', '红细胞', '血红蛋白', 'HGB', 
      '血小板', 'PLT', '胆固醇', 'TC', 'TG', 'HDL', 'LDL',
      'ALT', 'AST', '胆红素', '白蛋白', 'ALB', 'BUN', 
      '肌酐', 'Cr', '尿酸', 'UA', '血糖', 'FBG', 'HbA1c'
    ]
    
    const foundKeywords = healthKeywords.filter(keyword => 
      joinedText.toUpperCase().includes(keyword.toUpperCase())
    )
    
    console.log('检测到的健康指标关键词:', foundKeywords)
    console.groupEnd()
    
    return joinedText
  }

  static logAIResponse(response: string, prefix: string = 'AI响应') {
    console.group(`🤖 ${prefix}`)
    console.log('响应长度:', response.length)
    console.log('原始响应:', response)
    
    // 检查是否包含JSON
    const hasJSON = response.includes('{') && response.includes('}')
    console.log('包含JSON:', hasJSON)
    
    if (hasJSON) {
      const jsonStart = response.indexOf('{')
      const jsonEnd = response.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonPart = response.substring(jsonStart, jsonEnd + 1)
        console.log('提取的JSON部分:', jsonPart)
        
        try {
          const parsed = JSON.parse(jsonPart)
          console.log('JSON解析成功:', parsed)
        } catch (e) {
          console.error('JSON解析失败:', e)
        }
      }
    }
    
    // 检查是否包含markdown代码块
    if (response.includes('```')) {
      console.log('包含markdown代码块')
      const matches = response.match(/```[\s\S]*?```/g)
      if (matches) {
        console.log('代码块内容:', matches)
      }
    }
    
    console.groupEnd()
  }

  static validateTextArrayForAI(textArray: string[]): { isValid: boolean, issues: string[] } {
    const issues: string[] = []
    
    if (!textArray || textArray.length === 0) {
      issues.push('文本数组为空')
      return { isValid: false, issues }
    }
    
    // 检查是否有实际内容
    const nonEmptyTexts = textArray.filter(text => text && text.trim().length > 0)
    if (nonEmptyTexts.length === 0) {
      issues.push('所有文本项都为空')
    }
    
    // 检查文本总长度
    const totalLength = textArray.join('\n').length
    if (totalLength < 50) {
      issues.push(`文本总长度过短: ${totalLength}字符`)
    }
    
    if (totalLength > 10000) {
      issues.push(`文本总长度过长: ${totalLength}字符，可能超出AI处理能力`)
    }
    
    // 检查是否包含无意义的重复内容
    const uniqueTexts = new Set(textArray.map(t => t.trim()))
    if (uniqueTexts.size < textArray.length * 0.5) {
      issues.push('包含大量重复文本')
    }
    
    // 检查是否可能是体检报告
    const joinedText = textArray.join('\n').toLowerCase()
    const healthRelatedWords = [
      '检查', '报告', '结果', '正常', '异常', '数值', '范围',
      '血', '尿', '肝', '肾', '心', '肺', '胆固醇', '血糖',
      'wbc', 'rbc', 'hgb', 'plt', 'alt', 'ast'
    ]
    
    const foundHealthWords = healthRelatedWords.filter(word => joinedText.includes(word))
    if (foundHealthWords.length < 3) {
      issues.push(`疑似非体检报告内容，仅发现${foundHealthWords.length}个相关关键词`)
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }

  static logProcessingStep(step: string, data?: any) {
    console.log(`🔄 ${step}`, data || '')
  }

  static logError(context: string, error: any) {
    console.group(`❌ ${context} 错误`)
    console.error('错误对象:', error)
    if (error instanceof Error) {
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
    }
    console.groupEnd()
  }
} 