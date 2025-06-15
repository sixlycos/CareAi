// 分析结果解析器
export interface ParsedAnalysisResult {
  summary: string
  healthScore: number
  tcmAnalysis?: {
    syndrome: string
    constitution: string
    symptoms: string[]
    pulse: string
    tongue: string
    recommendations: {
      lifestyle: string[]
      diet: string[]
      exercise: string[]
      tcmTreatment: string[]
      followUp: string[]
    }
  }
  keyFindings: string[]
  recommendations: {
    immediate: string[]
    lifestyle: string[]
    diet: string[]
    exercise: string[]
    tcmTreatment?: string[]
    followUp: string[]
  }
  riskFactors: Array<{
    type: string
    probability: string
    description: string
  }>
  overallStatus: string
}

/**
 * 智能AI响应解析器 - 自适应多种格式
 */
export function parseAIAnalysisResult(aiResponse: string): ParsedAnalysisResult {
  console.log('=== 智能AI解析器启动 ===')
  console.log('原始AI响应长度:', aiResponse?.length || 0)
  
  try {
    // 清理AI响应，提取JSON部分
    const cleanedResponse = extractJSONFromResponse(aiResponse)
    const parsedResponse = JSON.parse(cleanedResponse)
    
    console.log('JSON解析成功，开始智能解析...')
    return smartParse(parsedResponse)
    
  } catch (error) {
    console.error('JSON解析失败，尝试文本模式解析:', error)
    return parseFromText(aiResponse)
  }
}

/**
 * 智能解析函数 - 自适应识别各种字段
 */
