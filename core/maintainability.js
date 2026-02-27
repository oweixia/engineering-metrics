const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

/**
 * 分析代码可维护性指标
 * @param {string} filePath - 文件路径
 * @returns {Object|null} 可维护性分析结果
 */
function analyzeMaintainability(filePath) {
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

    // 可维护性指标
    const functionLengths = [];
    const variableNames = [];
    let maxNestingDepth = 0;
    let currentDepth = 0;
    let magicNumbers = 0;
    let todoComments = 0;
    let documentationComments = 0;
    let singleCharVars = 0;
    let meaningfulNames = 0;

    traverse(ast, {
      // 函数长度统计
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
      },

      // 嵌套深度
      BlockStatement: {
        enter() {
          currentDepth++;
          maxNestingDepth = Math.max(maxNestingDepth, currentDepth);
        },
        exit() {
          currentDepth--;
        }
      },

      // 魔法数字检测（硬编码的数字，排除 0, 1, -1）
      NumericLiteral(path) {
        const value = path.node.value;
        // 排除常见的安全数字
        if (![0, 1, -1, 2, 10, 100, 1000].includes(value)) {
          // 不在常量定义中才算魔法数字
          const parent = path.parent;
          if (parent.type !== 'VariableDeclarator' && parent.type !== 'AssignmentExpression') {
            magicNumbers++;
          }
        }
      },

      // 变量命名分析
      VariableDeclarator(path) {
        if (path.node.id && path.node.id.name) {
          const name = path.node.id.name;
          variableNames.push(name);
          
          // 单字符变量（除了循环变量 i, j, k）
          if (name.length === 1 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(name)) {
            singleCharVars++;
          }
          
          // 有意义的命名：驼峰命名、下划线命名、长度 > 3
          if (name.length > 3 && /^[a-z][a-zA-Z0-9_]*$/.test(name)) {
            meaningfulNames++;
          }
        }
      },

      // Identifier 命名分析
      Identifier(path) {
        const name = path.node.name;
        if (name && path.parent.type === 'FunctionDeclaration') {
          if (name.length > 3 && /^[a-z][a-zA-Z0-9]*$/.test(name)) {
            meaningfulNames++;
          }
        }
      }
    });

    // 注释分析
    const { commentRatio, todoCount, docCount } = analyzeComments(code);
    todoComments = todoCount;
    documentationComments = docCount;

    // 计算指标
    const lines = code.split('\n');
    const totalLines = lines.length;
    const codeLines = lines.filter(line => line.trim().length > 0).length;
    
    const avgFunctionLength = functionLengths.length > 0
      ? functionLengths.reduce((a, b) => a + b, 0) / functionLengths.length
      : 0;
    
    const maxFunctionLength = functionLengths.length > 0
      ? Math.max(...functionLengths)
      : 0;

    const namingQuality = variableNames.length > 0
      ? (meaningfulNames / variableNames.length) * 100
      : 100;

    return {
      // 基础指标
      totalLines,
      codeLines,
      commentRatio,
      
      // 函数指标
      functionCount: functionLengths.length,
      avgFunctionLength: Math.round(avgFunctionLength),
      maxFunctionLength,
      
      // 复杂度指标
      maxNestingDepth,
      magicNumbers,
      
      // 命名指标
      totalVariables: variableNames.length,
      singleCharVars,
      meaningfulNames,
      namingQuality: Math.round(namingQuality),
      
      // 文档指标
      todoComments,
      documentationComments
    };

  } catch (error) {
    return null;
  }
}

/**
 * 分析代码可扩展性指标
 * @param {string} filePath - 文件路径
 * @returns {Object|null} 可扩展性分析结果
 */
