import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HealthDatabase } from "@/lib/supabase/database";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage({ searchParams }: { 
  searchParams: Promise<{ force?: string }> 
}) {
  const supabase = await createClient();

  // 检查是否强制调试模式
  const resolvedSearchParams = await searchParams;
  const forceMode = resolvedSearchParams.force === 'true';

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    // 未登录用户访问引导页面，重定向到登录
    redirect("/auth/login");
  }

  // 如果不是强制模式，执行正常的引导检测逻辑
  if (!forceMode) {
    // 检查用户是否已完成引导
    const healthDB = new HealthDatabase();
    const userProfile = await healthDB.getUserProfile(data.user.id);
    
    // 如果用户已有档案且填写了基础信息，说明已完成引导
    if (userProfile && userProfile.age && userProfile.gender) {
      // 老用户已完成引导，直接跳转到健康页面
      redirect("/health");
    }
  }

  // 新用户、档案不完整的用户，或强制调试模式，显示引导流程
  return <OnboardingFlow />;
} 