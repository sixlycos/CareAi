"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Heart, 
  Activity, 
  Target,
  Save,
  ArrowLeft,
  Edit3
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  age: number | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  medical_history: string[] | null;
  family_history: string[] | null;
  medications: string | null;
  allergies: string | null;
  exercise_frequency: string | null;
  smoking_status: string | null;
  drinking_status: string | null;
  sleep_hours: string | null;
  stress_level: string | null;
  health_goals: string[] | null;
  target_weight: string | null;
  other_goals: string | null;
  profile_completed: boolean | null;
  preferences: any;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  // 基础信息
  age: number | null;
  gender: string | null;
  height: string;
  weight: string;
  
  // 健康背景
  medicalHistory: string[];
  familyHistory: string[];
  medications: string;
  allergies: string;
  // 自定义输入
  customMedicalHistory: string;
  customFamilyHistory: string;
  
  // 生活习惯
  exerciseFrequency: string;
  smokingStatus: string;
  drinkingStatus: string;
  sleepHours: string;
  stressLevel: string;
  // 自定义输入
  customExerciseFrequency: string;
  
  // 健康目标
  healthGoals: string[];
  targetWeight: string;
  otherGoals: string;
  // 自定义输入
  customHealthGoals: string;
}

interface ProfileEditorProps {
  initialData: UserProfile | null;
}

