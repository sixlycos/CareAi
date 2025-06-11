import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface CTASectionProps {
  user: User | null;
}

export function CTASection({ user }: CTASectionProps) {
  return (
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
  );
} 