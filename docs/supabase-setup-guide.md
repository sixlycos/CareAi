# Supabase 健康管理系统设置指南

## 📋 概述

本文档将指导您完成Supabase数据库的完整设置，以支持健康管理系统的所有功能。

## 🗄️ 数据存储方案架构

### 核心表结构

1. **user_profiles** - 用户档案表
   - 存储用户的健康统计信息
   - 包含已分析报告数、咨询次数、健康得分等

2. **health_reports** - 健康报告表
   - 存储用户上传的体检报告
   - 支持文本和文件存储

3. **report_analyses** - 报告分析表
   - 存储AI分析结果
   - 包含结构化数据和建议

4. **ai_consultations** - AI咨询表
   - 存储用户与AI的对话记录
   - 支持不同类型的咨询

5. **health_metrics** - 健康指标表
   - 存储各种健康指标数据
   - 支持时间序列分析

### 数据关系图

```
用户 (auth.users)
├── 用户档案 (user_profiles) [1:1]
├── 健康报告 (health_reports) [1:N]
│   └── 报告分析 (report_analyses) [1:1]
├── AI咨询 (ai_consultations) [1:N]
└── 健康指标 (health_metrics) [1:N]
```

## 🚀 设置步骤

### 步骤 1: 创建Supabase项目

1. 访问 [Supabase控制台](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 选择组织并填写项目信息
4. 等待项目创建完成

### 步骤 2: 执行数据库脚本

1. 在Supabase控制台中，进入 "SQL Editor"
2. 复制 `docs/supabase-schema.sql` 文件中的所有内容
3. 粘贴到SQL编辑器中并执行
4. 确认所有表和索引创建成功

### 步骤 3: 设置存储桶

1. 进入 "Storage" 页面
2. 创建新的存储桶，命名为 `health-reports`
3. 设置存储桶为公开访问（如需要）
4. 配置存储策略：

```sql
-- 创建存储桶策略
CREATE POLICY "用户只能上传自己的文件" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'health-reports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "用户只能查看自己的文件" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'health-reports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "用户只能删除自己的文件" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'health-reports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
```

### 步骤 4: 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 步骤 5: 配置认证

1. 在Supabase控制台进入 "Authentication"
2. 配置邮箱认证提供商
3. 设置重定向URL：`http://localhost:3000/auth/callback`
4. 可选：配置第三方登录（Google、GitHub等）

## 📊 数据存储策略

### 文本数据存储

- **纯文字报告内容**：存储在 `health_reports.raw_content` 字段
- **AI分析结果**：存储在 `report_analyses.ai_analysis` 字段
- **结构化数据**：使用JSONB格式存储在相应字段中

### 文件存储

- **报告文件**：上传到Supabase Storage的 `health-reports` 桶
- **文件路径格式**：`{user_id}/{report_id}/{filename}`
- **支持格式**：PDF、图片、Word文档、纯文本

### 安全考虑

1. **行级安全（RLS）**：所有表都启用了RLS，确保用户只能访问自己的数据
2. **存储权限**：文件存储也有相应的权限控制
3. **数据验证**：在应用层和数据库层都有数据验证

## 🔧 维护和优化

### 性能优化

1. **索引策略**：所有常用查询字段都已建立索引
2. **查询优化**：使用合适的查询模式避免N+1问题
3. **缓存策略**：可考虑在应用层实现查询缓存

### 备份策略

1. **自动备份**：Supabase提供自动备份功能
2. **数据导出**：定期导出重要数据
3. **灾难恢复**：制定数据恢复计划

### 监控指标

1. **数据库性能**：监控查询响应时间
2. **存储使用量**：监控文件存储空间
3. **用户活跃度**：分析用户行为模式

## 📈 扩展功能

### 高级分析

```sql
-- 创建用户健康趋势分析视图
CREATE VIEW user_health_trends AS
SELECT 
    user_id,
    DATE_TRUNC('month', measurement_date) as month,
    metric_type,
    AVG(value) as avg_value,
    COUNT(*) as measurement_count
FROM health_metrics
GROUP BY user_id, month, metric_type
ORDER BY user_id, month DESC;
```

### 数据聚合

```sql
-- 创建系统统计信息函数
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_users INTEGER,
    total_reports INTEGER,
    total_consultations INTEGER,
    avg_health_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM user_profiles) as total_users,
        (SELECT COUNT(*)::INTEGER FROM health_reports) as total_reports,
        (SELECT COUNT(*)::INTEGER FROM ai_consultations) as total_consultations,
        (SELECT AVG(health_score) FROM user_profiles WHERE health_score IS NOT NULL) as avg_health_score;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 数据迁移

如果需要从其他系统迁移数据，可以使用以下策略：

1. **导出现有数据**：从原系统导出CSV或JSON格式数据
2. **数据清洗**：清理和规范化数据格式
3. **批量导入**：使用Supabase提供的批量导入功能
4. **数据验证**：导入后验证数据完整性

## 🛟 故障排除

### 常见问题

1. **RLS策略问题**：确保用户已正确认证且策略配置正确
2. **存储权限问题**：检查存储桶策略是否正确设置
3. **性能问题**：检查查询是否使用了合适的索引

### 调试工具

1. **Supabase日志**：查看实时日志了解错误信息
2. **SQL编辑器**：直接执行查询测试数据库操作
3. **API文档**：参考Supabase API文档了解最佳实践

## 📞 技术支持

如遇到问题，可以：

1. 查看Supabase官方文档
2. 访问Supabase社区论坛
3. 检查项目中的日志文件
4. 联系项目维护者

---

**注意**：请确保在生产环境中使用时，所有敏感信息都已妥善保护，并定期更新安全配置。 