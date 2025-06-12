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

    const profileData = await request.json();

    // 获取现有的preferences数据
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    const existingPreferences = existingProfile?.preferences || {};

    // 构建更新数据 - 使用数据库的实际字段结构
    const updateData = {
      // 基础信息
      age: profileData.age,
      gender: profileData.gender,
      height: profileData.height,
      weight: profileData.weight,
      // 健康背景
      medical_history: profileData.medicalHistory,
      family_history: profileData.familyHistory,
      medications: profileData.medications,
      allergies: profileData.allergies,
      // 生活习惯
      exercise_frequency: profileData.exerciseFrequency,
      smoking_status: profileData.smokingStatus,
      drinking_status: profileData.drinkingStatus,
      sleep_hours: profileData.sleepHours,
      stress_level: profileData.stressLevel,
      // 健康目标
      health_goals: profileData.healthGoals,
      target_weight: profileData.targetWeight,
      other_goals: profileData.otherGoals,
      // 档案完成状态
      profile_completed: true,
      // 自定义输入存储在preferences中
      preferences: {
        ...existingPreferences,
        custom_medical_history: profileData.customMedicalHistory || '',
        custom_family_history: profileData.customFamilyHistory || '',
        custom_exercise_frequency: profileData.customExerciseFrequency || '',
        custom_health_goals: profileData.customHealthGoals || '',
        profile_updated_at: new Date().toISOString()
      }
    };

    // 更新用户档案
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('更新档案失败:', updateError);
      return NextResponse.json({ error: "更新档案失败" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "档案更新成功" 
    });

  } catch (error) {
    console.error('档案更新错误:', error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
} 