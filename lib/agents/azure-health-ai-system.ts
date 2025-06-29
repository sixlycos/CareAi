// Azure生态健康AI系统 - 使用AI + Azure Computer Vision

interface HealthIndicator {
  name: string;
  value: number | string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
}

interface AnalysisResult {
  overallStatus: '优秀' | '良好' | '注意' | '建议就医' | '无法评估';
  healthScore: number;
  summary: string;
  abnormalIndicators: HealthIndicator[];
  recommendations: {
    lifestyle: string[];
    diet: string[];
    exercise: string[];
    followUp: string[];
  };
  risks: Array<{
    type: string;
    probability: '低' | '中' | '高';
    description: string;
  }>;
}

class AzureHealthAISystem {
  private azureOpenAIEndpoint: string;
  private azureOpenAIKey: string;
  private azureOpenAIVersion: string;
  private azureOpenAIDeployment: string;
  private azureVisionEndpoint: string;
  private azureVisionKey: string;

  constructor(config: {
    azureOpenAIEndpoint: string;
    azureOpenAIKey: string;
    azureOpenAIVersion: string;
    azureOpenAIDeployment: string;
    azureVisionEndpoint: string;
    azureVisionKey: string;
  }) {
    this.azureOpenAIEndpoint = config.azureOpenAIEndpoint;
    this.azureOpenAIKey = config.azureOpenAIKey;
    this.azureOpenAIVersion = config.azureOpenAIVersion;
    this.azureOpenAIDeployment = config.azureOpenAIDeployment;
    this.azureVisionEndpoint = config.azureVisionEndpoint;
    this.azureVisionKey = config.azureVisionKey;

    // 验证配置
    this.validateConfig();
  }

  private validateConfig() {
    const requiredFields = [
      'azureOpenAIEndpoint',
      'azureOpenAIKey', 
      'azureOpenAIVersion',
      'azureOpenAIDeployment',
      'azureVisionEndpoint',
      'azureVisionKey'
    ];
    
    for (const field of requiredFields) {
      if (!this[field as keyof this]) {
        throw new Error(`Azure配置缺失: ${field}`);
      }
    }
  }