function analyzeExtensibility(filePath) {
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

    // 可扩展性指标
    let interfaces = 0;
    let abstractClasses = 0;
    let exports = 0;
    let imports = 0;
    let classes = 0;
    let functions = 0;
    let typeDefinitions = 0;
    let generics = 0;
    let decorators = 0;
    let designPatterns = {
      factory: 0,      // 工厂模式
      singleton: 0,    // 单例模式
      strategy: 0,     // 策略模式
      observer: 0,     // 观察者模式
      builder: 0       // 建造者模式
    };

    traverse(ast, {
      // TypeScript 接口
      TSInterfaceDeclaration() {
        interfaces++;
      },

      // TypeScript 类型别名
      TSTypeAliasDeclaration() {
        typeDefinitions++;
      },

      // 泛型
      TSTypeParameterDeclaration() {
        generics++;
      },

      // 类
      ClassDeclaration(path) {
        classes++;
        
        // 检测抽象类
        if (path.node.abstract) {
          abstractClasses++;
        }

        // 检测单例模式（简化版）
        const className = path.node.id ? path.node.id.name : '';
        if (className.toLowerCase().includes('singleton') || 
            code.includes(`${className}.instance`)) {
          designPatterns.singleton++;
        }

        // 检测建造者模式
        if (className.toLowerCase().includes('builder')) {
          designPatterns.builder++;
        }
      },

      // 函数
      FunctionDeclaration(path) {
        functions++;
        
        const funcName = path.node.id ? path.node.id.name.toLowerCase() : '';
        
        // 检测工厂模式
        if (funcName.includes('create') || funcName.includes('factory') || 
            funcName.includes('builder')) {
          designPatterns.factory++;
        }

        // 检测策略模式
        if (funcName.includes('strategy') || funcName.includes('algorithm')) {
          designPatterns.strategy++;
        }
      },

      // 导出
      ExportNamedDeclaration() {
        exports++;
      },
      ExportDefaultDeclaration() {
        exports++;
      },

      // 导入
      ImportDeclaration() {
        imports++;
      },

      // 装饰器
      Decorator() {
        decorators++;
      },

      // 观察者模式检测（简化版）
      CallExpression(path) {
        if (path.node.callee.name) {
          const name = path.node.callee.name.toLowerCase();
          if (name.includes('subscribe') || name.includes('observe') || 
              name.includes('listen') || name.includes('on')) {
            designPatterns.observer++;
          }
        }
      }
    });

    // 计算模块化程度
    const modularity = (exports + imports) / Math.max(1, classes + functions);
    
    // 计算抽象化程度
    const abstraction = (interfaces + abstractClasses + typeDefinitions) / 
                       Math.max(1, classes + functions);

    // 设计模式使用总数
    const totalPatterns = Object.values(designPatterns).reduce((a, b) => a + b, 0);

    return {
      // 接口和抽象
      interfaces,
      abstractClasses,
      typeDefinitions,
      generics,
      decorators,
      
      // 模块化
      exports,
      imports,
      modularity: Math.round(modularity * 100) / 100,
      
      // 代码结构
      classes,
      functions,
      
      // 抽象化程度
      abstractionRatio: Math.round(abstraction * 100),
      
      // 设计模式
      designPatterns,
      totalPatterns,
      
      // 开闭原则指标（通过接口和抽象类的使用程度）
      ocpScore: Math.min(100, Math.round((interfaces + abstractClasses) * 10))
    };

  } catch (error) {
    return null;
  }
}

/**
 * 分析注释详情
 * @param {string} code - 源代码
 * @returns {Object} 注释统计
 */
function analyzeComments(code) {
  const lines = code.split('\n');
  let commentLines = 0;
  let codeLines = 0;
  let todoCount = 0;
  let docCount = 0;
  let inBlockComment = false;
  let isDocComment = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (!trimmed) return;

    // 检查块注释开始
    if (trimmed.startsWith('/**')) {
      inBlockComment = true;
      isDocComment = true;
    } else if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      isDocComment = false;
    }
    
    if (inBlockComment) {
      commentLines++;
      
      // TODO 注释
      if (trimmed.toLowerCase().includes('todo') || 
          trimmed.toLowerCase().includes('fixme')) {
        todoCount++;
      }
      
      // 文档注释
      if (isDocComment) {
        docCount++;
      }
      
      if (trimmed.includes('*/')) {
        inBlockComment = false;
        isDocComment = false;
      }
      return;
    }

    // 单行注释
    if (trimmed.startsWith('//')) {
      commentLines++;
      
      if (trimmed.toLowerCase().includes('todo') || 
          trimmed.toLowerCase().includes('fixme')) {
        todoCount++;
      }
      return;
    }

    codeLines++;
  });

  const totalLines = commentLines + codeLines;
  const commentRatio = totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;

  return {
    commentRatio,
    todoCount,
    docCount: Math.round(docCount / Math.max(1, commentLines) * 100) // 文档注释占比
  };
}

