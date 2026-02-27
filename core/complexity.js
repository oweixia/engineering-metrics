const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

/**
 * 计算圈复杂度（Cyclomatic Complexity）
 * 基于控制流的分支数量
 */
function calculateCyclomaticComplexity(ast) {
  let complexity = 1; // 基础复杂度为 1

  traverse(ast, {
    // 条件语句
    IfStatement() {
      complexity++;
    },
    ConditionalExpression() {
      complexity++;
    },
    SwitchCase(path) {
      // 每个 case（除了 default）增加复杂度
      if (path.node.test !== null) {
        complexity++;
      }
    },
    // 循环
    WhileStatement() {
      complexity++;
    },
    DoWhileStatement() {
      complexity++;
    },
    ForStatement() {
      complexity++;
    },
    ForInStatement() {
      complexity++;
    },
    ForOfStatement() {
      complexity++;
    },
    // 逻辑运算符
    LogicalExpression(path) {
      if (path.node.operator === '&&' || path.node.operator === '||') {
        complexity++;
      }
    },
    // 异常处理
    CatchClause() {
      complexity++;
    }
  });

  return complexity;
}

/**
 * 计算认知复杂度（Cognitive Complexity）
 * 更注重代码理解难度
 */
function calculateCognitiveComplexity(ast) {
  let complexity = 0;
  let nestingLevel = 0;

  traverse(ast, {
    // 函数进入不增加嵌套
    Function: {
      enter() {
        // 函数定义不增加嵌套，但内部的控制流会
      }
    },
    // 控制流语句
    IfStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    SwitchStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    ForStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    ForInStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    ForOfStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    WhileStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    DoWhileStatement: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    CatchClause: {
      enter() {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      },
      exit() {
        nestingLevel--;
      }
    },
    // 递归调用增加复杂度
    CallExpression(path) {
      // 检查是否是递归调用（简化版）
      if (path.node.callee.name) {
        // 这里简化处理，实际需要更复杂的分析
        const functionNode = path.getFunctionParent();
        if (functionNode && functionNode.node.id && 
            functionNode.node.id.name === path.node.callee.name) {
          complexity += 1 + nestingLevel;
        }
      }
    },
    // 跳转语句
    BreakStatement() {
      complexity += 1;
    },
    ContinueStatement() {
      complexity += 1;
    }
  });

  return complexity;
}

/**
 * 计算最大嵌套深度
 */
function calculateMaxNestingDepth(ast) {
  let maxDepth = 0;
  let currentDepth = 0;

  traverse(ast, {
    BlockStatement: {
      enter() {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      },
      exit() {
        currentDepth--;
      }
    }
  });

  return maxDepth;
}

/**
 * 计算函数平均长度（行数）
 */
function calculateAverageFunctionLength(ast, code) {
  const functionLengths = [];

  traverse(ast, {
    FunctionDeclaration(path) {
      const start = path.node.loc.start.line;
      const end = path.node.loc.end.line;
      functionLengths.push(end - start + 1);
    },
    FunctionExpression(path) {
      const start = path.node.loc.start.line;
      const end = path.node.loc.end.line;
      functionLengths.push(end - start + 1);
    },
    ArrowFunctionExpression(path) {
      const start = path.node.loc.start.line;
      const end = path.node.loc.end.line;
      functionLengths.push(end - start + 1);
    }
  });

  if (functionLengths.length === 0) return 0;
  
  const sum = functionLengths.reduce((a, b) => a + b, 0);
  return Math.round(sum / functionLengths.length);
}

/**
 * 计算注释率
 */
function calculateCommentRatio(code) {
  const lines = code.split('\n');
  let commentLines = 0;
  let codeLines = 0;
  let inBlockComment = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (!trimmed) return; // 跳过空行

    // 检查块注释
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
    }
    
    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }

    // 检查单行注释
    if (trimmed.startsWith('//')) {
      commentLines++;
      return;
    }

    codeLines++;
  });

  const totalLines = commentLines + codeLines;
  return totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;
}

/**
 * 分析文件复杂度
 * @param {string} filePath - 文件路径
 * @returns {Object} 复杂度分析结果
 */
