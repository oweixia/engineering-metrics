const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

/**
 * 分析 JavaScript/TypeScript 文件的 AST
 * @param {string} filePath - 文件路径
 * @returns {Object} AST 分析结果
 */
function analyzeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // 忽略非代码文件
  const binaryExtensions = [".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot"];
  if (binaryExtensions.includes(ext)) {
    return { functions: 0, classes: 0, interfaces: 0, hooks: 0, exports: 0, imports: 0 };
  }

  // 只分析 JS/TS 文件
  if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext)) {
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      
      // 忽略空文件或过小的文件
      if (code.trim().length < 10) {
        return { functions: 0, classes: 0, interfaces: 0, hooks: 0, exports: 0, imports: 0 };
      }

      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy"],
        errorRecovery: true
      });

      let functions = 0,
        classes = 0,
        interfaces = 0,
        hooks = 0,
        exports = 0,
        imports = 0;

      traverse(ast, {
        FunctionDeclaration() {
          functions++;
        },
        FunctionExpression() {
          functions++;
        },
        ArrowFunctionExpression() {
          functions++;
        },
        ClassDeclaration() {
          classes++;
        },
        TSInterfaceDeclaration() {
          interfaces++;
        },
        TSTypeAliasDeclaration() {
          interfaces++;
        },
        CallExpression(path) {
          const name = path.node.callee.name;
          if (name && /^use[A-Z]/.test(name)) {
            hooks++;
          }
        },
        ExportNamedDeclaration() {
          exports++;
        },
        ExportDefaultDeclaration() {
          exports++;
        },
        ImportDeclaration() {
          imports++;
        }
      });

      return { functions, classes, interfaces, hooks, exports, imports };
    } catch (error) {
      // AST 解析失败时返回零值（静默处理，避免打断进度条）
      // 如需调试，取消下面注释：
      // console.warn(`警告: 无法解析文件 ${filePath}: ${error.message}`);
      return { functions: 0, classes: 0, interfaces: 0, hooks: 0, exports: 0, imports: 0 };
    }
  }

  // 其他文件类型返回零值
  return { functions: 0, classes: 0, interfaces: 0, hooks: 0, exports: 0, imports: 0 };
}

/**
 * 批量分析多个文件
 * @param {Array<string>} filePaths - 文件路径列表
 * @returns {Object} 汇总的 AST 统计
 */
function analyzeBulk(filePaths) {
  const summary = {
    functions: 0,
    classes: 0,
    interfaces: 0,
    hooks: 0,
    exports: 0,
    imports: 0,
    analyzedFiles: 0
  };

  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = analyzeFile(filePath);
      Object.keys(summary).forEach(key => {
        if (key !== 'analyzedFiles') {
          summary[key] += stats[key];
        }
      });
      summary.analyzedFiles++;
    }
  });

  return summary;
}

module.exports = { analyzeFile, analyzeBulk };