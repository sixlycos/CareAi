import { 
  NumericalIndicator, 
  ImagingFindings, 
  PathologyResults, 
  TCMDiagnosis, 
  ClinicalDiagnosis,
  UnifiedMedicalData
} from '../supabase/types';

export class HealthAnalyzer {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY || '';
    this.endpoint = endpoint || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '';
  }

  // 调用Azure OpenAI
  async callAzureOpenAI(prompt: string): Promise<string> {
    try {
      const deploymentName = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1';
      const apiVersion = process.env.NEXT_PUBLIC_AZURE_OPENAI_VERSION || '2024-02-15-preview';
      
      console.log('🤖 准备调用Azure OpenAI...');
      console.log('📍 Endpoint:', this.endpoint);
      console.log('🚀 Deployment:', deploymentName);
      console.log('📝 Prompt长度:', prompt.length);
      
      const response = await fetch(`${this.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个专业的医疗健康分析助手，具备现代医学和传统中医学知识。请提供准确、专业的医疗分析。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
        }),
      });

      console.log('📡 Azure OpenAI响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Azure OpenAI API错误响应:', errorText);
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Azure OpenAI调用成功');
      
      const content = data.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ Azure OpenAI返回空内容:', data);
        throw new Error('Azure OpenAI返回空内容');
      }
      
      console.log('📊 AI响应长度:', content.length);
      return content;
      
    } catch (error) {
      console.error('❌ Azure OpenAI调用失败:', error);
      console.error('🔍 错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        endpoint: this.endpoint,
        hasApiKey: !!this.apiKey
      });
      throw error;
    }
  }

  // 识别报告类型 - 改进版本
  async identifyReportType(content: string): Promise<'modern' | 'tcm' | 'imaging' | 'pathology' | 'mixed'> {
    const prompt = `
分析以下医疗报告内容，判断报告类型。请返回JSON格式：

报告内容：
${content}

判断标准：
- modern: 主要包含数值指标（血检、尿检等化验结果）
- tcm: 主要包含中医诊断（四诊、证型、方药等）
- imaging: 主要包含影像学发现（CT、MRI、X光等）
- pathology: 主要包含病理诊断
- mixed: 包含多种类型的内容

请返回：{"type": "报告类型", "confidence": 置信度0-1, "reasoning": "判断理由"}
`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      const result = JSON.parse(response);
      return result.type;
    } catch (error) {
      console.error('报告类型识别失败:', error);
      return 'mixed'; // 默认返回混合类型
    }
  }

  // 统一的医疗数据解析方法
  async parseUnifiedMedicalData(content: string, reportType: string): Promise<UnifiedMedicalData> {
    const medicalData: UnifiedMedicalData = {
      raw_text: content
    };

    switch (reportType) {
      case 'modern':
        medicalData.numerical_indicators = await this.parseNumericalIndicators(content);
        medicalData.clinical_diagnosis = await this.parseClinicalDiagnosis(content);
        break;
      
      case 'tcm':
        medicalData.tcm_diagnosis = await this.parseTCMDiagnosis(content);
        medicalData.clinical_diagnosis = await this.parseClinicalDiagnosis(content);
        break;
      
      case 'imaging':
        medicalData.imaging_findings = await this.parseImagingFindings(content);
        medicalData.clinical_diagnosis = await this.parseClinicalDiagnosis(content);
        break;
      
      case 'pathology':
        medicalData.pathology_results = await this.parsePathologyResults(content);
        medicalData.clinical_diagnosis = await this.parseClinicalDiagnosis(content);
        break;
      
      case 'mixed':
        // 尝试解析所有类型的数据
        medicalData.numerical_indicators = await this.parseNumericalIndicators(content);
        medicalData.imaging_findings = await this.parseImagingFindings(content);
        medicalData.pathology_results = await this.parsePathologyResults(content);
        medicalData.tcm_diagnosis = await this.parseTCMDiagnosis(content);
        medicalData.clinical_diagnosis = await this.parseClinicalDiagnosis(content);
        break;
    }

    return medicalData;
  }

  // 解析数值指标
  async parseNumericalIndicators(content: string): Promise<NumericalIndicator[]> {
    const prompt = `
从以下医疗报告中提取所有数值指标，返回JSON数组格式：

报告内容：
${content}

请提取所有检查指标，包括：
- 血液检查指标
- 尿液检查指标  
- 生化指标
- 免疫指标
- 其他数值型指标

返回格式：
[
  {
    "name": "指标名称",
    "value": "数值",
    "unit": "单位",
    "normalRange": "正常范围",
    "status": "normal/high/low/critical"
  }
]
`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      // 清理JSON响应
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('数值指标解析失败:', error);
      console.log('尝试应急提取数值指标...');
      
      // 应急提取数值指标
      const emergencyIndicators = this.extractIndicatorsFromText(content);
      return emergencyIndicators;
    }
  }

  // 解析影像学发现
  async parseImagingFindings(content: string): Promise<ImagingFindings | null> {
    const prompt = `
从以下医疗报告中提取影像学发现信息，返回JSON格式：

报告内容：
${content}

返回格式：
{
  "type": "检查类型(CT/MRI/X光等)",
  "location": "检查部位",
  "technique": "检查技术描述",
  "findings": "影像学发现",
  "impression": "影像学印象",
  "suggestions": "建议"
}

如果没有影像学内容，返回null
`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      const result = JSON.parse(response);
      return (result && result.type) ? result : null;
    } catch (error) {
      console.error('影像学发现解析失败:', error);
      return null;
    }
  }

  // 解析病理结果
  async parsePathologyResults(content: string): Promise<PathologyResults | null> {
    const prompt = `
从以下医疗报告中提取病理诊断信息，返回JSON格式：

报告内容：
${content}

返回格式：
{
  "specimen": "标本类型",
  "diagnosis": "病理诊断",
  "details": "详细描述",
  "grade": "分级",
  "stage": "分期"
}

如果没有病理内容，返回null
`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      const result = JSON.parse(response);
      return (result && result.specimen) ? result : null;
    } catch (error) {
      console.error('病理结果解析失败:', error);
      return null;
    }
  }

  // 解析中医诊断
  async parseTCMDiagnosis(content: string): Promise<TCMDiagnosis | null> {
    const prompt = `
从以下中医报告中提取中医诊断信息，返回JSON格式：

报告内容：
${content}

请提取中医四诊和诊断信息：
返回格式：
{
  "inspection": "望诊所见",
  "inquiry": "问诊所得", 
  "palpation": "切诊（脉象）",
  "auscultation": "闻诊所闻",
  "syndrome": "证型",
  "disease": "病名",
  "constitution": "体质辨识"
}

如果没有中医内容，返回null
`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      const result = JSON.parse(response);
      return (result && (result.syndrome || result.disease)) ? result : null;
    } catch (error) {
      console.error('中医诊断解析失败:', error);
      return null;
    }
  }

  // 解析临床诊断
  async parseClinicalDiagnosis(content: string): Promise<ClinicalDiagnosis | null> {
    const prompt = `
从以下医疗报告中提取临床诊断和治疗信息，返回JSON格式：

报告内容：
${content}

返回格式：
{
  "primary": "主要诊断",
  "secondary": ["次要诊断1", "次要诊断2"],
  "tcm_diagnosis": "中医诊断",
  "treatment_principle": "治疗原则",
  "prescription": "处方",
  "medications": ["药物1", "药物2"],
  "usage": "用法用量",
  "recommendations": ["建议1", "建议2"]
}

如果没有诊断信息，返回null
`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      const result = JSON.parse(response);
      return (result && result.primary) ? result : null;
    } catch (error) {
      console.error('临床诊断解析失败:', error);
      return null;
    }
  }

  // 统一的分析方法
  async analyzeUnifiedReport(medicalData: UnifiedMedicalData, userContext: any): Promise<any> {
    // 直接使用原始文本进行AI分析
    if (medicalData.raw_text) {
      try {
        const analysisPrompt = this.buildAnalysisPrompt(medicalData.raw_text, userContext);
        const aiResponse = await this.callAzureOpenAI(analysisPrompt);
        
        console.log('AI分析响应原始长度:', aiResponse.length);
        console.log('AI分析响应预览:', aiResponse.slice(0, 200) + '...');
        
        // 返回包含原始AI响应的结果
        return {
          aiResponse: aiResponse, // 保存原始AI响应用于解析器处理
          summary: '基于AI智能分析的健康评估',
          health_score: 70,
          key_findings: medicalData,
          recommendations: {
            immediate: [],
            lifestyle: [],
            followup: []
          },
          risk_factors: [],
          components: []
        };
      } catch (error) {
        console.error('AI分析失败:', error);
        return this.createFallbackAnalysis(medicalData);
      }
    }

    // 如果没有原始文本，返回备用分析
    return this.createFallbackAnalysis(medicalData);
  }

  // 构建分析提示词
  private buildAnalysisPrompt(reportContent: string, userContext: any): string {
    const userInfo = userContext ? `
用户个人档案：
- 年龄：${userContext.age || '未知'}岁
- 性别：${userContext.gender || '未知'}
- 既往病史：${userContext.medical_history || '无特殊病史'}
- 家族史：${userContext.family_history || '无特殊家族史'}
- 生活习惯：运动频率${userContext.exercise_frequency || '未知'}，吸烟状况${userContext.smoking_status || '未知'}，饮酒情况${userContext.drinking_status || '未知'}
- 职业：${userContext.occupation || '未知'}
- 睡眠质量：${userContext.sleep_quality || '未知'}
` : '';

    return `
您是一位资深的临床医学专家和健康管理顾问，拥有20年以上的临床经验，擅长将复杂的医学知识转化为患者易懂的健康指导。请基于以下医疗报告，为用户提供全面、专业、个性化的健康分析。

${userInfo}

医疗报告内容：
${reportContent}

请严格按照以下JSON格式返回分析结果，确保内容详实、具体、可操作：

{
  "整体评估": {
    "健康状况": "基于报告的综合健康评价，用通俗易懂的语言描述，包含具体的医学判断和整体印象",
    "健康评分": 数字(0-100),
    "风险等级": "低风险/中等风险/高风险/需要立即就医",
    "关键发现": [
      "最重要的发现1 - 具体描述异常情况和临床意义",
      "最重要的发现2 - 包含数值和参考范围对比",
      "最重要的发现3 - 说明对健康的潜在影响"
    ]
  },
  "专业解读": {
    "异常指标分析": {
      "严重异常": [
        "指标名称: 当前值vs正常值，临床意义，可能原因，紧急程度评估"
      ],
      "轻度异常": [
        "指标名称: 当前值vs正常值，临床意义，生活方式影响因素"
      ],
      "需要监测": [
        "指标名称: 当前状态，为什么需要监测，建议监测频次和方法"
      ]
    },
    "系统评估": {
      "心血管系统": "详细评估心血管健康状况，包含血压、血脂、心电图等相关指标分析，风险因素识别，预防建议",
      "代谢系统": "血糖、血脂、尿酸等代谢指标的专业分析，糖尿病、代谢综合征风险评估，饮食运动建议",
      "肝肾功能": "肝功能、肾功能指标详细解读，功能状态评价，保护措施建议",
      "免疫系统": "免疫相关指标分析，抵抗力评估，免疫力提升建议",
      "其他系统": "血常规、甲状腺功能等其他相关系统的健康状况评估"
    }
  },
  "个性化建议": {
    "立即行动": [
      "具体的紧急措施 - 详细说明为什么需要立即行动，如何执行",
      "需要预约的检查 - 具体检查项目，预约时间建议，注意事项",
      "生活方式立即调整 - 具体的改变措施，执行方法"
    ],
    "生活方式": {
      "饮食调整": [
        "具体食物推荐 - 哪些食物多吃，哪些避免，每日摄入量建议",
        "营养补充建议 - 维生素、矿物质等补充方案",
        "饮食时间安排 - 三餐时间，加餐建议，饮水量"
      ],
      "运动方案": [
        "有氧运动计划 - 具体运动类型，强度，频次，时长",
        "力量训练建议 - 适合的训练方式，注意事项",
        "日常活动增加 - 简单易行的活动建议"
      ],
      "生活习惯": [
        "睡眠优化 - 睡眠时间，睡眠质量改善方法",
        "压力管理 - 具体的减压方法，放松技巧",
        "环境因素 - 工作环境、居住环境的健康建议"
      ]
    },
    "医疗建议": {
      "复查计划": [
        "1个月内复查项目 - 具体检查项目，复查原因",
        "3个月内复查项目 - 监测指标，预期改善目标",
        "半年内复查项目 - 长期监测指标，健康维护"
      ],
      "专科咨询": [
        "推荐科室 - 具体科室，咨询原因，准备材料",
        "专家建议 - 什么情况下需要看专家，如何选择医院"
      ],
      "药物提醒": [
        "用药建议方向 - 可能需要的药物类型，用药原则",
        "用药注意事项 - 服药时间，饮食配合，副作用监测"
      ]
    }
  },
  "风险预警": {
    "短期风险": [
      "1-3个月内的健康风险 - 具体风险，发生概率，预防措施",
      "需要警惕的症状 - 出现哪些症状需要立即就医",
      "生活中的注意事项 - 日常生活中需要特别注意的方面"
    ],
    "长期风险": [
      "1-5年潜在疾病风险 - 基于当前指标预测的疾病风险",
      "遗传因素影响 - 家族史相关的风险评估",
      "生活方式相关风险 - 不良习惯可能导致的长期后果"
    ],
    "预防措施": [
      "一级预防策略 - 防止疾病发生的具体措施",
      "二级预防策略 - 早期发现疾病的筛查建议",
      "三级预防策略 - 防止疾病恶化的管理方法"
    ]
  },
  "健康规划": {
    "30天计划": [
      "第1周目标 - 具体可执行的短期目标，每日任务",
      "第2-3周目标 - 习惯养成，行为改变",
      "第4周目标 - 效果评估，计划调整"
    ],
    "3个月目标": [
      "第1个月重点 - 主要改善方向，预期效果",
      "第2个月重点 - 深化改善，新习惯巩固",
      "第3个月重点 - 效果评估，长期规划制定"
    ],
    "年度体检": [
      "下次体检时间 - 建议的体检间隔，最佳体检时间",
      "重点检查项目 - 基于当前状况需要重点关注的检查",
      "体检前准备 - 体检前的注意事项，准备工作"
    ]
  }
}

分析要求：
1. 【专业性】基于循证医学和最新临床指南，提供科学准确的分析
2. 【个性化】充分考虑用户年龄、性别、既往病史、生活习惯等个体差异
3. 【可操作性】所有建议都要具体可执行，避免空泛的健康常识，提供具体的数量、时间、方法
4. 【优先级】突出最重要的健康问题，按紧急程度和重要性排序
5. 【通俗易懂】用患者能理解的语言解释医学术语，但保持专业准确性
6. 【全面性】涵盖身体、心理、社会各个层面的健康因素
7. 【前瞻性】不仅分析当前状况，还要预测未来风险和发展趋势
8. 【中西医结合】如果是中医报告，在系统评估中加入中医体质分析、证型判断和调理建议

特别注意：
- 每个建议都要说明"为什么"和"怎么做"
- 数值异常要提供具体的改善目标和时间框架
- 风险评估要量化，给出具体的概率或等级
- 所有建议要考虑用户的实际执行能力和生活条件
- 语言要温暖、鼓励，避免过度恐吓，但也不能轻视问题
`;
  }

  // 创建备用分析结果
  private createFallbackAnalysis(medicalData: UnifiedMedicalData): any {
    return {
      summary: '已完成医疗报告分析',
      health_score: 70,
      key_findings: medicalData,
      recommendations: {
        immediate: ['请咨询专业医生获取详细诊断'],
        lifestyle: ['保持健康的生活方式'],
        followup: ['定期复查相关指标']
      },
      risk_factors: [],
      components: []
    };
  }

  // 清理JSON响应
  private cleanJSONResponse(response: string): string {
    // 尝试找到JSON的开始和结束
    const jsonStart = response.indexOf('{')
    const arrayStart = response.indexOf('[')
    
    // 选择更早出现的开始标记
    const start = jsonStart === -1 ? arrayStart : 
                  arrayStart === -1 ? jsonStart : 
                  Math.min(jsonStart, arrayStart)
    
    if (start === -1) {
      throw new Error('未找到JSON开始标记')
    }
    
    // 找到匹配的结束标记
    const startChar = response[start]
    const endChar = startChar === '{' ? '}' : ']'
    let braceCount = 0
    let end = start
    
    for (let i = start; i < response.length; i++) {
      if (response[i] === startChar) {
        braceCount++
      } else if (response[i] === endChar) {
        braceCount--
        if (braceCount === 0) {
          end = i + 1
          break
        }
      }
    }
    
    const extractedJSON = response.slice(start, end)
    
    // 清理markdown代码块标记
    return extractedJSON.replace(/```json|```/g, '').trim()
  }

  // 应急提取数值指标
  private extractIndicatorsFromText(content: string): NumericalIndicator[] {
    const indicators: NumericalIndicator[] = []
    
    // 常见的医学指标模式
    const patterns = [
      // 血常规指标
      /(?:红细胞|RBC)[：:\s]*(\d+\.?\d*)\s*\*?\s*10\^?12?\s*\/L/gi,
      /(?:白细胞|WBC)[：:\s]*(\d+\.?\d*)\s*\*?\s*10\^?9?\s*\/L/gi,
      /(?:血红蛋白|HGB?)[：:\s]*(\d+\.?\d*)\s*g\/L/gi,
      /(?:血小板|PLT)[：:\s]*(\d+\.?\d*)\s*\*?\s*10\^?9?\s*\/L/gi,
      
      // 生化指标
      /(?:总胆固醇|TC)[：:\s]*(\d+\.?\d*)\s*mmol\/L/gi,
      /(?:甘油三酯|TG)[：:\s]*(\d+\.?\d*)\s*mmol\/L/gi,
      /(?:血糖|GLU)[：:\s]*(\d+\.?\d*)\s*mmol\/L/gi,
      /(?:尿酸|UA)[：:\s]*(\d+\.?\d*)\s*umol\/L/gi,
      
      // 通用数值模式 
      /([^0-9\n]+)[：:\s]+(\d+\.?\d*)\s*([a-zA-Z\/\*\^0-9]+)/g
    ]
    
    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim()
        const value = parseFloat(match[2])
        const unit = match[3]?.trim() || ''
        
        if (name && !isNaN(value)) {
          indicators.push({
            name: name,
            value: value,
            unit: unit,
            normalRange: '参考医生评估',
            status: 'normal'
          })
        }
      }
    })
    
    // 去重（根据指标名称）
    const uniqueIndicators = indicators.filter((indicator, index, self) => 
      index === self.findIndex(i => i.name === indicator.name)
    )
    
    console.log(`应急提取到 ${uniqueIndicators.length} 个数值指标`)
    return uniqueIndicators
  }


} 

// 导出便捷函数
export async function analyzeHealthReport(reportContent: string, userContext?: any): Promise<{
  reportType: string;
  medicalData: UnifiedMedicalData;
  summary: string;
  keyFindings: any;
  recommendations: any;
  riskFactors: string[];
  overallHealthScore: number;
  confidenceScore: number;
}> {
  const analyzer = new HealthAnalyzer();
  
  // 识别报告类型
  const reportType = await analyzer.identifyReportType(reportContent);
  
  // 解析医疗数据
  const medicalData = await analyzer.parseUnifiedMedicalData(reportContent, reportType);
  
  // 统一分析
  const analysisResult = await analyzer.analyzeUnifiedReport(medicalData, userContext || {});
  
  return {
    reportType,
    medicalData,
    summary: analysisResult.summary || '健康分析完成',
    keyFindings: medicalData,
    recommendations: {
      immediate: analysisResult.immediate || [],
      lifestyle: analysisResult.lifestyle || [],
      followup: analysisResult.followup || [],
      tcm_advice: analysisResult.tcm_advice || []
    },
    riskFactors: analysisResult.risk_factors || [],
    overallHealthScore: analysisResult.health_score || 70,
    confidenceScore: analysisResult.confidence_score || 80
  };
} 