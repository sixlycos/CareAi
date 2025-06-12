"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  FileText, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Heart,
  BarChart3
} from "lucide-react";

interface UserBasicInfo {
  age: string;
  gender: string;
}

type OnboardingStep = 'welcome' | 'basic_info' | 'path_choice' | 'demo_experience';
type ExperiencePath = 'immediate' | 'demo' | 'profile' | null;

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [userInfo, setUserInfo] = useState<UserBasicInfo>({ age: '', gender: '' });
  const [selectedPath, setSelectedPath] = useState<ExperiencePath>(null);
  const [progress, setProgress] = useState(0);

  const handleBasicInfoSubmit = () => {
    if (userInfo.age && userInfo.gender) {
      setCurrentStep('path_choice');
      setProgress(60);
    }
  };

  const handlePathChoice = async (path: ExperiencePath) => {
    setSelectedPath(path);
    setProgress(100);
    
    // 保存用户基础信息到后端
    try {
      const response = await fetch('/api/user/save-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: userInfo.age,
          gender: userInfo.gender,
          selectedPath: path
        }),
      });
      
      if (!response.ok) {
        console.error('保存引导信息失败');
      }
    } catch (error) {
      console.error('保存引导信息时出错:', error);
    }
    
    // 根据选择的路径跳转到相应功能
    switch (path) {
      case 'immediate':
        router.push('/health');
        break;
      case 'demo':
        setCurrentStep('demo_experience');
        break;
      case 'profile':
        router.push('/profile/complete'); // 跳转到档案完善页面
        break;
    }
  };

  const renderWelcomeStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 bg-blue-100 dark:bg-blue-900/20 px-4 py-2 rounded-full">
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
          30秒了解您的健康状况，AI医生级别的体检报告解读
        </p>

        {/* 统计数据展示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
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

        <Button 
          size="lg" 
          className="text-lg px-8 py-6 h-auto"
          onClick={() => {
            setCurrentStep('basic_info');
            setProgress(30);
          }}
        >
          <FileText className="mr-2 h-5 w-5" />
          开始体验 - 仅需两步
        </Button>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>无需注册，隐私保护，专业可信</span>
        </div>
      </div>
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">AI健康分析师</CardTitle>
            <CardDescription>
              为您提供个性化的健康指导，只需告诉我们基本信息
            </CardDescription>
            <div className="mt-4">
              <Progress value={progress} className="w-full [&>div]:bg-emerald-500" />
              <p className="text-xs text-muted-foreground mt-2">第 1 步 / 共 2 步</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="age">年龄</Label>
              <Input
                id="age"
                type="number"
                placeholder="请输入您的年龄"
                value={userInfo.age}
                onChange={(e) => setUserInfo({...userInfo, age: e.target.value})}
                className="text-center text-lg"
              />
            </div>
            
            <div className="space-y-3">
              <Label>性别</Label>
              <div className="grid grid-cols-2 gap-3">
                {['男', '女'].map((gender) => (
                  <Button
                    key={gender}
                    variant={userInfo.gender === gender ? "default" : "outline"}
                    onClick={() => setUserInfo({...userInfo, gender})}
                    className={`h-12 ${
                      userInfo.gender === gender 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {gender}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300" 
              onClick={handleBasicInfoSubmit}
              disabled={!userInfo.age || !userInfo.gender}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              下一步
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3" />
              <span>信息仅用于个性化分析，绝不分享</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPathChoiceStep = () => (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            信息已记录
          </Badge>
          <h2 className="text-3xl font-bold mb-4">选择您的体验方式</h2>
          <p className="text-muted-foreground text-lg">
            {userInfo.age}岁{userInfo.gender}性用户，我们为您推荐最适合的体验路径
          </p>
          <div className="mt-4">
            <Progress value={progress} className="w-full max-w-md mx-auto [&>div]:bg-emerald-500" />
            <p className="text-xs text-muted-foreground mt-2">第 2 步 / 共 2 步</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 立即体验选项 - 主推荐 */}
          <Card className="relative cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-blue-600 text-white">推荐</Badge>
            </div>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl">🔥 立即体验 AI分析</CardTitle>
              <CardDescription>
                上传体检报告，2分钟获得专业解读
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>专业指标解读</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>健康风险评估</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>个性化建议</span>
                </div>
              </div>
              <Button 
                className="w-full h-12" 
                onClick={() => handlePathChoice('immediate')}
              >
                上传报告，马上体验
              </Button>
            </CardContent>
          </Card>

          {/* 查看示例选项 */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl">📊 查看分析示例</CardTitle>
              <CardDescription>
                先了解AI的分析能力和准确性
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>真实案例展示</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>分析过程透明</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span>建立信任度</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-12" 
                onClick={() => handlePathChoice('demo')}
              >
                查看真实案例解读
              </Button>
            </CardContent>
          </Card>

          {/* 建立档案选项 */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-xl">⚙️ 建立完整档案</CardTitle>
              <CardDescription>
                提供详细信息，获得最精准分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-purple-600" />
                  <span>家族病史记录</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span>生活习惯分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span>长期健康跟踪</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-12" 
                onClick={() => handlePathChoice('profile')}
              >
                完善个人健康档案
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>您的信息已安全保存，可随时切换体验方式</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemoExperience = () => (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">📊 AI分析能力展示</h2>
          <p className="text-muted-foreground text-lg">
            真实案例：29岁男性程序员体检报告
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              🔍 AI发现的关键问题
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      需要关注
                    </Badge>
                  </div>
                  <p className="font-medium">血脂偏高：4.2 mmol/L</p>
                  <p className="text-sm text-muted-foreground">正常范围：&lt;3.5 mmol/L</p>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      需要关注
                    </Badge>
                  </div>
                  <p className="font-medium">尿酸超标：460 μmol/L</p>
                  <p className="text-sm text-muted-foreground">正常范围：&lt;420 μmol/L</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      正常
                    </Badge>
                  </div>
                  <p className="font-medium">肝功能正常</p>
                  <p className="text-sm text-muted-foreground">ALT、AST指标良好</p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      正常
                    </Badge>
                  </div>
                  <p className="font-medium">血糖水平良好</p>
                  <p className="text-sm text-muted-foreground">空腹血糖在正常范围</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              🎯 个性化健康建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">饮食调整</p>
                  <p className="text-sm text-muted-foreground">减少高嘌呤食物摄入，如海鲜、啤酒、动物内脏</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">运动计划</p>
                  <p className="text-sm text-muted-foreground">每周3次有氧运动，每次30分钟，如快走、游泳</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">复查建议</p>
                  <p className="text-sm text-muted-foreground">3个月后复查血脂和尿酸，监测改善情况</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 h-auto"
            onClick={() => handlePathChoice('immediate')}
          >
            <FileText className="mr-2 h-5 w-5" />
            看起来很专业，我也要试试
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-6 h-auto"
            onClick={() => router.push('/health')}
          >
            查看更多案例
          </Button>
        </div>
      </div>
    </div>
  );

  // 渲染当前步骤
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'basic_info':
        return renderBasicInfoStep();
      case 'path_choice':
        return renderPathChoiceStep();
      case 'demo_experience':
        return renderDemoExperience();
      default:
        return renderWelcomeStep();
    }
  };

  return renderCurrentStep();
} 