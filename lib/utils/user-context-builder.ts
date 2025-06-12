/**
 * 用户上下文构建器 - 为AI系统提供个性化的用户信息
 * 只传递有意义的数据，避免空值和默认值，优化token使用
 */

import { UserProfile } from '@/lib/supabase/types'

export interface UserContext {
  basicInfo: string
  healthBackground: string
  lifestyle: string
  healthGoals: string
  fullContext: string
}

export class UserContextBuilder {
  private profile: UserProfile | null

  constructor(profile: UserProfile | null) {
    this.profile = profile
  }

  /**
   * 构建基础信息描述
   */
  private buildBasicInfo(): string {
    if (!this.profile) return ''
    
    const parts: string[] = []
    
    if (this.profile.age && this.profile.age > 0) {
      parts.push(`${this.profile.age}岁`)
    }
    
    if (this.profile.gender) {
      const genderMap = { 'male': '男性', 'female': '女性', 'other': '其他' }
      const displayGender = genderMap[this.profile.gender as keyof typeof genderMap] || this.profile.gender
      parts.push(displayGender)
    }
    
    if (this.profile.height) {
      parts.push(`身高${this.profile.height}cm`)
    }
    
    if (this.profile.weight) {
      parts.push(`体重${this.profile.weight}kg`)
    }
    
    return parts.length > 0 ? parts.join('、') : ''
  }

  /**
   * 构建健康背景描述
   */
  private buildHealthBackground(): string {
    if (!this.profile) return ''
    
    const parts: string[] = []
    
    // 既往病史
    if (this.profile.medical_history && this.profile.medical_history.length > 0) {
      const validHistory = this.profile.medical_history.filter(h => h && h.trim() !== '' && h !== '无')
      if (validHistory.length > 0) {
        parts.push(`既往病史：${validHistory.join('、')}`)
      }
    }
    
    // 家族病史
    if (this.profile.family_history && this.profile.family_history.length > 0) {
      const validFamily = this.profile.family_history.filter(h => h && h.trim() !== '' && h !== '无明显家族病史')
      if (validFamily.length > 0) {
        parts.push(`家族病史：${validFamily.join('、')}`)
      }
    }
    
    // 正在服用的药物
    if (this.profile.medications && this.profile.medications.trim() !== '') {
      parts.push(`正在服用：${this.profile.medications}`)
    }
    
    // 过敏史
    if (this.profile.allergies && this.profile.allergies.trim() !== '') {
      parts.push(`过敏史：${this.profile.allergies}`)
    }
    
    // 自定义病史信息
    if (this.profile.preferences?.custom_medical_history) {
      parts.push(`其他病史：${this.profile.preferences.custom_medical_history}`)
    }
    
    if (this.profile.preferences?.custom_family_history) {
      parts.push(`其他家族病史：${this.profile.preferences.custom_family_history}`)
    }
    
    return parts.length > 0 ? parts.join('；') : ''
  }

  /**
   * 构建生活习惯描述
   */
  private buildLifestyle(): string {
    if (!this.profile) return ''
    
    const parts: string[] = []
    
    if (this.profile.exercise_frequency && this.profile.exercise_frequency.trim() !== '') {
      parts.push(`运动频率：${this.profile.exercise_frequency}`)
    }
    
    if (this.profile.smoking_status && this.profile.smoking_status.trim() !== '') {
      parts.push(`吸烟状况：${this.profile.smoking_status}`)
    }
    
    if (this.profile.drinking_status && this.profile.drinking_status.trim() !== '') {
      parts.push(`饮酒状况：${this.profile.drinking_status}`)
    }
    
    if (this.profile.sleep_hours && this.profile.sleep_hours.trim() !== '') {
      parts.push(`平均睡眠：${this.profile.sleep_hours}`)
    }
    
    if (this.profile.stress_level && this.profile.stress_level.trim() !== '') {
      parts.push(`压力水平：${this.profile.stress_level}`)
    }
    
    // 自定义运动描述
    if (this.profile.preferences?.custom_exercise_frequency) {
      parts.push(`运动详情：${this.profile.preferences.custom_exercise_frequency}`)
    }
    
    return parts.length > 0 ? parts.join('；') : ''
  }

