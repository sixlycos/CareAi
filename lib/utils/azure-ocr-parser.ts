/**
 * Azure Computer Vision Read API 结果解析工具
 * 基于您提供的JSON结构指南，确保正确解析OCR结果
 */

export interface AzureOCRRawResult {
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult: {
    version: string;
    modelVersion: string;
    readResults: Array<{
      page: number;
      angle: number;
      width: number;
      height: number;
      unit: string;
      lines: Array<{
        boundingBox: number[];
        text: string;
        appearance?: {
          style: {
            name: string;
            confidence: number;
          };
        };
        words: Array<{
          boundingBox: number[];
          text: string;
          confidence: number;
        }>;
      }>;
    }>;
  };
}

export interface ParsedOCRResult {
  success: boolean;
  extractedText: string[];
  structuredData: Array<{
    lineNumber: number;
    text: string;
    x: number;
    y: number;
    confidence: number;
    bbox: number[];
    pageNumber?: number;
    lineIndexInPage?: number;
  }>;
  pages?: Array<{
    pageNumber: number;
    lines: any[];
    pageInfo: {
      width: number;
      height: number;
      angle: number;
      unit: string;
    };
  }>;
  metadata: {
    totalPages: number;
    totalLines: number;
    avgConfidence: number;
    processingTime: string;
    modelVersion: string;
  };
  qualityMetrics: {
    highConfidenceLines: number;
    lowConfidenceLines: number;
    emptyLines: number;
    confidenceDistribution: {
      high: number; // >= 0.9
      medium: number; // 0.7-0.9
      low: number; // < 0.7
    };
  };
}

export class AzureOCRParser {
  private static readonly MIN_CONFIDENCE = 0.5;
  private static readonly HIGH_CONFIDENCE = 0.9;
  private static readonly MEDIUM_CONFIDENCE = 0.7;

  /**
   * 按页面位置智能排序文本行
   * 从上到下、从左到右的阅读顺序
   */
  private static sortLinesByPosition(lines: any[]): any[] {
    return lines.sort((a, b) => {
      const aY = Math.min(a.boundingBox[1], a.boundingBox[3], a.boundingBox[5], a.boundingBox[7]);
      const bY = Math.min(b.boundingBox[1], b.boundingBox[3], b.boundingBox[5], b.boundingBox[7]);
      const aX = Math.min(a.boundingBox[0], a.boundingBox[2], a.boundingBox[4], a.boundingBox[6]);
      const bX = Math.min(b.boundingBox[0], b.boundingBox[2], b.boundingBox[4], b.boundingBox[6]);
      
      // 首先按Y坐标排序（从上到下）
      const yDiff = aY - bY;
      if (Math.abs(yDiff) > 10) { // 10像素的容差，处理同一行的情况
        return yDiff;
      }
      
      // Y坐标相近时，按X坐标排序（从左到右）
      return aX - bX;
    });
  }

  /**
   * 检测多栏布局
   * 返回每行所属的栏位信息
   */
  private static detectColumns(lines: any[], pageWidth: number): Array<{line: any, column: number}> {
    const linesWithColumn = lines.map(line => {
      const x = Math.min(line.boundingBox[0], line.boundingBox[2], line.boundingBox[4], line.boundingBox[6]);
      const width = Math.max(line.boundingBox[0], line.boundingBox[2], line.boundingBox[4], line.boundingBox[6]) - x;
      
      // 简单的双栏检测逻辑
      let column = 0;
      if (pageWidth > 0) {
        const centerX = pageWidth / 2;
        if (x > centerX - 50) { // 考虑一些容差
          column = 1; // 右栏
        }
      }
      
      return { line, column, x, width };
    });
    
    return linesWithColumn;
  }

  /**
   * 按栏位和位置智能排序
   */
  private static smartSortLines(lines: any[], pageWidth: number): any[] {
    const linesWithColumn = this.detectColumns(lines, pageWidth);
    
    // 按栏位分组
    const leftColumn = linesWithColumn.filter(item => item.column === 0);
    const rightColumn = linesWithColumn.filter(item => item.column === 1);
    
    // 分别对每栏进行位置排序
    const sortedLeft = this.sortLinesByPosition(leftColumn.map(item => item.line));
    const sortedRight = this.sortLinesByPosition(rightColumn.map(item => item.line));
    
    // 合并栏位：先左栏，后右栏
    return [...sortedLeft, ...sortedRight];
  }