function analyzeComplexity(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // 只分析 JS/TS 文件
  if (![".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext)) {
    return null;
  }

  try {
    const code = fs.readFileSync(filePath, "utf-8");
    
    if (code.trim().length < 10) {
      return null;
    }

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "decorators-legacy"],
      errorRecovery: true
    });

    const cyclomaticComplexity = calculateCyclomaticComplexity(ast);
    const cognitiveComplexity = calculateCognitiveComplexity(ast);
    const maxNestingDepth = calculateMaxNestingDepth(ast);
    const avgFunctionLength = calculateAverageFunctionLength(ast, code);
    const commentRatio = calculateCommentRatio(code);

    const totalLines = code.split('\n').length;
    const codeLines = code.split('\n').filter(line => line.trim().length > 0).length;

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      maxNestingDepth,
      avgFunctionLength,
      commentRatio,
      totalLines,
      codeLines,
      // 复杂度等级评估
      complexityLevel: getComplexityLevel(cyclomaticComplexity, cognitiveComplexity)
    };
  } catch (error) {
    // 复杂度分析失败时返回 null（静默处理，避免打断进度条）
    // 如需调试，取消下面注释：
    // console.warn(`警告: 无法分析文件 ${filePath} 的复杂度: ${error.message}`);
    return null;
  }
}

/**
 * 批量分析多个文件的复杂度
 * @param {Array<string>} filePaths - 文件路径列表
 * @returns {Object} 汇总的复杂度统计
 */
function analyzeBulkComplexity(filePaths) {
  const results = {
    totalCyclomaticComplexity: 0,
    totalCognitiveComplexity: 0,
    maxNestingDepth: 0,
    avgFunctionLength: 0,
    avgCommentRatio: 0,
    totalLines: 0,
    totalCodeLines: 0,
    analyzedFiles: 0,
    complexityDistribution: {
      low: 0,      // 简单
      medium: 0,   // 中等
      high: 0,     // 复杂
      veryHigh: 0  // 非常复杂
    }
  };

  const validResults = [];

  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const analysis = analyzeComplexity(filePath);
      if (analysis) {
        validResults.push(analysis);
        results.totalCyclomaticComplexity += analysis.cyclomaticComplexity;
        results.totalCognitiveComplexity += analysis.cognitiveComplexity;
        results.maxNestingDepth = Math.max(results.maxNestingDepth, analysis.maxNestingDepth);
        results.totalLines += analysis.totalLines;
        results.totalCodeLines += analysis.codeLines;
        results.analyzedFiles++;

        // 统计复杂度分布
        results.complexityDistribution[analysis.complexityLevel]++;
      }
    }
  });

  // 计算平均值
  if (results.analyzedFiles > 0) {
    results.avgFunctionLength = Math.round(
      validResults.reduce((sum, r) => sum + r.avgFunctionLength, 0) / results.analyzedFiles
    );
    results.avgCommentRatio = Math.round(
      validResults.reduce((sum, r) => sum + r.commentRatio, 0) / results.analyzedFiles
    );
  }

  return results;
}

/**
 * 评估复杂度等级
 * @param {number} cyclomaticComplexity - 圈复杂度
 * @param {number} cognitiveComplexity - 认知复杂度
 * @returns {string} 复杂度等级
 */
function getComplexityLevel(cyclomaticComplexity, cognitiveComplexity) {
  // 综合考虑圈复杂度和认知复杂度
  const avgComplexity = (cyclomaticComplexity + cognitiveComplexity) / 2;

  if (avgComplexity <= 10) return 'low';
  if (avgComplexity <= 20) return 'medium';
  if (avgComplexity <= 40) return 'high';
  return 'veryHigh';
}

/**
 * 计算代码质量得分（0-100）
 * @param {Object} complexityData - 复杂度数据
 * @returns {number} 质量得分
 */
function calculateQualityScore(complexityData) {
  let score = 100;

  // 圈复杂度惩罚（越高扣分越多）
  if (complexityData.totalCyclomaticComplexity > 0) {
    const avgCyclomatic = complexityData.totalCyclomaticComplexity / complexityData.analyzedFiles;
    if (avgCyclomatic > 10) score -= Math.min((avgCyclomatic - 10) * 2, 30);
  }

  // 认知复杂度惩罚
  if (complexityData.totalCognitiveComplexity > 0) {
    const avgCognitive = complexityData.totalCognitiveComplexity / complexityData.analyzedFiles;
    if (avgCognitive > 15) score -= Math.min((avgCognitive - 15) * 1.5, 25);
  }

  // 嵌套深度惩罚
  if (complexityData.maxNestingDepth > 5) {
    score -= Math.min((complexityData.maxNestingDepth - 5) * 4, 20);
  }

  // 函数长度惩罚
  if (complexityData.avgFunctionLength > 50) {
    score -= Math.min((complexityData.avgFunctionLength - 50) / 5, 15);
  }

  // 注释率加分
  if (complexityData.avgCommentRatio > 10) {
    score += Math.min(complexityData.avgCommentRatio / 5, 10);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = {
  analyzeComplexity,
  analyzeBulkComplexity,
  calculateQualityScore,
  getComplexityLevel
};
