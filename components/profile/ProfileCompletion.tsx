"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Heart, 
  Activity, 
  Target,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from "lucide-react";

interface ProfileFormData {
  // 基础信息
  age: string;
  gender: string;
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

interface ProfileCompletionProps {
  initialData?: {
    age?: number;
    gender?: string;
    preferences?: any;
  };
}

export default function ProfileCompletion({ initialData }: ProfileCompletionProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    // 基础信息 - 如果有初始数据则使用
    age: initialData?.age?.toString() || '',
    gender: initialData?.gender || '',
    height: initialData?.preferences?.height || '',
    weight: initialData?.preferences?.weight || '',
    
    // 健康背景 - 预填充已有数据
    medicalHistory: initialData?.preferences?.medical_history || [],
    familyHistory: initialData?.preferences?.family_history || [],
    medications: initialData?.preferences?.medications || '',
    allergies: initialData?.preferences?.allergies || '',
    // 自定义输入
    customMedicalHistory: initialData?.preferences?.custom_medical_history || '',
    customFamilyHistory: initialData?.preferences?.custom_family_history || '',
    
    // 生活习惯 - 预填充已有数据
    exerciseFrequency: initialData?.preferences?.exercise_frequency || '',
    smokingStatus: initialData?.preferences?.smoking_status || '',
    drinkingStatus: initialData?.preferences?.drinking_status || '',
    sleepHours: initialData?.preferences?.sleep_hours || '',
    stressLevel: initialData?.preferences?.stress_level || '',
    // 自定义输入
    customExerciseFrequency: initialData?.preferences?.custom_exercise_frequency || '',
    
    // 健康目标 - 预填充已有数据
    healthGoals: initialData?.preferences?.health_goals || [],
    targetWeight: initialData?.preferences?.target_weight || '',
    otherGoals: initialData?.preferences?.other_goals || '',
    // 自定义输入
    customHealthGoals: initialData?.preferences?.custom_health_goals || ''
  });

  // 移除自动跳步逻辑，让用户在第一步看到预填充的信息并可以继续完善
  // useEffect(() => {
  //   if (initialData?.age && initialData?.gender) {
  //     setCurrentStep(2);
  //   }
  // }, [initialData]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

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

  const handleArrayToggle = (
    array: string[], 
    value: string, 
    field: keyof ProfileFormData
  ) => {
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // 先保存基础信息
      const baseResponse = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          medicalHistory: formData.medicalHistory,
          familyHistory: formData.familyHistory,
          medications: formData.medications,
          allergies: formData.allergies,
          exerciseFrequency: formData.exerciseFrequency,
          smokingStatus: formData.smokingStatus,
          drinkingStatus: formData.drinkingStatus,
          sleepHours: formData.sleepHours,
          stressLevel: formData.stressLevel,
          healthGoals: formData.healthGoals,
          targetWeight: formData.targetWeight,
          otherGoals: formData.otherGoals,
          // 自定义输入字段
          customMedicalHistory: formData.customMedicalHistory,
          customFamilyHistory: formData.customFamilyHistory,
          customExerciseFrequency: formData.customExerciseFrequency,
          customHealthGoals: formData.customHealthGoals,
        }),
      });
      
      if (baseResponse.ok) {
        router.push('/health?onboarding=complete');
      }
    } catch (error) {
      console.error('保存档案失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                基础信息
              </CardTitle>
              <CardDescription>
                请提供您的基本身体信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">年龄 *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="请输入年龄"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性别 *</Label>
                  <select
                    id="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="">请选择性别</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">身高 (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="请输入身高"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">体重 (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="请输入体重"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                健康背景
              </CardTitle>
              <CardDescription>
                告诉我们您的健康历史和当前状况
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">既往病史</Label>
                  <p className="text-sm text-muted-foreground mb-3">选择您曾经或正在患有的疾病</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalConditions.map((condition) => (
                      <Badge
                        key={condition}
                        variant={formData.medicalHistory.includes(condition) ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => handleArrayToggle(formData.medicalHistory, condition, 'medicalHistory')}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  {formData.medicalHistory.includes("其他") && (
                    <div className="mt-3">
                      <Input
                        placeholder="请输入其他既往病史"
                        value={formData.customMedicalHistory}
                        onChange={(e) => handleInputChange('customMedicalHistory', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium">家族病史</Label>
                  <p className="text-sm text-muted-foreground mb-3">选择您家族中有的疾病</p>
                  <div className="flex flex-wrap gap-2">
                    {familyConditions.map((condition) => (
                      <Badge
                        key={condition}
                        variant={formData.familyHistory.includes(condition) ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => handleArrayToggle(formData.familyHistory, condition, 'familyHistory')}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  {formData.familyHistory.includes("其他") && (
                    <div className="mt-3">
                      <Input
                        placeholder="请输入其他家族病史"
                        value={formData.customFamilyHistory}
                        onChange={(e) => handleInputChange('customFamilyHistory', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medications">当前用药</Label>
                    <Input
                      id="medications"
                      placeholder="请输入当前正在服用的药物"
                      value={formData.medications}
                      onChange={(e) => handleInputChange('medications', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">过敏史</Label>
                    <Input
                      id="allergies"
                      placeholder="请输入已知的过敏物质"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                生活习惯
              </CardTitle>
              <CardDescription>
                了解您的日常生活习惯
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exerciseFrequency">运动频率</Label>
                  <select
                    id="exerciseFrequency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.exerciseFrequency}
                    onChange={(e) => handleInputChange('exerciseFrequency', e.target.value)}
                  >
                    <option value="">请选择运动频率</option>
                    <option value="rarely">很少运动</option>
                    <option value="1-2times">每周1-2次</option>
                    <option value="3-4times">每周3-4次</option>
                    <option value="5+times">每周5次以上</option>
                    <option value="other">其他</option>
                  </select>
                  {formData.exerciseFrequency === "other" && (
                    <Input
                      placeholder="请描述您的运动频率"
                      value={formData.customExerciseFrequency}
                      onChange={(e) => handleInputChange('customExerciseFrequency', e.target.value)}
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smokingStatus">吸烟状况</Label>
                  <select
                    id="smokingStatus"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.smokingStatus}
                    onChange={(e) => handleInputChange('smokingStatus', e.target.value)}
                  >
                    <option value="">请选择吸烟状况</option>
                    <option value="never">从不吸烟</option>
                    <option value="former">已戒烟</option>
                    <option value="current">目前吸烟</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drinkingStatus">饮酒状况</Label>
                  <select
                    id="drinkingStatus"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.drinkingStatus}
                    onChange={(e) => handleInputChange('drinkingStatus', e.target.value)}
                  >
                    <option value="">请选择饮酒状况</option>
                    <option value="never">从不饮酒</option>
                    <option value="social">社交饮酒</option>
                    <option value="regular">经常饮酒</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleepHours">每日睡眠时间</Label>
                  <select
                    id="sleepHours"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.sleepHours}
                    onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                  >
                    <option value="">请选择睡眠时间</option>
                    <option value="<6">少于6小时</option>
                    <option value="6-7">6-7小时</option>
                    <option value="7-8">7-8小时</option>
                    <option value="8+">8小时以上</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stressLevel">压力水平</Label>
                  <select
                    id="stressLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.stressLevel}
                    onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                  >
                    <option value="">请选择压力水平</option>
                    <option value="low">低</option>
                    <option value="medium">中等</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                健康目标
              </CardTitle>
              <CardDescription>
                设定您的健康目标，我们将为您提供个性化建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">主要健康目标</Label>
                <p className="text-sm text-muted-foreground mb-3">选择您希望改善的方面</p>
                <div className="flex flex-wrap gap-2">
                  {healthGoalOptions.map((goal) => (
                    <Badge
                      key={goal}
                      variant={formData.healthGoals.includes(goal) ? "default" : "outline"}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleArrayToggle(formData.healthGoals, goal, 'healthGoals')}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
                {formData.healthGoals.includes("其他") && (
                  <div className="mt-3">
                    <Input
                      placeholder="请输入其他健康目标"
                      value={formData.customHealthGoals}
                      onChange={(e) => handleInputChange('customHealthGoals', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">目标体重 (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    placeholder="请输入目标体重"
                    value={formData.targetWeight}
                    onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherGoals">其他目标</Label>
                  <Input
                    id="otherGoals"
                    placeholder="其他健康目标或期望"
                    value={formData.otherGoals}
                    onChange={(e) => handleInputChange('otherGoals', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.age && formData.gender;
      case 2:
        return true; // 健康背景为可选
      case 3:
        return true; // 生活习惯为可选
      case 4:
        return formData.healthGoals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">完善健康档案</h1>
            <span className="text-sm text-muted-foreground">
              步骤 {currentStep} / {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 步骤内容 */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            上一步
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center gap-2"
            >
              下一步
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStepValid() || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                "保存中..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  完成建档
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 