function smartParse(data: any): ParsedAnalysisResult {
  // 通用字段映射表 - 扩展以支持新的详细格式
  const fieldMappings = {
    summary: ['健康状况', '整体评估', '综合分析', '总结', '概述', 'summary', '整体健康状况评估'],
    healthScore: ['健康评分', '评分', '健康分数', 'healthScore', 'score'],
    keyFindings: ['关键发现', '主要发现', '重要发现', '主要关注点', 'keyFindings', 'findings'],
    riskLevel: ['风险等级', '风险级别', '风险评估', 'riskLevel'],
    immediate: ['立即行动', '即时建议', '紧急建议', 'immediate'],
    lifestyle: ['生活方式', '生活习惯', '生活建议', 'lifestyle'],
    diet: ['饮食调整', '饮食建议', '饮食与营养', 'diet', '营养补充建议', '饮食时间安排'],
    exercise: ['运动方案', '运动建议', '锻炼建议', 'exercise', '有氧运动计划', '力量训练建议', '日常活动增加'],
    followUp: ['复查计划', '随访建议', '后续计划', '年度体检', 'followUp'],
    shortTermRisks: ['短期风险', '近期风险', 'shortTermRisks'],
    longTermRisks: ['长期风险', '远期风险', 'longTermRisks'],
    preventive: ['预防措施', '预防建议', 'preventive'],
    // 新增字段映射
    abnormalIndicators: ['异常指标分析', '严重异常', '轻度异常', '需要监测'],
    systemEvaluation: ['系统评估', '心血管系统', '代谢系统', '肝肾功能', '免疫系统'],
    medicalAdvice: ['医疗建议', '专科咨询', '药物提醒'],
    healthPlanning: ['健康规划', '30天计划', '3个月目标'],
    sleepAdvice: ['睡眠优化', '睡眠建议'],
    stressManagement: ['压力管理', '减压方法']
  }
  
  // 智能提取函数
  const smartExtract = (obj: any, possibleKeys: string[]): any => {
    if (!obj) return null
    
    // 直接匹配
    for (const key of possibleKeys) {
      if (obj[key] !== undefined) {
        return obj[key]
      }
    }
    
    // 递归搜索
    for (const [objKey, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        const result = smartExtract(value, possibleKeys)
        if (result !== null) return result
      }
    }
    
    return null
  }
  
  // 智能提取数组 - 增强版，支持嵌套对象
  const smartExtractArray = (obj: any, possibleKeys: string[]): string[] => {
    const result = smartExtract(obj, possibleKeys)
    if (Array.isArray(result)) return result
    if (typeof result === 'string') return [result]
    if (typeof result === 'object' && result !== null) {
      // 如果是对象，尝试提取所有字符串值和数组值
      const extracted: string[] = []
      for (const value of Object.values(result)) {
        if (typeof value === 'string') {
          extracted.push(value)
        } else if (Array.isArray(value)) {
          extracted.push(...value.filter(v => typeof v === 'string'))
        }
      }
      return extracted
    }
    return []
  }
  
  // 智能提取数字
  const smartExtractNumber = (obj: any, possibleKeys: string[], defaultValue: number = 70): number => {
    const result = smartExtract(obj, possibleKeys)
    if (typeof result === 'number') return result
    if (typeof result === 'string') {
      const num = parseFloat(result)
      if (!isNaN(num)) return num
    }
    return defaultValue
  }
  
  // 智能提取字符串
  const smartExtractString = (obj: any, possibleKeys: string[], defaultValue: string = ''): string => {
    const result = smartExtract(obj, possibleKeys)
    if (typeof result === 'string') return result
    if (typeof result === 'number') return result.toString()
    if (Array.isArray(result)) return result.join('，')
    return defaultValue
  }
  
  // 开始智能解析
  const healthScore = smartExtractNumber(data, fieldMappings.healthScore)
  const summary = smartExtractString(data, fieldMappings.summary, '健康分析已完成')
  const riskLevel = smartExtractString(data, fieldMappings.riskLevel, '中等风险')
  
  // 构建关键发现 - 优先从新格式提取
  let keyFindings = smartExtractArray(data, fieldMappings.keyFindings)
  if (keyFindings.length === 0) {
    // 尝试从异常指标分析中提取
    const abnormalIndicators = smartExtractArray(data, fieldMappings.abnormalIndicators)
    if (abnormalIndicators.length > 0) {
      keyFindings = abnormalIndicators.slice(0, 3)
    } else {
      keyFindings = [
        `健康评分：${healthScore}分`,
        `风险等级：${riskLevel}`,
        summary.slice(0, 100) + (summary.length > 100 ? '...' : '')
      ]
    }
  }
  
  // 构建建议 - 增强版，支持更多类型
  const immediate = smartExtractArray(data, fieldMappings.immediate)
  let lifestyle = smartExtractArray(data, fieldMappings.lifestyle)
  let diet = smartExtractArray(data, fieldMappings.diet)
  let exercise = smartExtractArray(data, fieldMappings.exercise)
  const followUp = smartExtractArray(data, fieldMappings.followUp)
  
  // 从新格式中提取更多建议
  const sleepAdvice = smartExtractArray(data, fieldMappings.sleepAdvice)
  const stressManagement = smartExtractArray(data, fieldMappings.stressManagement)
  const medicalAdvice = smartExtractArray(data, fieldMappings.medicalAdvice)
  
  // 合并生活方式建议
  if (sleepAdvice.length > 0) lifestyle.push(...sleepAdvice)
  if (stressManagement.length > 0) lifestyle.push(...stressManagement)
  
  // 合并随访建议
  if (medicalAdvice.length > 0) {
    followUp.push(...medicalAdvice)
  }
  
  // 构建风险因素 - 增强版
  const shortTermRisks = smartExtractArray(data, fieldMappings.shortTermRisks)
  const longTermRisks = smartExtractArray(data, fieldMappings.longTermRisks)
  
  const riskFactors = [
    ...shortTermRisks.map(risk => ({
      type: '短期风险',
      probability: healthScore < 60 ? '高' : healthScore < 80 ? '中' : '低',
      description: risk
    })),
    ...longTermRisks.map(risk => ({
      type: '长期风险',
      probability: healthScore < 50 ? '高' : healthScore < 70 ? '中' : '低',
      description: risk
    }))
  ]
  
  // 确定整体状态 - 更精确的判断
  const overallStatus = healthScore >= 85 ? '健康状况优秀' : 
                       healthScore >= 70 ? '健康状况良好' : 
                       healthScore >= 55 ? '需要关注' : '建议就医'
  
  console.log('智能解析完成:', {
    healthScore,
    keyFindingsCount: keyFindings.length,
    recommendationsCount: immediate.length + lifestyle.length + diet.length + exercise.length + followUp.length,
    riskFactorsCount: riskFactors.length,
    overallStatus
  })
  
  return {
    summary,
    healthScore,
    keyFindings,
    recommendations: {
      immediate: immediate.length > 0 ? immediate : [],
      lifestyle: lifestyle.length > 0 ? lifestyle : [],
      diet: diet.length > 0 ? diet : [],
      exercise: exercise.length > 0 ? exercise : [],
      followUp: followUp.length > 0 ? followUp : []
    },
    riskFactors,
    overallStatus
  }
}

/**
 * 文本模式解析 - 当JSON解析失败时的备用方案
 */
