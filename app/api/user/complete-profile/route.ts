import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 验证用户身份
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { healthBackground, lifestyle, goals } = await request.json();

    // 构建完整档案数据
    const profileData = {
      medical_history: healthBackground.medicalHistory,
      family_history: healthBackground.familyHistory,
      medications: healthBackground.medications,
      allergies: healthBackground.allergies,
      exercise_frequency: lifestyle.exerciseFrequency,
      smoking_status: lifestyle.smokingStatus,
      drinking_status: lifestyle.drinkingStatus,
      sleep_hours: lifestyle.sleepHours,
      stress_level: lifestyle.stressLevel,
      health_goals: goals.primaryGoals,
      target_weight: goals.targetWeight,
      other_goals: goals.otherGoals,
      profile_completed: true,
      completed_at: new Date().toISOString()
    };

    // 更新用户档案
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        preferences: profileData
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('更新档案失败:', updateError);
      return NextResponse.json({ error: "保存档案失败" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "档案保存成功" 
    });

  } catch (error) {
    console.error('完整档案保存错误:', error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
} 