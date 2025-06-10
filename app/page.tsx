import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Brain, FileText, Heart, Zap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-xl">健康AI助手</span>
              </Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="w-full py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="text-blue-600 font-medium">AI驱动的健康管理</span>
              </div>
        </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              您的
              <span className="text-blue-600"> 24/7 </span>
              私人健康顾问
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              上传体检报告，获得专业AI解读。从报告分析到日常健康咨询，让AI成为您最贴心的健康伙伴。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <Link href="/health">
                  <Button size="lg" className="text-lg px-8 py-3">
                    <FileText className="mr-2 h-5 w-5" />
                    开始分析报告
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" className="text-lg px-8 py-3">
                    <FileText className="mr-2 h-5 w-5" />
                    免费开始使用
                  </Button>
                </Link>
              )}
              <Link href="#demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  查看演示
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">95%+</div>
                <div className="text-muted-foreground">识别准确率</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">&lt;30秒</div>
                <div className="text-muted-foreground">分析速度</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-muted-foreground">智能问答</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                从体检报告解读到日常健康管理，全方位守护您的健康
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>智能报告解读</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    上传体检报告图片或PDF，AI自动识别所有健康指标，生成通俗易懂的专业解读报告。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-green-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Brain className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>24/7健康问答</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    基于您的健康档案，随时随地解答健康疑问，提供个性化的专业建议。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Heart className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>健康趋势分析</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    追踪历史数据变化，预测健康风险，制定个性化的健康改善计划。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-orange-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle>快速精准</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    先进的OCR技术和AI算法，30秒内完成报告分析，准确率高达95%以上。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-cyan-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                      <Shield className="h-6 w-6 text-cyan-600" />
                    </div>
                    <CardTitle>隐私保护</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    所有数据本地存储，严格保护您的隐私，绝不泄露任何个人健康信息。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-pink-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                      <Users className="h-6 w-6 text-pink-600" />
                    </div>
                    <CardTitle>家庭健康</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    一个账号管理全家健康，关爱家人从关注健康开始。
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              立即体验AI健康解读
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {user ? '进入您的健康仪表板，开始管理健康数据' : '注册账号，享受免费的AI健康服务'}
            </p>
            {user ? (
              <Link href="/health">
                <Button size="lg" className="text-lg px-8 py-3">
                  <Heart className="mr-2 h-5 w-5" />
                  进入健康仪表板
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="text-lg px-8 py-3">
                    <Heart className="mr-2 h-5 w-5" />
                    免费注册
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    已有账号？登录
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-semibold">健康AI助手</span>
                <span className="text-muted-foreground">- 您的智能健康伙伴</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
          <p>
            Powered by{" "}
            <a
                    href="https://supabase.com"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
