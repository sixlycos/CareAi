import { Brain, FileText, Heart, Zap, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "智能报告解读",
    description: "上传体检报告图片或PDF，AI自动识别所有健康指标，生成通俗易懂的专业解读报告。",
    color: "blue"
  },
  {
    icon: Brain,
    title: "24/7健康问答",
    description: "基于您的健康档案，随时随地解答健康疑问，提供个性化的专业建议。",
    color: "green"
  },
  {
    icon: Heart,
    title: "健康趋势分析",
    description: "追踪历史数据变化，预测健康风险，制定个性化的健康改善计划。",
    color: "purple"
  },
  {
    icon: Zap,
    title: "快速精准",
    description: "先进的OCR技术和AI算法，30秒内完成报告分析，准确率高达95%以上。",
    color: "orange"
  },
  {
    icon: Shield,
    title: "隐私保护",
    description: "所有数据本地存储，严格保护您的隐私，绝不泄露任何个人健康信息。",
    color: "cyan"
  },
  {
    icon: Users,
    title: "家庭健康",
    description: "一个账号管理全家健康，关爱家人从关注健康开始。",
    color: "pink"
  }
];

export function FeaturesSection() {
  return (
    <section className="w-full py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            从体检报告解读到日常健康管理，全方位守护您的健康
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className={`border-2 hover:border-${feature.color}-200 transition-colors`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${feature.color}-100 dark:bg-${feature.color}-900 rounded-lg`}>
                      <Icon className={`h-6 w-6 text-${feature.color}-600`} />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
} 