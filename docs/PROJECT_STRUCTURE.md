# 项目结构说明

本文档说明 Engineering Value CLI 项目的目录结构和文件组织。

---

## 📂 项目结构

```
engineering-metrics/
│
├── 📄 README.md                    # 项目主文档（快速开始、核心特性）
├── 📄 package.json                 # 项目配置和依赖
├── 📄 .gitignore                   # Git 忽略配置
├── 📄 config.example.json          # 配置示例文件
│
├── 📁 docs/                        # 📚 文档中心
│   ├── 📄 README.md                # 文档导航索引
│   ├── 📄 CHANGELOG.md             # 版本更新记录
│   │
│   ├── 📁 guides/                  # 👥 用户指南
│   │   ├── USER_GUIDE.md           # 完整使用指南
│   │   └── PERFORMANCE_SCORING_GUIDE.md  # 绩效评分指南
│   │
│   └── 📁 references/              # 📋 参考文档
│       └── MAINTAINABILITY_GUIDE.md      # 代码质量评分体系
│
├── 📁 core/                        # 核心功能模块
│   ├── ast.js                      # AST 代码分析
│   ├── churn.js                    # 文件修改频率分析
│   ├── complexity.js               # 复杂度分析
│   ├── git.js                      # Git 命令封装
│   ├── impact.js                   # 影响范围计算
│   ├── maintainability.js          # 可维护性评分
│   ├── report.js                   # 报告生成
│   └── score.js                    # 评分算法
│
├── � bin/                         # �🚀 命令行工具
│   ├── cli.js                      # 单人分析
│   ├── compare.js                  # 多人对比
│   ├── branch-compare.js           # 分支对比
│   ├── branch-multi-compare.js     # 多人多分支对比
│   └── score-team.js               # 团队自动化打分
│
└── 🧪 测试文件
    └── test-quality.js             # 质量分析测试
```

---

## 📄 核心文件说明

### 根目录

| 文件 | 说明 |
|------|------|
| `README.md` | 项目主文档，包含快速开始和核心特性 |
| `package.json` | Node.js 项目配置，定义依赖和命令 |
| `config.example.json` | 配置示例（预留用于自定义配置） |

### 文档目录 (docs/)

| 路径 | 说明 | 目标读者 |
|------|------|----------|
| `docs/README.md` | 文档导航中心 | 所有用户 |
| `docs/guides/USER_GUIDE.md` | 完整使用指南 | 所有用户 |
| `docs/guides/PERFORMANCE_SCORING_GUIDE.md` | 绩效评分指南 | Leader、HR |
| `docs/references/MAINTAINABILITY_GUIDE.md` | 代码质量评分体系 | 开发者 |
| `docs/CHANGELOG.md` | 版本更新记录 | 所有用户 |

### 核心模块 (core/)

| 文件 | 功能 | 主要技术 |
|------|------|----------|
| `ast.js` | JavaScript/TypeScript AST 解析 | @babel/parser |
| `churn.js` | 文件修改频率统计 | Git log |
| `complexity.js` | 圈复杂度和认知复杂度分析 | AST 遍历 |
| `git.js` | Git 命令封装 | child_process |
| `impact.js` | 代码影响范围计算 | 文件统计 |
| `maintainability.js` | 可维护性和可扩展性评分 | 多维度分析 |
| `report.js` | 生成 JSON/MD/HTML 报告 | 模板生成 |
| `score.js` | 工程价值评分算法 | 多维度加权 |

### 命令行工具 (bin/)

| 命令 | 全局命令 | 功能 |
|------|----------|------|
| `bin/cli.js` | `eng-value` | 单人分析 |
| `bin/compare.js` | `eng-compare` | 多人对比 |
| `bin/branch-compare.js` | `eng-branch` | 分支对比（智能去重） |
| `bin/branch-multi-compare.js` | `eng-branch-multi` | 多人多分支对比 |
| `bin/score-team.js` | `eng-score` | 团队自动化打分 |

---

## 📖 文档组织原则

### 分层原则

1. **根目录 README.md**: 入口文档
   - 快速开始
   - 核心特性
   - 基本命令
   - 指向详细文档

2. **docs/README.md**: 文档导航
   - 按受众分类
   - 按场景推荐
   - 快速定位

3. **详细文档**: 分类存放
   - `guides/` - 面向使用的指南
   - `references/` - 面向参考的文档

### 文档分类

**用户指南 (guides/)**
- 面向实际使用场景
- 包含具体步骤和示例
- 强调实战和应用

**参考文档 (references/)**
- 面向深入理解
- 详细的技术说明
- 理论和标准

---

## 🔄 文档更新流程

### 添加新功能时

1. 更新 `README.md` - 添加到相应的命令速查表
2. 更新 `docs/guides/USER_GUIDE.md` - 添加详细说明和案例
3. 更新 `docs/CHANGELOG.md` - 记录版本变更
4. 如果涉及评分算法，更新 `docs/references/MAINTAINABILITY_GUIDE.md`

### 修复 Bug 时

1. 更新 `docs/CHANGELOG.md` - 记录修复内容
2. 如果影响使用，更新 `README.md` 的常见问题
3. 如果需要详细说明，更新 `docs/guides/USER_GUIDE.md`

---

## 🎯 快速定位

### 我想找...

- **快速开始**: `README.md` → 快速开始
- **详细命令**: `docs/guides/USER_GUIDE.md`
- **如何打分**: `docs/guides/PERFORMANCE_SCORING_GUIDE.md`
- **评分标准**: `docs/references/MAINTAINABILITY_GUIDE.md`
- **版本历史**: `docs/CHANGELOG.md`
- **所有文档**: `docs/README.md`

---

## 📝 维护建议

1. **保持简洁**: README.md 应该简洁明了，详细内容放在 docs/
2. **及时更新**: 代码变更后及时更新相关文档
3. **链接正确**: 确保文档间的链接正确有效
4. **分类清晰**: 新文档应放在合适的目录
5. **用户视角**: 文档组织应从用户视角出发

---

**最后更新**: 2026年2月27日
