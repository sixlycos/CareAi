import { createClient } from "@/lib/supabase/server";
import { HealthDatabase } from "@/lib/supabase/database";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取请求数据
    const { age, gender, selectedPath } = await request.json();

    if (!age || !gender) {
      return NextResponse.json({ error: "缺少必需的用户信息" }, { status: 400 });
    }

    // 保存到数据库
    const healthDB = new HealthDatabase();
    const success = await healthDB.saveOnboardingInfo(user.id, parseInt(age), gender, selectedPath);

    if (!success) {
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("保存引导信息失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
} 