  /**
   * 解析Azure OCR原始结果
   * 主要访问路径：result['analyzeResult']['readResults'][0]['lines']
   */
  static parseOCRResult(rawResult: AzureOCRRawResult): ParsedOCRResult {
    try {
      console.log('🔍 开始解析Azure OCR结果...');
      
      // 验证结果状态
      if (rawResult.status !== 'succeeded') {
        throw new Error(`OCR处理未成功，状态: ${rawResult.status}`);
      }

      const analyzeResult = rawResult.analyzeResult;
      if (!analyzeResult || !analyzeResult.readResults || analyzeResult.readResults.length === 0) {
        throw new Error('OCR结果中缺少分析数据');
      }

      // 提取所有页面的文本行，按页面和位置智能排序
      const allPages: Array<{
        pageNumber: number;
        lines: any[];
        pageInfo: any;
      }> = [];
      
      const structuredData: ParsedOCRResult['structuredData'] = [];
      let globalLineIndex = 0;

      analyzeResult.readResults.forEach((page, pageIndex) => {
        if (!page.lines || page.lines.length === 0) {
          console.warn(`第${pageIndex + 1}页没有检测到文本行`);
          return;
        }

        // 对当前页面的文本行进行智能排序
        const sortedLines = this.smartSortLines(page.lines, page.width);
        
        allPages.push({
          pageNumber: pageIndex + 1,
          lines: sortedLines,
          pageInfo: {
            width: page.width,
            height: page.height,
            angle: page.angle,
            unit: page.unit
          }
        });

        // 处理排序后的文本行
        sortedLines.forEach((line, lineIndexInPage) => {
          // 计算边界框左上角坐标
          const bbox = line.boundingBox;
          const x = Math.min(bbox[0], bbox[2], bbox[4], bbox[6]);
          const y = Math.min(bbox[1], bbox[3], bbox[5], bbox[7]);
          
          // 计算行的平均置信度
          let avgConfidence = 1.0; // 默认置信度
          if (line.words && line.words.length > 0) {
            const totalConfidence = line.words.reduce((sum, word) => sum + word.confidence, 0);
            avgConfidence = totalConfidence / line.words.length;
          }

          structuredData.push({
            lineNumber: globalLineIndex,
            text: line.text?.trim() || '',
            x,
            y,
            confidence: avgConfidence,
            bbox: line.boundingBox,
            pageNumber: pageIndex + 1,
            lineIndexInPage: lineIndexInPage
          });
          
          globalLineIndex++;
        });
      });

      // 从排序后的结构化数据中提取所有文本行
      const allLines = structuredData.map(item => ({
        text: item.text,
        boundingBox: item.bbox,
        words: [] // 简化处理
      }));

      // 提取纯文本数组 - 这是后续AI最需要的数据
      const extractedText = this.extractSimpleText(allLines);
      
      // 计算质量指标
      const qualityMetrics = this.calculateQualityMetrics(structuredData);
      
      // 构建元数据
      const metadata = {
        totalPages: analyzeResult.readResults.length,
        totalLines: allLines.length,
        avgConfidence: qualityMetrics.confidenceDistribution.high > 0 
          ? (qualityMetrics.confidenceDistribution.high + qualityMetrics.confidenceDistribution.medium * 0.8 + qualityMetrics.confidenceDistribution.low * 0.6) / allLines.length
          : 0.8,
        processingTime: this.calculateProcessingTime(rawResult.createdDateTime, rawResult.lastUpdatedDateTime),
        modelVersion: analyzeResult.modelVersion
      };

      console.log(`✅ OCR解析完成: ${extractedText.length}行文本, 平均置信度: ${metadata.avgConfidence.toFixed(2)}`);

      return {
        success: true,
        extractedText,
        structuredData,
        pages: allPages,
        metadata,
        qualityMetrics
      };

    } catch (error) {
      console.error('❌ Azure OCR结果解析失败:', error);
      return {
        success: false,
        extractedText: [],
        structuredData: [],
        metadata: {
          totalPages: 0,
          totalLines: 0,
          avgConfidence: 0,
          processingTime: '0s',
          modelVersion: 'unknown'
        },
        qualityMetrics: {
          highConfidenceLines: 0,
          lowConfidenceLines: 0,
          emptyLines: 0,
          confidenceDistribution: { high: 0, medium: 0, low: 0 }
        }
      };
    }
  }

  /**
   * 提取纯文本 - 最常用的方法
   * 路径：result['analyzeResult']['readResults'][0]['lines'][i]['text']
   */
  private static extractSimpleText(lines: any[]): string[] {
    return lines
      .map(line => line.text?.trim())
      .filter(text => text && text.length > 0);
  }

