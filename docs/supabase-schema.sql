-- =============================================================================
-- Supabase 健康管理系统数据库表结构
-- =============================================================================

-- 1. 用户档案表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reports_analyzed INTEGER DEFAULT 0,
    consultation_count INTEGER DEFAULT 0,
    health_score INTEGER NULL CHECK (health_score >= 0 AND health_score <= 100),
    next_checkup DATE NULL,
    preferences JSONB NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个用户只有一个档案
    UNIQUE(user_id)
);

-- 2. 健康报告表
CREATE TABLE IF NOT EXISTS health_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_url TEXT NULL,
    file_type VARCHAR(50) NULL,
    raw_content TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 状态约束
    CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 3. 报告分析表
CREATE TABLE IF NOT EXISTS report_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES health_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_analysis TEXT NOT NULL,
    structured_data JSONB NULL DEFAULT '{}',
    key_findings JSONB NULL DEFAULT '{}',
    recommendations JSONB NULL DEFAULT '{}',
    health_score INTEGER NULL CHECK (health_score >= 0 AND health_score <= 100),
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个报告只有一个分析
    UNIQUE(report_id)
);

-- 4. AI咨询表
CREATE TABLE IF NOT EXISTS ai_consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    conversation_type VARCHAR(20) DEFAULT 'general',
    context_data JSONB NULL DEFAULT '{}',
    consultation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 对话类型约束
    CONSTRAINT check_conversation_type CHECK (conversation_type IN ('general', 'report_based', 'follow_up'))
);

-- 5. 健康指标表
CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    measurement_date DATE NOT NULL,
    source VARCHAR(20) DEFAULT 'report',
    metadata JSONB NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 数据来源约束
    CONSTRAINT check_source CHECK (source IN ('report', 'manual', 'device'))
);

-- =============================================================================
-- 索引优化
-- =============================================================================

-- 用户档案索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 健康报告索引
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_status ON health_reports(status);
CREATE INDEX IF NOT EXISTS idx_health_reports_upload_date ON health_reports(upload_date DESC);

-- 报告分析索引
CREATE INDEX IF NOT EXISTS idx_report_analyses_report_id ON report_analyses(report_id);
CREATE INDEX IF NOT EXISTS idx_report_analyses_user_id ON report_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_report_analyses_analysis_date ON report_analyses(analysis_date DESC);

-- AI咨询索引
CREATE INDEX IF NOT EXISTS idx_ai_consultations_user_id ON ai_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_consultation_date ON ai_consultations(consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_conversation_type ON ai_consultations(conversation_type);

-- 健康指标索引
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_metrics_measurement_date ON health_metrics(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_type ON health_metrics(user_id, metric_type);

-- =============================================================================
-- 行级安全策略 (RLS)
-- =============================================================================

-- 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- 用户档案策略
CREATE POLICY "用户只能访问自己的档案" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 健康报告策略
CREATE POLICY "用户只能访问自己的报告" ON health_reports
    FOR ALL USING (auth.uid() = user_id);

-- 报告分析策略
CREATE POLICY "用户只能访问自己的分析" ON report_analyses
    FOR ALL USING (auth.uid() = user_id);

-- AI咨询策略
CREATE POLICY "用户只能访问自己的咨询" ON ai_consultations
    FOR ALL USING (auth.uid() = user_id);

-- 健康指标策略
CREATE POLICY "用户只能访问自己的指标" ON health_metrics
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 触发器和函数
-- =============================================================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加自动更新 updated_at 的触发器
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_reports_updated_at 
    BEFORE UPDATE ON health_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_analyses_updated_at 
    BEFORE UPDATE ON report_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_consultations_updated_at 
    BEFORE UPDATE ON ai_consultations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_metrics_updated_at 
    BEFORE UPDATE ON health_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 数据视图（可选）
-- =============================================================================

-- 用户健康概览视图
CREATE OR REPLACE VIEW user_health_overview AS
SELECT 
    up.user_id,
    up.reports_analyzed,
    up.consultation_count,
    up.health_score,
    up.next_checkup,
    (SELECT COUNT(*) FROM health_reports hr WHERE hr.user_id = up.user_id AND hr.status = 'completed') as completed_reports,
    (SELECT COUNT(*) FROM ai_consultations ac WHERE ac.user_id = up.user_id) as total_consultations,
    (SELECT MAX(analysis_date) FROM report_analyses ra WHERE ra.user_id = up.user_id) as last_analysis_date
FROM user_profiles up; 