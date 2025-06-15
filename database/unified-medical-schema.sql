-- 统一医疗报告数据库架构迁移脚本
-- 执行前请确保备份现有数据

-- 1. 更新 health_reports 表，添加新的报告类型
ALTER TABLE health_reports 
ADD COLUMN IF NOT EXISTS report_type VARCHAR(20) DEFAULT 'mixed' 
CHECK (report_type IN ('modern', 'tcm', 'imaging', 'pathology', 'mixed'));

-- 2. 创建统一的医疗数据表 (medical_data)
CREATE TABLE IF NOT EXISTS medical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES health_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 数值指标 (现代医学检查结果)
    numerical_indicators JSONB DEFAULT NULL,
    
    -- 影像学发现
    imaging_findings JSONB DEFAULT NULL,
    
    -- 病理结果
    pathology_results JSONB DEFAULT NULL,
    
    -- 中医诊断
    tcm_diagnosis JSONB DEFAULT NULL,
    
    -- 临床诊断
    clinical_diagnosis JSONB DEFAULT NULL,
    
    -- 检查信息
    examination_info JSONB DEFAULT NULL,
    
    -- 原始文本
    raw_text TEXT,
    
    -- AI分析结果
    ai_analysis JSONB DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 更新 report_analyses 表，添加新字段
ALTER TABLE report_analyses 
ADD COLUMN IF NOT EXISTS report_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(20);

-- 4. 创建健康提醒表 (health_reminders)
CREATE TABLE IF NOT EXISTS health_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES health_reports(id) ON DELETE SET NULL,
    
    reminder_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 更新 ai_consultations 表，支持更多咨询类型
ALTER TABLE ai_consultations 
ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(30) DEFAULT 'general' 
CHECK (conversation_type IN ('general', 'report_based', 'follow_up', 'tcm_consultation'));

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_medical_data_report_id ON medical_data(report_id);
CREATE INDEX IF NOT EXISTS idx_medical_data_user_id ON medical_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_user_id ON health_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_due_date ON health_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_health_reports_type ON health_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_analyses_type ON report_analyses(report_type);

-- 7. 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_medical_data_updated_at ON medical_data;
CREATE TRIGGER update_medical_data_updated_at 
    BEFORE UPDATE ON medical_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_reminders_updated_at ON health_reminders;
CREATE TRIGGER update_health_reminders_updated_at 
    BEFORE UPDATE ON health_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 设置RLS (Row Level Security) 策略
ALTER TABLE medical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reminders ENABLE ROW LEVEL SECURITY;

-- medical_data 表的RLS策略
CREATE POLICY "Users can only access their own medical data" ON medical_data
    FOR ALL USING (auth.uid() = user_id);

-- health_reminders 表的RLS策略  
CREATE POLICY "Users can only access their own reminders" ON health_reminders
    FOR ALL USING (auth.uid() = user_id);

-- 9. 数据迁移：将现有 tcm_reports 数据迁移到新架构 (如果存在)
-- 注意：这部分需要根据实际的 tcm_reports 表结构调整
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tcm_reports') THEN
        -- 迁移 tcm_reports 数据到 medical_data
        INSERT INTO medical_data (report_id, user_id, tcm_diagnosis, raw_text, created_at, updated_at)
        SELECT 
            report_id,
            user_id,
            jsonb_build_object(
                'inspection', inspection,
                'inquiry', inquiry, 
                'palpation', palpation,
                'auscultation', auscultation,
                'syndrome', tcm_diagnosis->>'syndrome',
                'disease', tcm_diagnosis->>'disease',
                'constitution', tcm_diagnosis->>'constitution'
            ),
            notes,
            created_at,
            updated_at
        FROM tcm_reports;
        
        -- 更新对应的 health_reports 表的报告类型
        UPDATE health_reports 
        SET report_type = 'tcm' 
        WHERE id IN (SELECT DISTINCT report_id FROM tcm_reports);
        
        -- 可选：删除旧的 tcm_reports 表 (请谨慎操作)
        -- DROP TABLE tcm_reports;
    END IF;
END
$$;

-- 10. 创建有用的视图
CREATE OR REPLACE VIEW user_health_summary AS
SELECT 
    u.id as user_id,
    COUNT(hr.id) as total_reports,
    COUNT(CASE WHEN hr.report_type = 'modern' THEN 1 END) as modern_reports,
    COUNT(CASE WHEN hr.report_type = 'tcm' THEN 1 END) as tcm_reports,
    COUNT(CASE WHEN hr.report_type = 'imaging' THEN 1 END) as imaging_reports,
    COUNT(CASE WHEN hr.report_type = 'pathology' THEN 1 END) as pathology_reports,
    AVG(ra.health_score) as avg_health_score,
    MAX(hr.upload_date) as last_report_date
FROM auth.users u
LEFT JOIN health_reports hr ON u.id = hr.user_id
LEFT JOIN report_analyses ra ON hr.id = ra.report_id
GROUP BY u.id;

-- 11. 创建健康指标汇总视图
CREATE OR REPLACE VIEW health_metrics_summary AS
SELECT 
    user_id,
    metric_type,
    COUNT(*) as measurement_count,
    MIN(value) as min_value,
    MAX(value) as max_value,
    AVG(value) as avg_value,
    MAX(measurement_date) as latest_measurement
FROM health_metrics
GROUP BY user_id, metric_type;

-- 12. 添加有用的函数
CREATE OR REPLACE FUNCTION get_user_latest_analysis(user_uuid UUID)
RETURNS TABLE (
    report_id UUID,
    report_title TEXT,
    report_type VARCHAR,
    health_score NUMERIC,
    analysis_date TIMESTAMP
) 
LANGUAGE sql
AS $$
    SELECT 
        hr.id,
        hr.title,
        hr.report_type,
        ra.health_score,
        ra.analysis_date
    FROM health_reports hr
    JOIN report_analyses ra ON hr.id = ra.report_id
    WHERE hr.user_id = user_uuid AND hr.status = 'completed'
    ORDER BY ra.analysis_date DESC
    LIMIT 5;
$$;

-- 完成消息
SELECT 'Unified medical reports schema migration completed successfully!' as result;

-- 验证迁移结果
SELECT 
    'medical_data' as table_name,
    COUNT(*) as record_count
FROM medical_data
UNION ALL
SELECT 
    'health_reminders' as table_name,
    COUNT(*) as record_count  
FROM health_reminders
UNION ALL
SELECT 
    'health_reports (updated)' as table_name,
    COUNT(*) as record_count
FROM health_reports; 