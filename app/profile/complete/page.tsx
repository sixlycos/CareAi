import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileCompletion from "@/components/profile/ProfileCompletion";

export default async function ProfileCompletePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // 获取用户现有档案数据
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  return <ProfileCompletion initialData={profile} />;
} 