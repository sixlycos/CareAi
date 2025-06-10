// 健康AI多Agent系统 - 纯前端实现

interface HealthIndicator {
  name: string;
  value: number | string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
}

interface AnalysisResult {
  overallStatus: '优秀' | '良好' | '注意' | '建议就医';
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

class HealthAISystem {
  private openaiApiKey: string;
  private visionApiKey: string;

  constructor(openaiKey: string, visionKey: string) {
    this.openaiApiKey = openaiKey;
    this.visionApiKey = visionKey;
  }

  // Agent 1: OCR文本提取
  async extractTextFromImage(file: File): Promise<string[]> {
    try {
      // 转换文件为base64
      const base64Image = await this.fileToBase64(file);
      
      // 调用Google Vision API
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.visionApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image.split(',')[1] // 去掉data:image/jpeg;base64,前缀
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 50
            }]
          }]
        })
      });

      const result = await response.json();
      
      if (result.responses?.[0]?.textAnnotations) {
        return result.responses[0].textAnnotations.map((annotation: any) => annotation.description);
      }
      
      return [];
    } catch (error) {
      console.error('OCR处理失败:', error);
      return [];
    }
  }

  // Agent 2: 健康指标识别与解析
  async parseHealthIndicators(textArray: string[]): Promise<HealthIndicator[]> {
    const fullText = textArray.join(' ');
    
    // 定义健康指标关键词
    const healthKeywords = {
      '血常规': ['白细胞', 'WBC', '红细胞', 'RBC', '血红蛋白', 'HGB', '血小板', 'PLT'],
      '血脂': ['总胆固醇', 'TC', '甘油三酯', 'TG', '高密度脂蛋白', 'HDL', '低密度脂蛋白', 'LDL'],
      '肝功能': ['ALT', 'AST', '总胆红素', '白蛋白', 'ALB'],
      '肾功能': ['尿素氮', 'BUN', '肌酐', 'Cr', '尿酸', 'UA'],
      '血糖': ['空腹血糖', 'FBG', '糖化血红蛋白', 'HbA1c']
    };

    const indicators: HealthIndicator[] = [];
    
    // 使用AI来解析复杂的指标数据
    const prompt = `
请从以下体检报告文本中提取健康指标数据，返回JSON格式：

文本内容：
${fullText}

请识别并提取以下格式的数据：
{
  "indicators": [
    {
      "name": "指标名称",
      "value": "数值",
      "unit": "单位",
      "normalRange": "正常范围",
      "status": "normal/high/low/critical"
    }
  ]
}

只返回JSON，不要其他解释。
`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-3.5-turbo');
      const parsed = JSON.parse(response);
      return parsed.indicators || [];
    } catch (error) {
      console.error('指标解析失败:', error);
      return [];
    }
  }

  // Agent 3: AI健康分析
  async analyzeHealthData(indicators: HealthIndicator[], userProfile: any): Promise<AnalysisResult> {
    const prompt = `
你是一位专业的全科医生，请根据以下体检数据提供专业分析：

用户信息：
- 年龄：${userProfile.age || '未知'}岁
- 性别：${userProfile.gender || '未知'}
- 既往病史：${userProfile.medicalHistory || '无'}

体检指标：
${JSON.stringify(indicators, null, 2)}

请按以下JSON格式返回分析结果：
{
  "overallStatus": "优秀/良好/注意/建议就医",
  "healthScore": 85,
  "summary": "整体健康状况简要总结",
  "abnormalIndicators": [指标异常的详细信息],
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

请使用通俗易懂的语言，专业但不失温度。只返回JSON格式，不要其他内容。
`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-4');
      return JSON.parse(response);
    } catch (error) {
      console.error('AI分析失败:', error);
      return {
        overallStatus: '建议就医',
        healthScore: 0,
        summary: '抱歉，AI分析过程中出现错误，请稍后重试',
        abnormalIndicators: [],
        recommendations: { lifestyle: [], diet: [], exercise: [], followUp: [] },
        risks: []
      };
    }
  }

  // Agent 4: 健康问答
  async healthChat(question: string, userContext: any, chatHistory: any[] = []): Promise<string> {
    const systemPrompt = `
你是一位专业的健康咨询AI助手，基于用户的健康档案回答问题。

用户健康背景：
- 年龄：${userContext.age || '未知'}岁
- 性别：${userContext.gender || '未知'}
- 最近体检状况：${userContext.latestHealthStatus || '暂无数据'}
- 既往病史：${userContext.medicalHistory || '无'}

回答原则：
1. 基于用户具体情况给出个性化建议
2. 使用通俗易懂的语言
3. 涉及严重症状时建议就医
4. 不能替代专业医疗诊断
5. 保持客观和谨慎
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-6), // 保留最近3轮对话
      { role: 'user', content: question }
    ];

    try {
      return await this.callOpenAI(messages, 'gpt-3.5-turbo');
    } catch (error) {
      console.error('健康问答失败:', error);
      return '抱歉，我现在无法回答您的问题，请稍后再试。';
    }
  }

  // Agent编排：完整的报告处理流程
  async processHealthReport(file: File, userProfile: any): Promise<{
    success: boolean;
    data?: AnalysisResult;
    error?: string;
  }> {
    try {
      // 1. OCR文本提取
      console.log('🔍 开始OCR文本提取...');
      const extractedText = await this.extractTextFromImage(file);
      
      if (extractedText.length === 0) {
        throw new Error('未能从图片中提取到文字，请确保图片清晰可读');
      }

      // 2. 健康指标解析
      console.log('📊 解析健康指标...');
      const indicators = await this.parseHealthIndicators(extractedText);
      
      if (indicators.length === 0) {
        throw new Error('未能识别到有效的健康指标，请确认上传的是体检报告');
      }

      // 3. AI健康分析
      console.log('🤖 AI分析中...');
      const analysis = await this.analyzeHealthData(indicators, userProfile);

      // 4. 保存到本地存储
      await this.saveToLocalStorage('health_report', {
        timestamp: Date.now(),
        fileName: file.name,
        extractedText,
        indicators,
        analysis,
        userProfile
      });

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

  // 工具函数
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private async callOpenAI(messages: any, model: string = 'gpt-3.5-turbo'): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model,
        messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async saveToLocalStorage(key: string, data: any): Promise<void> {
    try {
      // 使用IndexedDB存储大量数据
      const dbName = 'HealthAI';
      const request = indexedDB.open(dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['reports'], 'readwrite');
        const store = transaction.objectStore('reports');
        store.add({ ...data, key, id: Date.now() });
      };
    } catch (error) {
      console.error('数据保存失败:', error);
      // 降级到localStorage
      localStorage.setItem(`${key}_${Date.now()}`, JSON.stringify(data));
    }
  }
}

export default HealthAISystem;
export type { HealthIndicator, AnalysisResult }; 