  /**
   * 构建健康目标描述
   */
  private buildHealthGoals(): string {
    if (!this.profile) return ''
    
    const parts: string[] = []
    
    // 主要健康目标
    if (this.profile.health_goals && this.profile.health_goals.length > 0) {
      const validGoals = this.profile.health_goals.filter(g => g && g.trim() !== '' && g !== '其他')
      if (validGoals.length > 0) {
        parts.push(`健康目标：${validGoals.join('、')}`)
      }
    }
    
    // 目标体重
    if (this.profile.target_weight && this.profile.target_weight.trim() !== '') {
      parts.push(`目标体重：${this.profile.target_weight}kg`)
    }
    
    // 其他目标
    if (this.profile.other_goals && this.profile.other_goals.trim() !== '') {
      parts.push(`其他目标：${this.profile.other_goals}`)
    }
    
    // 自定义健康目标
    if (this.profile.preferences?.custom_health_goals) {
      parts.push(`自定义目标：${this.profile.preferences.custom_health_goals}`)
    }
    
    return parts.length > 0 ? parts.join('；') : ''
  }

  /**
   * 获取完整的用户上下文
   */
  public build(): UserContext {
    const basicInfo = this.buildBasicInfo()
    const healthBackground = this.buildHealthBackground()
    const lifestyle = this.buildLifestyle()
    const healthGoals = this.buildHealthGoals()
    
    // 构建完整上下文，只包含有内容的部分
    const contextParts: string[] = []
    
    if (basicInfo) contextParts.push(`基本信息：${basicInfo}`)
    if (healthBackground) contextParts.push(`健康背景：${healthBackground}`)
    if (lifestyle) contextParts.push(`生活习惯：${lifestyle}`)
    if (healthGoals) contextParts.push(`健康目标：${healthGoals}`)
    
    const fullContext = contextParts.length > 0 
      ? contextParts.join('\n') 
      : '暂无详细健康档案信息'
    
    return {
      basicInfo,
      healthBackground,
      lifestyle,
      healthGoals,
      fullContext
    }
  }

  /**
   * 获取简化的用户信息（适用于token较少的场景）
   */
  public buildSimplified(): string {
    if (!this.profile) return '新用户'
    
    const parts: string[] = []
    
    if (this.profile.age && this.profile.age > 0) {
      parts.push(`${this.profile.age}岁`)
    }
    
    if (this.profile.gender) {
      const genderMap = { 'male': '男', 'female': '女' }
      const displayGender = genderMap[this.profile.gender as keyof typeof genderMap]
      if (displayGender) parts.push(displayGender)
    }
    
    // 只包含最重要的健康信息
    const importantConditions = ['高血压', '糖尿病', '心脏病', '高血脂']
    if (this.profile.medical_history) {
      const important = this.profile.medical_history.filter(h => 
        importantConditions.some(c => h.includes(c))
      )
      if (important.length > 0) {
        parts.push(`有${important.join('、')}`)
      }
    }
    
    return parts.length > 0 ? parts.join('，') : '新用户'
  }

  /**
   * 检查是否有足够的用户信息
   */
  public hasUserInfo(): boolean {
    if (!this.profile) return false
    
    return !!(
      this.profile.age ||
      this.profile.gender ||
      (this.profile.medical_history && this.profile.medical_history.length > 0) ||
      (this.profile.health_goals && this.profile.health_goals.length > 0) ||
      this.profile.medications ||
      this.profile.exercise_frequency
    )
  }

  /**
   * 根据场景选择合适的上下文
   */
  public buildForScenario(scenario: 'analysis' | 'chat' | 'explanation'): string {
    const context = this.build()
    
    switch (scenario) {
      case 'analysis':
        // 健康分析需要完整信息
        return context.fullContext
      
      case 'chat':
        // 聊天可以使用简化信息
        return this.buildSimplified()
      
      case 'explanation':
        // 解释指标只需要基础信息和相关病史
        const parts: string[] = []
        if (context.basicInfo) parts.push(context.basicInfo)
        if (context.healthBackground) parts.push(context.healthBackground)
        return parts.join('；') || '暂无相关健康信息'
      
      default:
        return context.fullContext
    }
  }
}

/**
 * 便捷函数：创建用户上下文
 */
export function createUserContext(profile: UserProfile | null): UserContextBuilder {
  return new UserContextBuilder(profile)
}

/**
 * 便捷函数：快速获取用户上下文字符串
 */
export function getUserContextString(
  profile: UserProfile | null, 
  scenario: 'analysis' | 'chat' | 'explanation' = 'analysis'
): string {
  return new UserContextBuilder(profile).buildForScenario(scenario)
} 