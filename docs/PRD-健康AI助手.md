# 健康AI助手 - 产品需求文档 (PRD)

## 📋 产品概述

**产品名称**：健康AI助手  
**产品定位**：AI驱动的个人健康管理平台  
**核心价值**：从体检报告解读工具升级为24/7私人健康顾问  
**目标用户**：关注健康的中产阶级、企业员工、中老年群体及其家属

## 🎯 商业洞察与解决方案

### 核心问题重新定义
- **原问题**：体检报告解读是低频刚需，难以建立用户粘性
- **解决方案**：以体检报告解读为入口，构建高频健康管理平台
- **商业逻辑**：用户因体检而来，因健康管理而留，因生态服务而付费

### 用户增长飞轮
```
体检报告解读(获客) → 日常健康咨询(留存) → 数据积累(价值提升) → 
社交分享(传播) → 家庭使用(扩散) → 生态消费(变现) → 回到获客
```

## 🚀 升级版MVP功能设计

### Phase 1: 智能健康助手基础 (2-3周)

#### 1.1 智能体检报告解读 (低频引流)
**功能描述**：
- 支持PDF、JPG、PNG格式上传（最大10MB）
- EasyOCR文字识别提取关键指标
- Azure OpenAI生成专业通俗解读
- 健康风险等级评估

**核心指标识别**：
- 血常规：白细胞、红细胞、血红蛋白、血小板
- 血脂：总胆固醇、甘油三酯、HDL、LDL
- 肝功能：ALT、AST、胆红素
- 肾功能：肌酐、尿素氮、尿酸
- 血糖：空腹血糖、糖化血红蛋白

**AI解读结构**：
```
1. 整体健康状况评估 (优秀/良好/注意/建议就医)
2. 异常指标详细解释 (通俗语言 + 严重程度)
3. 健康风险预警 (短期/长期风险)
4. 个性化改善建议 (饮食/运动/生活方式)
5. 复查建议 (时间节点 + 重点关注项目)
```

#### 1.2 24/7健康AI问答 (高频留存)
**功能描述**：
- 基于个人健康档案的智能问答
- 症状描述与初步建议
- 用药咨询与注意事项
- 健康科普与辟谣

**问答场景**：
- "我最近总是头晕，结合我的体检报告，可能是什么原因？"
- "高血压患者可以吃海鲜吗？"
- "我应该多久体检一次？"

#### 1.3 个人健康档案管理
**功能描述**：
- 基础信息：年龄、性别、身高、体重、既往病史
- 历史体检报告存储与对比
- 日常健康数据录入（血压、血糖、体重等）
- 健康趋势可视化图表

#### 1.4 用户认证与基础界面
**功能描述**：
- 基于Supabase的用户注册/登录
- 响应式UI设计（移动端优先）
- 简洁明了的仪表板界面

### Phase 2: 数据整合与智能预测 (3-4周)

#### 2.1 多数据源整合
**数据来源**：
- 手动录入：血压、血糖、体重、心率
- 可穿戴设备：Apple Health、小米运动等（API对接）
- 生活习惯：运动、睡眠、饮食记录

#### 2.2 AI健康趋势分析
**功能描述**：
- 基于历史数据的健康趋势预测
- 异常指标早期预警
- 个性化健康目标制定
- 最佳体检时间推荐

#### 2.3 智能健康计划
**功能描述**：
- 个性化运动方案
- 饮食建议与禁忌
- 作息时间优化
- 压力管理建议

### Phase 3: 社交生态与变现 (4-5周)

#### 3.1 家庭健康管理
**功能描述**：
- 一个账号管理家庭成员健康
- 老人健康状况实时关注
- 家庭健康报告与提醒

#### 3.2 健康社区功能
**功能描述**：
- 匿名健康经验分享
- 相似情况用户互助
- 健康目标PK与激励
- 专家科普内容

#### 3.3 健康生态服务
**功能描述**：
- 个性化保险产品推荐
- 营养品智能推荐
- 体检套餐优化选择
- 医院医生匹配服务

