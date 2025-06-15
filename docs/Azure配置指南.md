# Azure健康AI系统配置指南

## 🎯 AI + Azure Computer Vision 方案

### 为什么推荐Azure生态？

1. **统一计费** - 一个Azure账户管理所有服务
2. **地域就近** - Azure在中国有数据中心，访问速度快
3. **企业级安全** - 符合GDPR、SOC等安全标准
4. **API兼容性** - OpenAI标准API格式，易于集成

## 🔧 必需的环境变量配置

### AI 配置
```env
# AI服务端点
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/

# AI API密钥
NEXT_PUBLIC_AZURE_OPENAI_KEY=your-azure-openai-api-key

# API版本（推荐最新版本）
NEXT_PUBLIC_AZURE_OPENAI_VERSION=2024-02-15-preview

# 模型部署名称（你在Azure中创建的部署名）
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT=your-gpt-4-deployment-name

# 可选：GPT-3.5模型部署（用于问答功能，成本更低）
NEXT_PUBLIC_AZURE_OPENAI_GPT35_DEPLOYMENT=your-gpt-35-turbo-deployment-name
```

### Azure Computer Vision 配置
```env
# Azure Computer Vision服务端点
NEXT_PUBLIC_AZURE_VISION_ENDPOINT=https://your-vision-resource.cognitiveservices.azure.com/

# Azure Computer Vision API密钥
NEXT_PUBLIC_AZURE_VISION_KEY=your-azure-vision-api-key
```

## 🚀 Azure服务创建步骤

### 1. 创建AI服务

```bash
# 1. 登录Azure门户
# 2. 创建资源 → AI + 机器学习 → AI
# 3. 配置基本信息：
#    - 订阅：选择你的订阅
#    - 资源组：创建新的或选择现有的
#    - 区域：选择 East US、West Europe 等支持GPT-4的区域
#    - 名称：your-openai-resource-name
#    - 定价层：标准 S0

# 4. 部署模型：
#    - 进入AI Studio
#    - 模型部署 → 创建新部署
#    - 模型：gpt-4（用于分析）、gpt-35-turbo（用于问答）
#    - 部署名称：自定义，如 gpt-4-health、gpt-35-turbo-chat
```

### 2. 创建Azure Computer Vision服务

```bash
# 1. Azure门户 → 创建资源 → AI + 机器学习 → Computer Vision
# 2. 配置信息：
#    - 订阅：选择你的订阅
#    - 资源组：与OpenAI同一个资源组
#    - 区域：与OpenAI同一区域
#    - 名称：your-vision-resource-name
#    - 定价层：免费F0（每月1000次）或标准S1
```

### 3. 获取API密钥和端点

```bash
# AI：
# 1. 进入你的OpenAI资源
# 2. 密钥和终结点 → 复制密钥1和终结点
# 3. 终结点格式：https://your-resource-name.openai.azure.com/

# Azure Computer Vision：
# 1. 进入你的Vision资源  
# 2. 密钥和终结点 → 复制密钥1和终结点
# 3. 终结点格式：https://your-vision-resource.cognitiveservices.azure.com/
```

## 📊 OCR方案对比与推荐

### 主流OCR服务对比

| 服务 | 优势 | 劣势 | 月费用(1000次) | 中文识别 |
|------|------|------|----------------|----------|
| **Azure Computer Vision** | 与OpenAI同生态、企业级 | 相对贵 | $1 | ⭐⭐⭐⭐⭐ |
| **Google Vision API** | 准确率最高、文档完善 | 需要翻墙 | $1.5 | ⭐⭐⭐⭐ |
| **阿里云OCR** | 国内访问快、中文优化 | API功能限制 | ¥1.5 | ⭐⭐⭐⭐⭐ |
| **百度OCR** | 免费额度大 | 商用限制多 | 免费1000/天 | ⭐⭐⭐⭐⭐ |
| **腾讯云OCR** | 性价比高 | 功能相对基础 | ¥1.2 | ⭐⭐⭐⭐ |

### 推荐方案

#### 🥇 **首选：Azure Computer Vision + AI**
- ✅ 统一Azure生态，管理简单
- ✅ 企业级安全和稳定性
- ✅ 地域就近，访问速度快
- ✅ 一站式计费和支持

#### 🥈 **备选：阿里云OCR + AI**
- ✅ 中文识别优秀
- ✅ 国内访问稳定
- ✅ 成本更低
- ❌ 需要管理两个云服务商

#### 🥉 **预算优先：百度OCR + AI**
- ✅ 免费额度大（1000次/天）
- ✅ 中文支持好
- ❌ 商用需要申请
- ❌ API稳定性一般

## 💰 成本估算

### Azure方案成本（月）
```
AI（GPT-4）:
- 输入：$0.03/1K tokens × 1000 tokens × 100次 = $3
- 输出：$0.06/1K tokens × 500 tokens × 100次 = $3
小计：$6

Azure Computer Vision:
- OCR处理：$1/1K transactions × 100次 = $0.1

总计：约$6.1/月（100次解读）
```

### 对比其他方案
```
Google方案：约$6.15/月
阿里云方案：约￥30/月（$4.2）
百度方案：约￥0/月（免费额度内）
```

## 🛠️ 代码使用示例

### 初始化Azure AI系统
```typescript
import AzureHealthAISystem from '@/lib/agents/azure-health-ai-system'

const azureAI = new AzureHealthAISystem({
  azureOpenAIEndpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT!,
  azureOpenAIKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY!,
  azureOpenAIVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_VERSION!,
  azureOpenAIDeployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT!,
  azureVisionEndpoint: process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT!,
  azureVisionKey: process.env.NEXT_PUBLIC_AZURE_VISION_KEY!
})
```

### 处理体检报告
```typescript
const handleReportAnalysis = async (file: File) => {
  const userProfile = {
    age: 35,
    gender: '男',
    medicalHistory: '无'
  }
  
  const result = await azureAI.processHealthReport(file, userProfile)
  
  if (result.success) {
    console.log('分析结果：', result.data)
  } else {
    console.error('分析失败：', result.error)
  }
}
```

## ⚠️ 重要注意事项

### 1. API密钥安全
```typescript
// ❌ 不要在前端直接暴露密钥
const apiKey = 'your-secret-key'

// ✅ 使用环境变量
const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY

// ✅ 生产环境建议使用API代理
export async function POST(request: Request) {
  // 在服务端调用Azure API，不暴露密钥
}
```

### 2. 请求频率限制
```typescript
// AI默认限制：
// - GPT-4: 20,000 tokens/minute
// - GPT-3.5: 120,000 tokens/minute
// - 建议添加重试和限流机制
```

### 3. 错误处理
```typescript
try {
  const result = await azureAI.processHealthReport(file, userProfile)
} catch (error) {
  // 根据错误类型提供用户友好的提示
  if (error.message.includes('quota')) {
    setError('今日额度已用完，请明天再试')
  } else if (error.message.includes('network')) {
    setError('网络连接失败，请检查网络')
  } else {
    setError('处理失败，请稍后重试')
  }
}
```

## 🎯 总结

使用Azure生态的优势：
1. **一站式服务** - OpenAI + Computer Vision 统一管理
2. **企业级稳定** - 99.9%可用性保证  
3. **合规安全** - 符合各种安全标准
4. **成本透明** - 统一计费，成本可控

这个方案特别适合企业级应用和需要长期稳定服务的项目！🚀 