/**
 * 批量分析可维护性
 * @param {Array<string>} filePaths - 文件路径列表
 * @returns {Object} 汇总的可维护性统计
 */
function analyzeBulkMaintainability(filePaths) {
  const results = {
    totalLines: 0,
    totalCodeLines: 0,
    avgCommentRatio: 0,
    avgFunctionLength: 0,
    maxFunctionLength: 0,
    avgNestingDepth: 0,
    maxNestingDepth: 0,
    totalMagicNumbers: 0,
    avgNamingQuality: 0,
    totalTodoComments: 0,
    totalDocComments: 0,
    analyzedFiles: 0
  };

  const validResults = [];

  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const analysis = analyzeMaintainability(filePath);
      if (analysis) {
        validResults.push(analysis);
        results.totalLines += analysis.totalLines;
        results.totalCodeLines += analysis.codeLines;
        results.maxFunctionLength = Math.max(results.maxFunctionLength, analysis.maxFunctionLength);
        results.maxNestingDepth = Math.max(results.maxNestingDepth, analysis.maxNestingDepth);
        results.totalMagicNumbers += analysis.magicNumbers;
        results.totalTodoComments += analysis.todoComments;
        results.totalDocComments += analysis.documentationComments;
        results.analyzedFiles++;
      }
    }
  });

  // 计算平均值
  if (results.analyzedFiles > 0) {
    results.avgCommentRatio = Math.round(
      validResults.reduce((sum, r) => sum + r.commentRatio, 0) / results.analyzedFiles
    );
    results.avgFunctionLength = Math.round(
      validResults.reduce((sum, r) => sum + r.avgFunctionLength, 0) / results.analyzedFiles
    );
    results.avgNestingDepth = Math.round(
      validResults.reduce((sum, r) => sum + r.maxNestingDepth, 0) / results.analyzedFiles * 10
    ) / 10;
    results.avgNamingQuality = Math.round(
      validResults.reduce((sum, r) => sum + r.namingQuality, 0) / results.analyzedFiles
    );
  }

  return results;
}

/**
 * 批量分析可扩展性
 * @param {Array<string>} filePaths - 文件路径列表
 * @returns {Object} 汇总的可扩展性统计
 */
function analyzeBulkExtensibility(filePaths) {
  const results = {
    totalInterfaces: 0,
    totalAbstractClasses: 0,
    totalTypeDefinitions: 0,
    totalGenerics: 0,
    totalDecorators: 0,
    totalExports: 0,
    totalImports: 0,
    avgModularity: 0,
    avgAbstractionRatio: 0,
    avgOcpScore: 0,
    designPatterns: {
      factory: 0,
      singleton: 0,
      strategy: 0,
      observer: 0,
      builder: 0
    },
    totalPatterns: 0,
    analyzedFiles: 0
  };

  const validResults = [];

  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const analysis = analyzeExtensibility(filePath);
      if (analysis) {
        validResults.push(analysis);
        results.totalInterfaces += analysis.interfaces;
        results.totalAbstractClasses += analysis.abstractClasses;
        results.totalTypeDefinitions += analysis.typeDefinitions;
        results.totalGenerics += analysis.generics;
        results.totalDecorators += analysis.decorators;
        results.totalExports += analysis.exports;
        results.totalImports += analysis.imports;
        results.totalPatterns += analysis.totalPatterns;
        
        // 累加设计模式
        Object.keys(analysis.designPatterns).forEach(pattern => {
          results.designPatterns[pattern] += analysis.designPatterns[pattern];
        });
        
        results.analyzedFiles++;
      }
    }
  });

  // 计算平均值
  if (results.analyzedFiles > 0) {
    results.avgModularity = Math.round(
      validResults.reduce((sum, r) => sum + r.modularity, 0) / results.analyzedFiles * 100
    ) / 100;
    results.avgAbstractionRatio = Math.round(
      validResults.reduce((sum, r) => sum + r.abstractionRatio, 0) / results.analyzedFiles
    );
    results.avgOcpScore = Math.round(
      validResults.reduce((sum, r) => sum + r.ocpScore, 0) / results.analyzedFiles
    );
  }

  return results;
}

/**
 * 计算可维护性得分（0-100）
 * @param {Object} maintainabilityData - 可维护性数据
 * @returns {number} 可维护性得分
 */