## 🏗️ 技术架构设计

### 整体架构
```
前端：Next.js 15 + TypeScript + Tailwind CSS
后端：Python FastAPI + SQLAlchemy
数据库：Supabase (PostgreSQL + Auth)
AI服务：Azure OpenAI GPT-4
OCR服务：Python EasyOCR
文件存储：Supabase Storage
部署：前端Vercel + 后端Railway/Heroku
```

### 后端API设计 (Python FastAPI)

#### 核心API接口
```python
# 报告相关
POST /api/reports/upload          # 上传体检报告
POST /api/reports/{id}/analyze    # 触发AI解读
GET  /api/reports/{id}/result     # 获取解读结果
GET  /api/reports                 # 获取用户报告列表

# AI问答
POST /api/chat/ask                # 健康问答
GET  /api/chat/history           # 问答历史

# 健康数据
POST /api/health/data            # 录入健康数据
GET  /api/health/trends          # 获取健康趋势
GET  /api/health/analysis        # 健康分析报告

# 用户管理
GET  /api/user/profile           # 用户资料
PUT  /api/user/profile           # 更新资料
GET  /api/user/family            # 家庭成员管理
```

#### OCR实现 (EasyOCR)
```python
import easyocr
from typing import List, Dict

class HealthReportOCR:
    def __init__(self):
        self.reader = easyocr.Reader(['ch_sim', 'en'])
    
    def extract_text(self, image_path: str) -> List[str]:
        """提取图片中的文字"""
        results = self.reader.readtext(image_path)
        return [item[1] for item in results]
    
    def parse_health_indicators(self, text_list: List[str]) -> Dict:
        """解析健康指标数据"""
        # 实现指标识别和数值提取逻辑
        pass
```

### 数据库设计 (Supabase)

```sql
-- 用户扩展信息表
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    age INTEGER,
    gender VARCHAR(10),
    height FLOAT,
    weight FLOAT,
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 体检报告表
CREATE TABLE health_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    report_date DATE,
    hospital_name TEXT,
    status VARCHAR(20) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 解读结果表
CREATE TABLE report_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES health_reports(id),
    overall_status VARCHAR(20),
    health_score INTEGER,
    ai_analysis TEXT,
    recommendations TEXT,
    risk_factors TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 健康指标表
CREATE TABLE health_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES health_reports(id),
    indicator_name VARCHAR(100),
    value FLOAT,
    unit VARCHAR(20),
    normal_range TEXT,
    status VARCHAR(20), -- normal/high/low/critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 日常健康数据表
CREATE TABLE daily_health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    data_type VARCHAR(50), -- blood_pressure, weight, blood_sugar等
    value JSONB, -- 存储复杂数据，如血压{systolic: 120, diastolic: 80}
    recorded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI对话记录表
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context JSONB, -- 对话上下文
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 前端页面结构

```
/app
├── page.tsx                     # 产品首页
├── dashboard/                   
│   ├── page.tsx                # 用户仪表板
│   ├── upload/
│   │   └── page.tsx            # 报告上传页面
│   ├── reports/
│   │   ├── page.tsx            # 报告列表
│   │   └── [id]/
│   │       ├── page.tsx        # 报告详情
│   │       └── analysis/
│   │           └── page.tsx    # AI解读结果
│   ├── chat/
│   │   └── page.tsx            # AI健康问答
│   ├── health/
│   │   ├── page.tsx            # 健康数据管理
│   │   └── trends/
│   │       └── page.tsx        # 健康趋势分析
│   ├── family/
│   │   └── page.tsx            # 家庭健康管理
│   └── profile/
│       └── page.tsx            # 个人资料设置
├── auth/                        # 现有认证页面
├── api/
│   └── proxy/                  # 代理后端API调用
└── components/
    ├── ui/                     # 基础UI组件
    ├── health/                 # 健康相关组件
    └── charts/                 # 图表组件
