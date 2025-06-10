import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportUpload from "@/components/health/ReportUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, FileText, MessageCircle, TrendingUp, Calendar } from "lucide-react";

export default async function HealthDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" />
                健康仪表板
              </h1>
              <p className="text-muted-foreground mt-2">
                欢迎回来，{data.user.email}！管理您的健康数据，获得AI智能分析。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已分析报告</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">本月新增</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI咨询次数</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">本月累计</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">健康得分</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">待首次分析</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">下次体检</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">建议时间</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Upload Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  体检报告AI解读
                </CardTitle>
                <CardDescription>
                  上传您的体检报告，让AI为您提供专业的健康分析和建议
                </CardDescription>
              </CardHeader>
            </Card>
            
            {/* Report Upload Component */}
            <ReportUpload />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">AI健康问答</div>
                      <div className="text-sm text-muted-foreground">随时咨询健康问题</div>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">健康趋势</div>
                      <div className="text-sm text-muted-foreground">查看历史数据变化</div>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">健康计划</div>
                      <div className="text-sm text-muted-foreground">制定个性化方案</div>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">最近活动</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无活动记录</p>
                  <p className="text-sm">上传第一份体检报告开始使用</p>
                </div>
              </CardContent>
            </Card>

            {/* Health Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">健康小贴士</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                      💧 每日饮水
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      建议每天饮水8杯，约2000ml，有助于维持身体正常代谢
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                      🏃‍♂️ 规律运动
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      每周至少150分钟中等强度运动，有效预防慢性疾病
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">
                      😴 充足睡眠
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      成年人建议每晚7-9小时睡眠，保持规律作息时间
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 