function parseFromText(text: string): ParsedAnalysisResult {
  console.log('使用文本模式解析...')
  
  // 尝试从文本中提取信息
  const extractPattern = (pattern: RegExp, defaultValue: any = '') => {
    const match = text.match(pattern)
    return match ? match[1] : defaultValue
  }
  
  const healthScore = parseInt(extractPattern(/(?:健康评分|评分)[：:\s]*(\d+)/, '70'))
  const summary = extractPattern(/(?:健康状况|整体评估)[：:\s]*([^。\n]{10,200})/, text.slice(0, 200) + '...')
  
  // 提取建议类文本
  const extractAdvice = (keywords: string[]) => {
    const advice = []
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[：:\s]*([^。\n]+)`, 'g')
      let match
      while ((match = regex.exec(text)) !== null) {
        advice.push(match[1].trim())
      }
    }
    return advice
  }
  
  return {
    summary,
    healthScore,
    keyFindings: [`健康评分：${healthScore}分`, '基于文本分析的结果'],
    recommendations: {
      immediate: extractAdvice(['立即', '紧急', '马上']),
      lifestyle: extractAdvice(['生活', '作息', '习惯']),
      diet: extractAdvice(['饮食', '营养', '食物']),
      exercise: extractAdvice(['运动', '锻炼', '体育']),
      followUp: extractAdvice(['复查', '随访', '检查'])
    },
    riskFactors: [],
    overallStatus: healthScore >= 70 ? '一般' : '需要关注'
  }
}

/**
 * 从AI响应中提取纯JSON部分
 */
function extractJSONFromResponse(response: string): string {
  // 尝试找到JSON的开始和结束
  const jsonStart = response.indexOf('{')
  if (jsonStart === -1) {
    throw new Error('未找到JSON开始标记')
  }
  
  // 从第一个{开始，寻找匹配的}
  let braceCount = 0
  let jsonEnd = jsonStart
  
  for (let i = jsonStart; i < response.length; i++) {
    if (response[i] === '{') {
      braceCount++
    } else if (response[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        jsonEnd = i + 1
        break
      }
    }
  }
  
  const extractedJSON = response.slice(jsonStart, jsonEnd)
  
  // 验证提取的JSON是否有效
  try {
    JSON.parse(extractedJSON)
    return extractedJSON
  } catch (error) {
    // 如果提取的JSON无效，尝试其他方法
    console.warn('提取的JSON无效，尝试其他方法')
    
    // 方法2: 寻找最后一个完整的}
    const lastBrace = response.lastIndexOf('}')
    if (lastBrace > jsonStart) {
      const alternativeJSON = response.slice(jsonStart, lastBrace + 1)
      try {
        JSON.parse(alternativeJSON)
        return alternativeJSON
      } catch (e) {
        // 继续尝试其他方法
      }
    }
    
    // 方法3: 使用正则表达式清理
    const cleanedJSON = response
      .slice(jsonStart)
      .replace(/```json|```/g, '') // 移除markdown代码块标记
      .replace(/\n\n[^{].*$/, '') // 移除JSON后的解释文字
      .trim()
    
    return cleanedJSON
  }
}

/**
 * 解析中医分析结果
 */
function parseTCMAnalysis(data: any): ParsedAnalysisResult {
  const tcmDiagnosis = data.证型分析?.中医诊断 || ''
  const constitution = data.体质评估?.基础体质 || ''
  const comprehensiveJudgment = data.证型分析?.综合判断 || ''
  
  const symptoms = []
  if (data.证型分析?.症状分析) {
    const symptomAnalysis = data.证型分析.症状分析
    if (symptomAnalysis.舌象) symptoms.push(`舌象：${symptomAnalysis.舌象}`)
    if (symptomAnalysis.脉象) symptoms.push(`脉象：${symptomAnalysis.脉象}`)
    if (symptomAnalysis.问诊) symptoms.push(`问诊：${symptomAnalysis.问诊}`)
    if (symptomAnalysis.其他) symptoms.push(`其他：${symptomAnalysis.其他}`)
  }
  
  const recommendations = data.调理建议 || {}
  const lifeGuidance = data.生活指导 || {}
  
  // 合并所有关键发现
  const keyFindings = [
    `中医诊断：${tcmDiagnosis}`,
    `体质评估：${constitution}`,
    comprehensiveJudgment,
    ...symptoms
  ].filter(Boolean)
  
  return {
    summary: comprehensiveJudgment || `${tcmDiagnosis}，${constitution}`,
    healthScore: 70, // 中医诊断暂时设为固定值
    tcmAnalysis: {
      syndrome: tcmDiagnosis,
      constitution: constitution,
      symptoms: symptoms,
      pulse: data.证型分析?.症状分析?.脉象 || '',
      tongue: data.证型分析?.症状分析?.舌象 || '',
      recommendations: {
        lifestyle: recommendations.情志调摄 || [],
        diet: recommendations.饮食调养 || [],
        exercise: lifeGuidance.运动建议 ? [lifeGuidance.运动建议] : [],
        tcmTreatment: recommendations.中医调理 || [],
        followUp: lifeGuidance.健康监测 ? [lifeGuidance.健康监测] : []
      }
    },
    keyFindings: keyFindings,
    recommendations: {
      immediate: recommendations.中医调理 || [],
      lifestyle: [
        ...(recommendations.情志调摄 || []),
        lifeGuidance.作息建议,
        lifeGuidance.戒烟限酒
      ].filter(Boolean),
      diet: recommendations.饮食调养 || [],
      exercise: lifeGuidance.运动建议 ? [lifeGuidance.运动建议] : [],
      tcmTreatment: recommendations.中医调理 || [],
      followUp: lifeGuidance.健康监测 ? [lifeGuidance.健康监测] : []
    },
    riskFactors: (data.体质评估?.影响因素 || []).map((factor: string) => ({
      type: '体质风险因素',
      probability: '中',
      description: factor
    })),
    overallStatus: tcmDiagnosis ? '需要调理' : '亚健康'
  }
}

// 旧的解析函数已被智能解析器替代 