```

## 💰 商业模式设计

### 收入模式
1. **订阅收入** (70%)
   - 免费版：每月2次报告解读 + 基础AI问答
   - 会员版：39元/月，无限解读 + 高级功能 + 优先支持

2. **佣金收入** (20%)
   - 保险产品推荐：5-10%佣金
   - 体检套餐推荐：8-15%佣金
   - 营养品推荐：3-8%佣金

3. **B端服务** (10%)
   - 企业健康管理SaaS：100-500元/人/年
   - 健康数据API服务：按调用次数计费

### 成本结构
- **AI API成本**：单次解读约1-3元
- **服务器成本**：月约500-2000元
- **获客成本**：目标CAC<100元
- **人力成本**：初期2-3人团队

## 📊 MVP验证指标

### 技术指标
- OCR识别准确率：>85%
- AI解读生成成功率：>95%
- 页面加载速度：<3秒
- 系统可用性：>99%

### 用户指标
- 用户注册转化率：>15%
- 解读满意度：>4.0/5.0
- 次日留存率：>30%
- 7日留存率：>20%

### 商业指标
- 月活用户：100+ (3个月内)
- 付费转化率：>5%
- 单用户月收入：>20元
- 用户生命周期价值：>300元

## 🎯 开发路线图

### Week 1-2: 基础架构搭建
- [ ] Python FastAPI后端环境搭建
- [ ] Supabase数据库设计与部署
- [ ] Next.js前端项目改造
- [ ] EasyOCR服务集成测试
- [ ] Azure OpenAI API集成

### Week 3-4: 核心功能开发
- [ ] 文件上传与OCR解析
- [ ] AI解读引擎开发
- [ ] 用户仪表板界面
- [ ] 报告解读结果展示

### Week 5-6: 用户体验优化
- [ ] AI健康问答功能
- [ ] 个人健康档案管理
- [ ] 响应式UI适配
- [ ] 基础数据可视化

### Week 7-8: 高级功能与测试
- [ ] 健康趋势分析
- [ ] 家庭健康管理
- [ ] 会员订阅系统
- [ ] 全面测试与优化

### Week 9-10: 生态功能与上线
- [ ] 健康社区基础功能
- [ ] 第三方服务推荐
- [ ] 性能优化与安全加固
- [ ] MVP版本上线

## 🔄 迭代优化策略

### 数据驱动优化
- 用户行为分析：Google Analytics + 自定义埋点
- A/B测试：解读结果展示方式、付费转化流程
- 用户反馈收集：应用内反馈 + 用户访谈

### 产品迭代方向
1. **短期** (1-3个月)：提升解读准确性，优化用户体验
2. **中期** (3-6个月)：扩展数据源，增强AI能力
3. **长期** (6-12个月)：建设健康生态，探索新变现模式

## 🏁 成功标准

### MVP成功标准 (3个月内)
- 注册用户：1000+
- 付费用户：50+
- 月度活跃用户：500+
- 用户净推荐值(NPS)：>40

### 产品PMF验证标准
- 40%+用户认为没有产品会"非常失望"
- 有机增长率：>20%/月
- 付费用户留存率：>80% (3个月)

---

## 📝 总结

这个升级版的健康AI助手通过"体检报告解读"作为获客入口，构建"日常健康管理"的高频使用场景，最终建立"健康生态服务"的多元变现模式。

**核心差异化**：
1. 从工具变成助手：24/7随时可咨询的私人健康顾问
2. 从个人变成家庭：一个产品服务全家健康管理需求  
3. 从解读变成预测：主动预警而非被动分析
4. 从单一变成生态：健康管理的一站式解决方案

**技术优势**：
- Python后端：快速开发，成熟的ML/AI生态
- EasyOCR：免费开源，满足MVP测试需求
- Azure OpenAI：企业级服务，稳定可控成本
- Supabase：快速后端服务，减少基础设施开发

这个方案既解决了低频痛点，又建立了高频价值，具备了可持续发展的商业基础。 