  /**
   * 提取高置信度文本
   */
  static extractHighConfidenceText(parsedResult: ParsedOCRResult, minConfidence: number = 0.8): string[] {
    return parsedResult.structuredData
      .filter(item => item.confidence >= minConfidence)
      .map(item => item.text)
      .filter(text => text.length > 0);
  }

  /**
   * 按置信度过滤文本
   */
  static filterTextByConfidence(parsedResult: ParsedOCRResult, minConfidence: number = 0.7, filterShort: boolean = true): string[] {
    return parsedResult.structuredData
      .filter(item => {
        // 置信度过滤
        if (item.confidence < minConfidence) return false;
        
        // 短文本过滤
        if (filterShort && item.text.length < 2) return false;
        
        return true;
      })
      .map(item => item.text);
  }

  /**
   * 计算质量指标
   */
  private static calculateQualityMetrics(structuredData: ParsedOCRResult['structuredData']) {
    let highConfidenceLines = 0;
    let mediumConfidenceLines = 0;
    let lowConfidenceLines = 0;
    let emptyLines = 0;

    structuredData.forEach(item => {
      if (!item.text || item.text.length === 0) {
        emptyLines++;
      } else if (item.confidence >= this.HIGH_CONFIDENCE) {
        highConfidenceLines++;
      } else if (item.confidence >= this.MEDIUM_CONFIDENCE) {
        mediumConfidenceLines++;
      } else {
        lowConfidenceLines++;
      }
    });

    return {
      highConfidenceLines,
      lowConfidenceLines,
      emptyLines,
      confidenceDistribution: {
        high: highConfidenceLines,
        medium: mediumConfidenceLines,
        low: lowConfidenceLines
      }
    };
  }

  /**
   * 计算处理时间
   */
  private static calculateProcessingTime(createdTime: string, updatedTime: string): string {
    try {
      const created = new Date(createdTime);
      const updated = new Date(updatedTime);
      const diffMs = updated.getTime() - created.getTime();
      return `${(diffMs / 1000).toFixed(1)}s`;
    } catch {
      return '未知';
    }
  }

  /**
   * 调试结构 - 用于开发调试
   */
  static debugStructure(rawResult: AzureOCRRawResult): void {
    console.log('=== Azure OCR 结构调试 ===');
    console.log('Status:', rawResult.status);
    console.log('Pages:', rawResult.analyzeResult?.readResults?.length || 0);
    
    if (rawResult.analyzeResult?.readResults?.[0]?.lines) {
      const firstPage = rawResult.analyzeResult.readResults[0];
      console.log('Lines on first page:', firstPage.lines.length);
      console.log('First line text:', firstPage.lines[0]?.text || 'No text');
      console.log('Model version:', rawResult.analyzeResult.modelVersion);
    }
    console.log('========================');
  }

  /**
   * 生成适合AI处理的提示词
   */
  static generateAIPrompt(parsedResult: ParsedOCRResult): string {
    const cleanText = parsedResult.extractedText.join('\n');
    const qualityInfo = parsedResult.qualityMetrics;
    
    return `
以下是从体检报告中通过Azure OCR提取的文本内容：

文本质量信息：
- 总行数：${parsedResult.metadata.totalLines}
- 平均置信度：${parsedResult.metadata.avgConfidence.toFixed(2)}
- 高置信度行：${qualityInfo.highConfidenceLines}
- 低置信度行：${qualityInfo.lowConfidenceLines}

提取的文本内容：
${cleanText}

请根据以上体检报告文本，提取健康指标并进行专业分析。
注意：部分文本可能存在OCR识别错误，请结合上下文进行智能纠正。
`;
  }
}

/**
 * 便捷的提取函数，供组件直接使用
 */
export const parseAzureOCRResponse = (rawResult: any): ParsedOCRResult => {
  return AzureOCRParser.parseOCRResult(rawResult as AzureOCRRawResult);
};

export const extractTextForAI = (rawResult: any): string[] => {
  const parsed = AzureOCRParser.parseOCRResult(rawResult as AzureOCRRawResult);
  return parsed.extractedText;
};

export const extractHighQualityText = (rawResult: any, minConfidence: number = 0.8): string[] => {
  const parsed = AzureOCRParser.parseOCRResult(rawResult as AzureOCRRawResult);
  return AzureOCRParser.extractHighConfidenceText(parsed, minConfidence);
}; 