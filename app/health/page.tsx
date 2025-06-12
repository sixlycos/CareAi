import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HealthDatabase } from "@/lib/supabase/database";
import ReportUpload from "@/components/health/ReportUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, FileText, MessageCircle, TrendingUp, Calendar, Brain, Zap, Activity } from "lucide-react";

export default async function HealthDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // 获取用户健康数据
  const healthDB = new HealthDatabase();
  let userProfile = await healthDB.getUserProfile(data.user.id);
  
  // 如果用户档案不存在，创建一个
  if (!userProfile) {
    userProfile = await healthDB.createUserProfile(data.user.id);
  }

  // 检查用户是否需要完善档案信息（仅对真正的新用户强制）
  const isNewUser = !userProfile.age && !userProfile.gender && 
    !userProfile.preferences?.onboardingCompleted;

  // 只有新用户且未完成任何建档步骤时才强制重定向
  if (isNewUser) {
    redirect("/profile/complete");
  }

  const userStats = await healthDB.getUserStats(data.user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:pl-24 lg:pr-8 py-6">
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

      <div className="max-w-7xl mx-auto px-4 lg:pl-24 lg:pr-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已分析报告</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.reportsAnalyzed}</div>
              <p className="text-xs text-muted-foreground">累计分析</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI咨询次数</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.consultationCount}</div>
              <p className="text-xs text-muted-foreground">累计咨询</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">健康得分</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.healthScore ? userStats.healthScore : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {userStats.healthScore ? '基于最新分析' : '待首次分析'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">下次体检</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.nextCheckup ? new Date(userStats.nextCheckup).toLocaleDateString('zh-CN') : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {userStats.nextCheckup ? '建议时间' : '待设置'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 新的快捷操作区域 - 卡片样式 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI健康问答</h3>
                <p className="text-sm text-muted-foreground">随时咨询健康问题</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">健康趋势</h3>
                <p className="text-sm text-muted-foreground">查看历史数据变化</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">健康计划</h3>
                <p className="text-sm text-muted-foreground">制定个性化方案</p>
              </div>
            </CardContent>
          </Card>

          <a href="/profile/edit">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200">
              <CardContent className="flex items-center p-6">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg mr-4">
                  <Brain className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">编辑档案</h3>
                  <p className="text-sm text-muted-foreground">完善健康信息</p>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Main Content - 扩充为全宽 */}
        <div className="w-full">
          {/* Report Upload Component - 扩充为全宽 */}
          <ReportUpload />
        </div>
      </div>
    </div>
  );
} 