  // Agent 1: Azure Computer Vision OCR with enhanced parsing
  async extractTextFromImage(file: File, maxRetries: number = 3): Promise<{
    extractedText: string[];
    rawResult?: any;
    parsedResult?: any;
  }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 OCR处理尝试 ${attempt}/${maxRetries}...`);
        
        // 验证文件类型和大小
        if (!file.type.startsWith('image/')) {
          throw new Error('只支持图片文件');
        }
        
        if (file.size > 4 * 1024 * 1024) { // 4MB限制
          throw new Error('图片文件大小不能超过4MB');
        }

        // 根据 Azure Computer Vision 文档，使用正确的端点格式
        const endpoint = this.azureVisionEndpoint.endsWith('/') 
          ? this.azureVisionEndpoint.slice(0, -1) 
          : this.azureVisionEndpoint;

        // 【调用场景：体检报告图片OCR文字识别】+【Azure Computer Vision Read API图像文字提取】
        const response = await fetch(
          `${endpoint}/vision/v3.2/read/analyze`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': this.azureVisionKey,
              'Content-Type': 'application/octet-stream',
              'User-Agent': 'CEE-HealthAI/1.0',
            },
            body: file,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Vision API error: ${response.status} - ${errorText}`);
        }

        // 获取操作位置
        const operationLocation = response.headers.get('Operation-Location');
        if (!operationLocation) {
          throw new Error('未能获得操作位置，请重试');
        }

        // 轮询结果 - 改进的重试机制
        let result;
        let pollAttempts = 0;
        const maxPollAttempts = 15; // 增加轮询次数

        do {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 增加等待时间
          const resultResponse = await fetch(operationLocation, {
            headers: {
              'Ocp-Apim-Subscription-Key': this.azureVisionKey,
            },
          });

          if (!resultResponse.ok) {
            throw new Error(`轮询结果失败: ${resultResponse.status}`);
          }

          result = await resultResponse.json();
          pollAttempts++;
          
          console.log(`轮询状态: ${result.status} (${pollAttempts}/${maxPollAttempts})`);
          
        } while (result.status === 'running' && pollAttempts < maxPollAttempts);

        if (result.status !== 'succeeded') {
          throw new Error(`OCR处理失败，状态: ${result.status}`);
        }

        // 使用新的解析器处理结果
        const { AzureOCRParser } = await import('@/lib/utils/azure-ocr-parser');
        const parsedResult = AzureOCRParser.parseOCRResult(result);
        
        if (!parsedResult.success || parsedResult.extractedText.length === 0) {
          throw new Error('OCR解析失败或未提取到有效文本');
        }

        console.log(`✅ 成功提取 ${parsedResult.extractedText.length} 行文本，平均置信度: ${parsedResult.metadata.avgConfidence.toFixed(2)}`);
        
        return {
          extractedText: parsedResult.extractedText,
          rawResult: result,
          parsedResult: parsedResult
        };

      } catch (error) {
        console.error(`OCR尝试 ${attempt} 失败:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`OCR处理失败 (${maxRetries}次尝试): ${error instanceof Error ? error.message : '未知错误'}`);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return {
      extractedText: [],
      rawResult: null,
      parsedResult: null
    };
  }

  // Agent 2: AI 健康指标解析 with better error handling
  async parseHealthIndicators(textArray: string[]): Promise<HealthIndicator[]> {
    if (!textArray || textArray.length === 0) {
      throw new Error('没有文本内容可供解析');
    }

    // 调试：记录输入的文本数组
    console.group('📊 健康指标解析 - 输入验证')
    console.log('输入文本数组长度:', textArray.length)
    console.log('输入文本数组:', textArray)
    
    const fullText = textArray.join('\n');
    console.log('拼接后文本长度:', fullText.length)
    console.log('拼接后文本内容:', fullText)
    console.groupEnd()

    // 验证文本内容
    if (fullText.trim().length < 20) {
      throw new Error('文本内容过短，无法进行有效解析');
    }
    
    // 【调用场景：体检报告OCR文本解析为结构化健康指标】+【AI Chat Completions API - GPT-4模型智能解析】
    const prompt = `
你是一个专业的医学数据AI解析引擎，具备先进的模式识别和数据提取能力。

请运用AI智能算法，从以下体检报告文本中精确提取所有健康指标数据：

体检报告原始数据：
${fullText}

AI解析任务：
1. 智能文本识别：运用NLP技术识别所有包含数值的健康指标
2. 数据结构化提取：精确提取指标名称、数值、单位、参考范围
3. 智能状态判断：基于医学知识库自动判断指标状态
4. 数据完整性验证：确保提取数据的准确性和完整性

请严格按照以下JSON格式返回：
{
  "indicators": [
    {
      "name": "从文本中提取的指标名称",
      "value": "实际数值",
      "unit": "单位",
      "normalRange": "参考范围或正常值范围",
      "status": "normal/high/low/critical"
    }
  ]
}

AI智能状态判断算法：
- normal: AI算法判定数值在正常范围内
- high: 智能检测数值高于正常范围上限
- low: 算法识别数值低于正常范围下限  
- critical: AI预警系统判定数值严重偏离正常范围

AI技术要求：
1. 输出纯JSON数据结构，无markdown或解释文字
2. AI精确提取：仅提取文本中实际存在的指标，运用智能分词技术处理连续文本
3. 保持原始数据格式：指标名称完全按照原文（包括中英文、括号等）
4. 智能补全：运用AI医学知识库补充缺失的标准参考值（基于中国医学标准）
5. 算法优化：直接输出{开始，}结束的标准JSON格式
6. 智能识别OCR错误：自动修正常见的数字和单位识别错误
`;

    try {
      // 【调用场景：体检报告OCR文本解析为结构化健康指标】+【AI Chat Completions API - GPT-4模型智能解析】
      const response = await this.callAzureOpenAI([
        { role: 'user', content: prompt }
      ], 'gpt-4', 3000);
      
      // 清理AI响应，提取JSON部分
      let cleanedResponse = response.trim();
      
      // 如果响应包含markdown代码块，提取其中的JSON
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      // 移除可能的前缀文本
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🔍 AI响应内容:', cleanedResponse);
      
      const parsed = JSON.parse(cleanedResponse);
      const indicators = parsed.indicators || [];
      
      if (indicators.length === 0) {
        console.warn('⚠️ 未能识别到健康指标，可能不是体检报告或文本质量较差');
        // 返回空数组而不是抛出错误，让上层逻辑决定如何处理
        return [];
      }
      
      console.log(`📊 成功解析 ${indicators.length} 个健康指标`);
      return indicators;
      
    } catch (error) {
      console.error('健康指标解析失败:', error);
      console.error('原始AI响应:', error);
      throw new Error(`指标解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // Agent 3: AI 健康分析 with enhanced prompts
  async analyzeHealthData(indicators: HealthIndicator[], userProfile: any): Promise<AnalysisResult> {
    if (!indicators || indicators.length === 0) {
      console.warn('⚠️ 没有健康指标数据，返回默认分析结果');
      return {
        overallStatus: '无法评估',
        healthScore: 0,
        summary: '由于未能识别到有效的健康指标，无法进行健康分析。请确认上传的是清晰的体检报告图片。',
        abnormalIndicators: [],
        recommendations: {
          lifestyle: ['请上传清晰的体检报告以获得专业分析'],
          diet: [],
          exercise: [],
          followUp: ['建议重新上传体检报告图片']
        },
        risks: []
      };
    }

    // 导入用户上下文构建器
    const { getUserContextString } = await import('@/lib/utils/user-context-builder');
    const userContext = getUserContextString(userProfile, 'analysis');
    
    console.log('👤 [AzureHealthAI] analyzeHealthData 用户档案:', userProfile ? '已提供' : '未提供');
    console.log('🔍 [AzureHealthAI] analyzeHealthData 处理后的用户上下文:', userContext);

    // 【调用场景：基于解析出的健康指标进行个性化健康分析】+【AI Chat Completions API - GPT-4.1模型医学专业分析】
    let prompt = `你是一位集成了最新医学研究成果的AI健康分析专家，具备深度学习医学知识库和大数据分析能力。

请运用AI智能分析技术，对以下体检数据进行专业评估：

体检指标数据：
${JSON.stringify(indicators, null, 2)}`;

    // 只在有用户信息时添加用户上下文
    if (userContext && userContext !== '暂无详细健康档案信息') {
      prompt += `

用户健康档案：
${userContext}

请基于AI算法进行个性化风险评估，结合用户的年龄、性别、既往病史等因素，计算健康风险概率和预测模型。`;
    }

    prompt += `

请按以下JSON格式返回AI智能分析报告：
{
  "overallStatus": "优秀/良好/注意/建议就医",
  "healthScore": 基于AI算法综合评估的健康评分(0-100),
  "summary": "AI智能分析：包含数据匹配度、风险预测、趋势分析等专业判断，体现AI分析的深度和准确性，控制在500字以内",
  "abnormalIndicators": [
    {
      "name": "指标名称",
      "value": "数值",
      "unit": "单位",
      "normalRange": "正常范围",
      "status": "high/low/critical"
    }
  ],
  "recommendations": {
    "lifestyle": ["生活方式建议"],
    "diet": ["饮食建议"],
    "exercise": ["运动建议"],
    "followUp": ["复查建议"]
  },
  "risks": [
    {
      "type": "风险类型",
      "probability": "低/中/高",
      "description": "风险描述"
    }
  ]
}

AI分析要求：
1. 健康评分采用AI算法模型，综合权重分析各项指标，范围0-100分
2. 异常指标识别采用智能阈值判断，精确标识偏离正常范围的项目
3. 个性化建议基于AI学习的海量医学数据，针对性强且可执行
4. 风险评估运用预测算法，基于统计学模型给出概率判断
5. 分析报告体现AI特色：数据驱动、模式识别、趋势预测
6. 在summary中强调AI分析的技术优势和准确性
7. 对于缺失的医学标准，运用AI医学知识库自动补充：
   - 血液指标：智能识别并补充标准参考范围
   - 生理指标：基于年龄性别进行个性化范围调整
   - 复合指标：运用AI算法计算标准值
8. 体现AI分析的专业性：包含置信度、匹配度、预测准确性等概念
9. 只返回JSON格式，突出AI分析的科技感和专业度

现在开始分析体检数据，直接返回JSON格式的分析结果。`;

    try {
      // 【调用场景：基于解析出的健康指标进行个性化健康分析】+【AI Chat Completions API - GPT-4.1模型医学专业分析】
      const response = await this.callAzureOpenAI([
        { role: 'system', content: prompt }
      ], 'gpt-4.1', 4000);
      
      // 清理AI响应，提取JSON部分
      let cleanedResponse = response.trim();
      
      // 如果响应包含markdown代码块，提取其中的JSON
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      // 移除可能的前缀文本
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🔍 AI分析响应内容:', cleanedResponse);
      
      const analysis = JSON.parse(cleanedResponse);
      
      // 验证返回的数据结构
      if (!analysis.overallStatus || !analysis.summary) {
        throw new Error('AI分析返回的数据格式不完整');
      }
      
      console.log(`🤖 AI分析完成，健康得分: ${analysis.healthScore}`);
      return analysis;
      
    } catch (error) {
      console.error('AI健康分析失败:', error);
      console.error('原始AI响应:', error);
      throw new Error(`AI分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // Agent 4: AI 健康问答
  async healthChat(question: string, userContext: any, chatHistory: any[] = []): Promise<string> {
    console.log('🤖 [AzureHealthAI] 开始健康问答处理');
    console.log('📝 [AzureHealthAI] 用户问题:', question);
    console.log('👤 [AzureHealthAI] 用户上下文:', userContext ? '已提供' : '未提供');
    
    // 导入用户上下文构建器
    const { getUserContextString } = await import('@/lib/utils/user-context-builder');
    const userContextString = getUserContextString(userContext, 'chat');
    console.log('🔍 [AzureHealthAI] 处理后的用户上下文:', userContextString);

    // 【调用场景：健康问答对话和指标解读互动】+【AI Chat Completions API - GPT-4.1模型智能问答】
    let systemPrompt = `你是一位专业的健康咨询AI助手，为用户提供个性化的健康建议。

回答原则：
1. 基于用户具体情况给出个性化建议
2. 使用通俗易懂的语言，避免过多医学术语
3. 涉及严重症状时建议就医
4. 不能替代专业医疗诊断
5. 保持客观和谨慎的态度
6. 回答要简洁明了，控制在200-400字以内
7. 提供实用的生活建议和改善措施
8. 如果是健康指标解读，要说明指标含义、当前状态和关注建议`;

    // 只在有用户信息时添加用户背景
    if (userContextString && userContextString !== '新用户') {
      systemPrompt += `\n\n用户基本情况：${userContextString}
请结合用户的实际情况给出针对性的建议，特别关注与用户年龄、性别、既往病史相关的健康风险。`;
      console.log('✅ [AzureHealthAI] 已添加个性化用户背景');
    } else {
      systemPrompt += `\n\n当前用户尚未完善健康档案，请提供通用的健康建议。`;
      console.log('ℹ️ [AzureHealthAI] 使用通用健康建议模式');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-6), // 保留最近3轮对话
      { role: 'user', content: question }
    ];

    console.log('📤 [AzureHealthAI] 准备发送到AI，消息数量:', messages.length);
    console.log('🎯 [AzureHealthAI] 系统提示词长度:', systemPrompt.length);

    try {
      // 【调用场景：健康问答对话和指标解读互动】+【AI Chat Completions API - GPT-4.1模型智能问答】
      const response = await this.callAzureOpenAI(messages, 'gpt-4.1', 1500);
      console.log('✅ [AzureHealthAI] 健康问答成功，响应长度:', response.length);
      console.log('📋 [AzureHealthAI] AI响应预览:', response.substring(0, 100) + '...');
      return response;
    } catch (error) {
      console.error('❌ [AzureHealthAI] 健康问答失败:', error);
      return '抱歉，我现在无法回答您的问题，请稍后再试。如果是紧急情况，请及时就医。';
    }
  }

  // Agent编排：完整处理流程
  async processHealthReport(file: File, userProfile: any): Promise<{
    success: boolean;
    data?: AnalysisResult;
    error?: string;
  }> {
    try {
      console.log('🔍 开始Azure OCR文本提取...');
      const ocrResult = await this.extractTextFromImage(file);
      
      if (ocrResult.extractedText.length === 0) {
        throw new Error('未能从图片中提取到文字，请确保图片清晰可读');
      }

      console.log('📊 解析健康指标...');
      const indicators = await this.parseHealthIndicators(ocrResult.extractedText);

      console.log('🤖 AI分析中...');
      const analysis = await this.analyzeHealthData(indicators, userProfile);

      console.log('✅ 报告处理完成');
      return { success: true, data: analysis };

    } catch (error) {
      console.error('❌ 报告处理失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '处理过程中出现未知错误' 
      };
    }
  }

  // AI API调用 - 改进的错误处理和重试机制
  private async callAzureOpenAI(
    messages: any[], 
    model: string = 'gpt-4', 
    maxTokens: number = 2000,
    maxRetries: number = 3
  ): Promise<string> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 调用AI (尝试 ${attempt}/${maxRetries})...`);
        
        // 确保端点格式正确 - 根据 AI 官方文档
        const endpoint = this.azureOpenAIEndpoint.endsWith('/') 
          ? this.azureOpenAIEndpoint.slice(0, -1) 
          : this.azureOpenAIEndpoint;
        
        // 【调用场景：AI API底层调用封装】+【AI Chat Completions REST API接口】
        const response = await fetch(
          `${endpoint}/openai/deployments/${this.azureOpenAIDeployment}/chat/completions?api-version=${this.azureOpenAIVersion}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.azureOpenAIKey,
              'User-Agent': 'CEE-HealthAI/1.0',
            },
            body: JSON.stringify({
              messages,
              temperature: 0.3,
              max_tokens: maxTokens,
              top_p: 0.9,
              frequency_penalty: 0,
              presence_penalty: 0,
              stream: false,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`AI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('AI 返回的数据格式不正确');
        }

        const content = data.choices[0].message.content;
        if (!content) {
          throw new Error('AI 返回空内容');
        }

        console.log('✅ AI 调用成功');
        return content;

      } catch (error) {
        console.error(`AI 尝试 ${attempt} 失败:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`AI调用失败 (${maxRetries}次尝试): ${error instanceof Error ? error.message : '未知错误'}`);
        }
        
        // 等待后重试，指数退避
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }

    throw new Error('AI调用完全失败');
  }
}

export default AzureHealthAISystem;
export type { HealthIndicator, AnalysisResult }; 