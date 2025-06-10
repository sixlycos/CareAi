# 🔍 Azure OCR 增强功能说明

## ✨ 新增功能亮点

### 1. **智能位置排序**
- **自动优化布局**：根据文本在页面中的实际位置(`boundingBox`坐标)进行智能排序
- **符合阅读习惯**：从上到下、从左到右的自然阅读顺序
- **多栏支持**：自动检测双栏布局，先左栏后右栏

### 2. **多页文档支持**
- **分页浏览**：多页体检报告可分页查看
- **页面信息**：显示页面尺寸、旋转角度等详细信息
- **位置坐标**：每行文本显示在页面中的准确位置

### 3. **增强的质量分析**
- **置信度分布**：高/中/低置信度行数统计
- **页面级统计**：每页的文本行数和质量指标
- **智能建议**：根据识别质量提供操作建议

## 🎯 用户体验提升

### **原始OCR结果**
```
行1: 报告编号
行2: 白细胞计数
行3: 东莞市长安医院
行4: 5.2
```

### **增强后的结果**
```
行1: 东莞市长安医院          (P1, 置信度95%)
行2: 报告编号               (P1, 置信度88%)  
行3: 白细胞计数             (P1, 置信度92%)
行4: 5.2                   (P1, 置信度96%)
```

## 📋 功能界面

### **概览统计**
- 文本行数、平均置信度、处理页数、处理时间
- 质量分布：高/中/低置信度行数统计

### **分页浏览** (多页文档)
- 页面切换按钮：上一页/下一页
- 页面信息：尺寸、旋转角度
- 当前页行数显示

### **文本编辑**
- 全局行号 + 页面标识
- 位置坐标显示
- 置信度标识
- 实时编辑保存

## 🔧 技术实现

### **核心算法**
```typescript
// 按位置智能排序
private static sortLinesByPosition(lines: any[]): any[] {
  return lines.sort((a, b) => {
    const aY = Math.min(a.boundingBox[1], a.boundingBox[3], a.boundingBox[5], a.boundingBox[7]);
    const bY = Math.min(b.boundingBox[1], b.boundingBox[3], b.boundingBox[5], b.boundingBox[7]);
    
    // Y坐标优先，然后X坐标
    const yDiff = aY - bY;
    if (Math.abs(yDiff) > 10) return yDiff;
    
    const aX = Math.min(a.boundingBox[0], a.boundingBox[2], a.boundingBox[4], a.boundingBox[6]);
    const bX = Math.min(b.boundingBox[0], b.boundingBox[2], b.boundingBox[4], b.boundingBox[6]);
    return aX - bX;
  });
}
```

### **多栏检测**
```typescript
// 简单双栏布局检测
private static detectColumns(lines: any[], pageWidth: number) {
  return lines.map(line => {
    const x = Math.min(line.boundingBox[0], line.boundingBox[2], line.boundingBox[4], line.boundingBox[6]);
    const centerX = pageWidth / 2;
    const column = x > centerX - 50 ? 1 : 0; // 右栏 : 左栏
    return { line, column, x };
  });
}
```

## 📊 数据结构

### **增强的ParsedOCRResult**
```typescript
interface ParsedOCRResult {
  success: boolean;
  extractedText: string[];
  structuredData: Array<{
    lineNumber: number;
    text: string;
    x: number;
    y: number;
    confidence: number;
    bbox: number[];
    pageNumber?: number;      // 🆕 页面编号
    lineIndexInPage?: number; // 🆕 页内行号
  }>;
  pages?: Array<{            // 🆕 页面信息
    pageNumber: number;
    lines: any[];
    pageInfo: {
      width: number;
      height: number;
      angle: number;
      unit: string;
    };
  }>;
  // ... 其他字段
}
```

## 🎉 效果对比

| 功能 | 原始版本 | 增强版本 |
|------|----------|----------|
| 文本排序 | API返回顺序 | ✅ 智能位置排序 |
| 多页支持 | 单一列表 | ✅ 分页浏览 |
| 位置信息 | 无 | ✅ 坐标显示 |
| 布局理解 | 基础 | ✅ 多栏检测 |
| 用户体验 | 一般 | ✅ 大幅提升 |

## 💡 使用建议

1. **多页文档**：利用分页功能逐页检查OCR质量
2. **低置信度文本**：重点关注红色标记的低置信度行
3. **位置验证**：通过坐标信息验证文本位置的合理性
4. **编辑优化**：对识别错误的文本进行手动编辑

这个增强功能让AI能够更准确地理解体检报告的结构，从而提供更精确的健康分析！🚀 