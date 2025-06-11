import Link from "next/link";
import { Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface HeroSectionProps {
  user: User | null;
}

export function HeroSection({ user }: HeroSectionProps) {
  return (
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
  );
} 