function calculateMaintainabilityScore(maintainabilityData) {
  let score = 100;

  // 注释率加分（10-30% 最佳）
  const commentRatio = maintainabilityData.avgCommentRatio;
  if (commentRatio < 10) {
    score -= (10 - commentRatio) * 2; // 注释太少扣分
  } else if (commentRatio > 30) {
    score -= (commentRatio - 30) * 0.5; // 注释过多也不好
  } else {
    score += 10; // 适当的注释加分
  }

  // 函数长度惩罚（超过50行扣分）
  if (maintainabilityData.avgFunctionLength > 50) {
    score -= Math.min((maintainabilityData.avgFunctionLength - 50) * 0.5, 20);
  }

  // 最大函数长度惩罚
  if (maintainabilityData.maxFunctionLength > 100) {
    score -= Math.min((maintainabilityData.maxFunctionLength - 100) * 0.3, 15);
  }

  // 嵌套深度惩罚
  if (maintainabilityData.avgNestingDepth > 4) {
    score -= Math.min((maintainabilityData.avgNestingDepth - 4) * 5, 20);
  }

  // 魔法数字惩罚
  if (maintainabilityData.totalMagicNumbers > 5) {
    score -= Math.min(maintainabilityData.totalMagicNumbers * 0.5, 10);
  }

  // 命名质量加分
  score += maintainabilityData.avgNamingQuality * 0.1;

  // TODO 注释惩罚（未完成的工作）
  if (maintainabilityData.totalTodoComments > 10) {
    score -= Math.min(maintainabilityData.totalTodoComments * 0.3, 10);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 计算可扩展性得分（0-100）
 * @param {Object} extensibilityData - 可扩展性数据
 * @returns {number} 可扩展性得分
 */
function calculateExtensibilityScore(extensibilityData) {
  let score = 50; // 基础分

  // 接口和抽象类加分
  score += Math.min(extensibilityData.totalInterfaces * 3, 15);
  score += Math.min(extensibilityData.totalAbstractClasses * 4, 15);

  // 类型定义加分
  score += Math.min(extensibilityData.totalTypeDefinitions * 2, 10);

  // 泛型使用加分
  score += Math.min(extensibilityData.totalGenerics * 2, 10);

  // 模块化程度加分
  score += extensibilityData.avgModularity * 5;

  // 抽象化程度加分
  score += extensibilityData.avgAbstractionRatio * 0.2;

  // 设计模式加分
  score += Math.min(extensibilityData.totalPatterns * 3, 15);

  // 开闭原则得分
  score += extensibilityData.avgOcpScore * 0.1;

  // 装饰器使用加分
  score += Math.min(extensibilityData.totalDecorators * 2, 5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 综合质量评估
 * @param {Array<string>} filePaths - 文件路径列表
 * @returns {Object} 综合质量报告
 */
function comprehensiveQualityAnalysis(filePaths) {
  const maintainability = analyzeBulkMaintainability(filePaths);
  const extensibility = analyzeBulkExtensibility(filePaths);
  
  const maintainabilityScore = calculateMaintainabilityScore(maintainability);
  const extensibilityScore = calculateExtensibilityScore(extensibility);
  
  // 综合质量得分（可维护性 60%，可扩展性 40%）
  const overallScore = Math.round(maintainabilityScore * 0.6 + extensibilityScore * 0.4);
  
  return {
    maintainability: {
      ...maintainability,
      score: maintainabilityScore,
      level: getQualityLevel(maintainabilityScore)
    },
    extensibility: {
      ...extensibility,
      score: extensibilityScore,
      level: getQualityLevel(extensibilityScore)
    },
    overall: {
      score: overallScore,
      level: getQualityLevel(overallScore)
    }
  };
}

/**
 * 获取质量等级
 * @param {number} score - 得分
 * @returns {string} 等级
 */
function getQualityLevel(score) {
  if (score >= 90) return '优秀';
  if (score >= 75) return '良好';
  if (score >= 60) return '中等';
  if (score >= 40) return '较差';
  return '差';
}

module.exports = {
  analyzeMaintainability,
  analyzeExtensibility,
  analyzeBulkMaintainability,
  analyzeBulkExtensibility,
  calculateMaintainabilityScore,
  calculateExtensibilityScore,
  comprehensiveQualityAnalysis,
  getQualityLevel
};
