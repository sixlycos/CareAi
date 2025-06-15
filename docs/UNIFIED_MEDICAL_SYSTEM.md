# 统一医疗报告系统 (Unified Medical Reports System)

## 概述

本系统已升级为统一医疗报告系统，能够处理多种类型的医疗报告：

- **现代医学报告**: 血检、尿检等数值化指标
- **影像学报告**: CT、MRI、X光等影像检查结果  
- **病理学报告**: 活检、细胞学检查等病理诊断
- **中医诊断报告**: 四诊、证型、方药等中医内容
- **混合报告**: 包含多种类型内容的综合报告

## 数据库架构

### 核心表结构

#### 1. health_reports (健康报告表)
- 添加了 `report_type` 字段，支持报告类型分类
- 支持的类型: `modern`, `tcm`, `imaging`, `pathology`, `mixed`

#### 2. medical_data (医疗数据表) - 新增
统一存储所有类型的医疗数据：
```sql
- numerical_indicators: JSONB  -- 数值指标
- imaging_findings: JSONB      -- 影像学发现  
- pathology_results: JSONB     -- 病理结果
- tcm_diagnosis: JSONB         -- 中医诊断
- clinical_diagnosis: JSONB    -- 临床诊断
- examination_info: JSONB      -- 检查信息
- raw_text: TEXT               -- 原始文本
- ai_analysis: JSONB           -- AI分析结果
```

#### 3. health_reminders (健康提醒表) - 新增
- 支持基于报告的健康提醒
- 优先级管理和完成状态跟踪

### 数据迁移

运行以下SQL文件完成数据库升级：
```bash
# 在Supabase SQL编辑器中执行
database/unified-medical-schema.sql
```

## AI分析系统

### 智能报告类型识别
系统自动识别上传报告的类型：
```typescript
const reportType = await analyzer.identifyReportType(content)
```

### 统一数据解析
根据报告类型智能解析相应的数据结构：
```typescript
const medicalData = await analyzer.parseUnifiedMedicalData(content, reportType)
```

### 多维度分析
- **数值指标分析**: 异常值检测、趋势分析
- **影像学分析**: 发现解读、临床意义
- **病理分析**: 诊断解读、预后评估  
- **中医分析**: 证型分析、体质评估
- **综合分析**: 多维度健康评估

## 前端组件

### UnifiedAnalysisDisplay
统一的分析结果显示组件，根据报告类型动态展示：
```tsx
<UnifiedAnalysisDisplay analysis={analysisResult} />
```

### 支持的显示模块
- 概览: 健康评分、总结、风险因素
- 详细发现: 分类显示各类型数据
- 建议: 即时建议、生活方式、随访、中医调理
- 趋势: 健康指标变化趋势

## API接口

### 数据库操作
```typescript
// 报告操作
reportOperations.createReport(data)
reportOperations.getReportWithData(reportId)

// 医疗数据操作
medicalDataOperations.createMedicalData(data)
medicalDataOperations.getMedicalData(reportId)

// 分析操作
analysisOperations.createAnalysis(data)
analysisOperations.getReportAnalysis(reportId)

// 提醒操作
reminderOperations.createReminder(data)
reminderOperations.getUserReminders(userId)
```

### Hooks
```typescript
// 统一分析Hook
const { 
  isAnalyzing, 
  analysisResult, 
  analyzeReport 
} = useAIAnalysis()
```

## 环境配置

添加以下环境变量：
```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
```

## 使用流程

### 1. 报告上传
```typescript
// 用户上传报告文件
const report = await reportOperations.createReport({
  user_id: userId,
  title: fileName,
  raw_content: extractedText
})
```

### 2. 智能分析
```typescript
// 自动触发AI分析
await analyzeReport(report.id, userId, extractedText, userProfile)
```

### 3. 结果展示
```typescript
// 显示分析结果
<UnifiedAnalysisDisplay analysis={analysisResult} />
```

### 4. 健康管理
```typescript
// 生成健康提醒
await reminderOperations.createReminder({
  user_id: userId,
  report_id: reportId,
  reminder_type: 'followup',
  title: '复查提醒',
  due_date: futureDate
})
```

## 优势特性

1. **统一架构**: 一套系统处理所有类型医疗报告
2. **智能识别**: 自动识别报告类型，无需用户手动分类
3. **灵活存储**: JSONB字段支持任意结构的医疗数据
4. **中西结合**: 同时支持现代医学和传统中医
5. **个性化分析**: 基于用户档案的定制化健康建议
6. **趋势追踪**: 长期健康指标变化监控
7. **智能提醒**: 基于分析结果的健康管理提醒

## 扩展性

系统设计具有良好的扩展性：
- 新增报告类型只需扩展 `report_type` 枚举
- 新增分析维度只需在 `medical_data` 中添加JSONB字段
- 新增AI分析能力只需在 `HealthAnalyzer` 中添加方法

## 性能优化

- 数据库索引优化查询性能
- JSONB字段支持高效的结构化数据查询
- RLS策略确保数据安全
- 视图和函数简化复杂查询

## 注意事项

1. **数据迁移**: 升级前请备份现有数据
2. **环境配置**: 确保Azure OpenAI配置正确
3. **权限设置**: 检查Supabase RLS策略
4. **文件处理**: 确保文件上传和OCR功能正常

## 故障排除

### 常见问题
1. **AI分析失败**: 检查Azure OpenAI配置和网络连接
2. **数据库错误**: 确认迁移脚本执行成功
3. **权限问题**: 检查RLS策略和用户权限
4. **类型错误**: 确认TypeScript类型定义更新 