export default function ProfileEditor({ initialData }: ProfileEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    // 基础信息
    age: initialData?.age || null,
    gender: initialData?.gender || null,
    height: '',
    weight: '',
    
    // 健康背景
    medicalHistory: [],
    familyHistory: [],
    medications: '',
    allergies: '',
    // 自定义输入
    customMedicalHistory: '',
    customFamilyHistory: '',
    
    // 生活习惯
    exerciseFrequency: '',
    smokingStatus: '',
    drinkingStatus: '',
    sleepHours: '',
    stressLevel: '',
    // 自定义输入
    customExerciseFrequency: '',
    
    // 健康目标
    healthGoals: [],
    targetWeight: '',
    otherGoals: '',
    // 自定义输入
    customHealthGoals: ''
  });

  // 初始化数据
  useEffect(() => {
    if (initialData) {
      // 自定义输入数据从preferences中获取
      const prefs = initialData.preferences || {};
      
      setProfileData(prev => ({
        ...prev,
        // 基础信息 - 直接从数据库字段读取
        age: initialData.age,
        gender: initialData.gender,
        height: initialData.height || '',
        weight: initialData.weight || '',
        // 健康背景 - 直接从数据库字段读取
        medicalHistory: initialData.medical_history || [],
        familyHistory: initialData.family_history || [],
        medications: initialData.medications || '',
        allergies: initialData.allergies || '',
        // 生活习惯 - 直接从数据库字段读取
        exerciseFrequency: initialData.exercise_frequency || '',
        smokingStatus: initialData.smoking_status || '',
        drinkingStatus: initialData.drinking_status || '',
        sleepHours: initialData.sleep_hours || '',
        stressLevel: initialData.stress_level || '',
        // 健康目标 - 直接从数据库字段读取
        healthGoals: initialData.health_goals || [],
        targetWeight: initialData.target_weight || '',
        otherGoals: initialData.other_goals || '',
        // 自定义输入 - 从preferences中读取
        customMedicalHistory: prefs.custom_medical_history || '',
        customFamilyHistory: prefs.custom_family_history || '',
        customExerciseFrequency: prefs.custom_exercise_frequency || '',
        customHealthGoals: prefs.custom_health_goals || ''
      }));
    }
  }, [initialData]);

  const medicalConditions = [
    "高血压", "糖尿病", "心脏病", "高血脂", "甲状腺疾病", 
    "骨质疏松", "关节炎", "慢性肾病", "肝病", "无", "其他"
  ];

  const familyConditions = [
    "心血管疾病", "糖尿病", "肿瘤", "高血压", "精神疾病", 
    "遗传性疾病", "骨质疏松", "无明显家族病史", "其他"
  ];

  const healthGoalOptions = [
    "减重", "增重", "控制血压", "控制血糖", "改善睡眠", 
    "增强体质", "预防疾病", "心理健康", "其他"
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          // 自定义输入字段
          customMedicalHistory: profileData.customMedicalHistory,
          customFamilyHistory: profileData.customFamilyHistory,
          customExerciseFrequency: profileData.customExerciseFrequency,
          customHealthGoals: profileData.customHealthGoals,
        }),
      });
      
      if (response.ok) {
        router.push('/health');
      } else {
        const errorData = await response.json();
        console.error('保存档案失败:', errorData);
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('保存档案失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleArrayToggle = <T extends string>(
    array: T[], 
    value: T, 
    setter: (newArray: T[]) => void
  ) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-blue-600" />
              编辑健康档案
            </h1>
            <p className="text-muted-foreground">
              完善或更新您的健康信息，获得更精准的AI分析
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                基础信息
              </CardTitle>
              <CardDescription>
                基本的个人信息，用于个性化分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">年龄</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="岁"
                    value={profileData.age || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev, 
                      age: e.target.value ? parseInt(e.target.value) : null
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>性别</Label>
                  <div className="flex gap-2">
                    {['男', '女'].map((gender) => (
                      <Button
                        key={gender}
                        variant={profileData.gender === gender ? "default" : "outline"}
                        onClick={() => setProfileData(prev => ({...prev, gender}))}
                        className={`flex-1 ${
                          profileData.gender === gender 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : ''
                        }`}
                      >
                        {gender}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">身高</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="cm"
                    value={profileData.height}
                    onChange={(e) => setProfileData(prev => ({...prev, height: e.target.value}))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">体重</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="kg"
                    value={profileData.weight}
                    onChange={(e) => setProfileData(prev => ({...prev, weight: e.target.value}))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 健康背景 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                健康背景
              </CardTitle>
              <CardDescription>
                既往病史和家族病史，帮助AI评估健康风险
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>既往病史（可多选）</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {medicalConditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`medical-${condition}`}
                        checked={profileData.medicalHistory.includes(condition)}
                        onCheckedChange={() => {
                          handleArrayToggle(
                            profileData.medicalHistory,
                            condition,
                            (newArray) => setProfileData(prev => ({...prev, medicalHistory: newArray}))
                          );
                        }}
                      />
                      <Label htmlFor={`medical-${condition}`} className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </div>
                {profileData.medicalHistory.includes("其他") && (
                  <div className="mt-3">
                    <Input
                      placeholder="请输入其他既往病史"
                      value={profileData.customMedicalHistory}
                      onChange={(e) => setProfileData(prev => ({...prev, customMedicalHistory: e.target.value}))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>家族病史（可多选）</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {familyConditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`family-${condition}`}
                        checked={profileData.familyHistory.includes(condition)}
                        onCheckedChange={() => {
                          handleArrayToggle(
                            profileData.familyHistory,
                            condition,
                            (newArray) => setProfileData(prev => ({...prev, familyHistory: newArray}))
                          );
                        }}
                      />
                      <Label htmlFor={`family-${condition}`} className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </div>
                {profileData.familyHistory.includes("其他") && (
                  <div className="mt-3">
                    <Input
                      placeholder="请输入其他家族病史"
                      value={profileData.customFamilyHistory}
                      onChange={(e) => setProfileData(prev => ({...prev, customFamilyHistory: e.target.value}))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medications">正在服用的药物</Label>
                  <Input
                    id="medications"
                    placeholder="如：高血压药物、维生素等"
                    value={profileData.medications}
                    onChange={(e) => setProfileData(prev => ({...prev, medications: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">过敏史</Label>
                  <Input
                    id="allergies"
                    placeholder="如：青霉素、花粉、海鲜等"
                    value={profileData.allergies}
                    onChange={(e) => setProfileData(prev => ({...prev, allergies: e.target.value}))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 生活习惯 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                生活习惯
              </CardTitle>
              <CardDescription>
                生活方式信息，用于制定个性化健康建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>运动频率</Label>
                  <div className="space-y-2">
                    {['几乎不运动', '偶尔运动', '每周1-2次', '每周3-4次', '每周5次以上', '其他'].map((freq) => (
                      <Button
                        key={freq}
                        variant={profileData.exerciseFrequency === freq ? "default" : "outline"}
                        onClick={() => setProfileData(prev => ({...prev, exerciseFrequency: freq}))}
                        className={`w-full justify-start ${
                          profileData.exerciseFrequency === freq 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : ''
                        }`}
                      >
                        {freq}
                      </Button>
                    ))}
                    {profileData.exerciseFrequency === "其他" && (
                      <Input
                        placeholder="请描述您的运动频率"
                        value={profileData.customExerciseFrequency}
                        onChange={(e) => setProfileData(prev => ({...prev, customExerciseFrequency: e.target.value}))}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>吸烟情况</Label>
                  <div className="space-y-2">
                    {['从不吸烟', '已戒烟', '目前吸烟'].map((status) => (
                      <Button
                        key={status}
                        variant={profileData.smokingStatus === status ? "default" : "outline"}
                        onClick={() => setProfileData(prev => ({...prev, smokingStatus: status}))}
                        className={`w-full justify-start ${
                          profileData.smokingStatus === status 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : ''
                        }`}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>饮酒情况</Label>
                  <div className="space-y-2">
                    {['从不饮酒', '偶尔饮酒', '经常饮酒'].map((status) => (
                      <Button
                        key={status}
                        variant={profileData.drinkingStatus === status ? "default" : "outline"}
                        onClick={() => setProfileData(prev => ({...prev, drinkingStatus: status}))}
                        className={`w-full text-xs ${
                          profileData.drinkingStatus === status 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : ''
                        }`}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sleep">平均睡眠时间</Label>
                  <Input
                    id="sleep"
                    type="number"
                    placeholder="小时/天"
                    value={profileData.sleepHours}
                    onChange={(e) => setProfileData(prev => ({...prev, sleepHours: e.target.value}))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 健康目标 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                健康目标
              </CardTitle>
              <CardDescription>
                设定您的健康目标，获得定制化的改善建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>主要健康目标（可多选）</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {healthGoalOptions.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={profileData.healthGoals.includes(goal)}
                        onCheckedChange={() => {
                          handleArrayToggle(
                            profileData.healthGoals,
                            goal,
                            (newArray) => setProfileData(prev => ({...prev, healthGoals: newArray}))
                          );
                        }}
                      />
                      <Label htmlFor={`goal-${goal}`} className="text-sm">{goal}</Label>
                    </div>
                  ))}
                </div>
                {profileData.healthGoals.includes("其他") && (
                  <div className="mt-3">
                    <Input
                      placeholder="请输入其他健康目标"
                      value={profileData.customHealthGoals}
                      onChange={(e) => setProfileData(prev => ({...prev, customHealthGoals: e.target.value}))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">目标体重</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    placeholder="公斤"
                    value={profileData.targetWeight}
                    onChange={(e) => setProfileData(prev => ({...prev, targetWeight: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherGoals">其他健康目标</Label>
                  <Input
                    id="otherGoals"
                    placeholder="请描述您的其他健康目标"
                    value={profileData.otherGoals}
                    onChange={(e) => setProfileData(prev => ({...prev, otherGoals: e.target.value}))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push('/health')}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? '保存中...' : '保存档案'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 