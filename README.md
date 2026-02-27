# Engineering Value CLI - 工程价值分析工具

> 一个强大的 Git 代码贡献分析工具，基于 AST 深度分析，自动评估和量化开发者的工程价值。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org)

---

## ✨ 核心特性

### 📊 全面的代码分析
- **智能统计**: 自动统计 commit 数、代码行数、文件修改等
- **AST 深度分析**: 基于 Babel 解析 JavaScript/TypeScript 代码结构
- **多维度评分**: 工程价值、代码质量、复杂度、影响范围等
- **圈复杂度分析**: 评估代码逻辑复杂度和认知难度

### 💎 代码质量评估
- **可维护性评分**: 注释率、函数长度、嵌套深度、命名质量等 8 项指标
- **可扩展性评分**: 接口使用、设计模式、模块化、抽象化等 9 项指标
- **设计模式识别**: 自动检测工厂、单例、策略、观察者、建造者等 5 种模式
- **质量得分**: 综合评估代码健壮性和工程质量（0-100分）

### 🆚 多人对比功能
- **团队对比**: 对比多个开发者的代码质量和贡献
- **分支对比**: 分析不同分支的贡献，**智能去重**避免重复统计
- **多人多分支**: 综合对比多个开发者在多个分支上的表现
- **自动化打分**: 基于多维度自动计算团队成员的综合得分和等级

### 📈 精美报告
- **多格式输出**: JSON、Markdown、HTML 等多种报告格式
- **可视化报告**: 精美的 HTML 报告，包含图表、排名和详细分析
- **个人评估**: 为每个员工生成单独的个人评估报告
- **年度总结**: 自动生成详细的年度工作总结文档

---

## 📦 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd engineering-value-cli-ast-textsafe

# 安装依赖
npm install

# 全局安装（推荐）
npm link
```

### 基本使用

```bash
# 进入你的 Git 仓库
cd /path/to/your/git/repo

# 分析个人贡献
eng-value 2024 "你的名字"

# 对比团队成员
eng-compare 2024 "成员A" "成员B" "成员C"

# 分支对比（智能去重）
eng-branch 2024 "你的名字" main develop

# 多人多分支对比
eng-branch-multi 2024 main develop -- "成员A" "成员B"

# 自动化打分
eng-score ./comparison-report-2024.json
```

---

## 📖 命令速查

| 命令 | 功能 | 示例 |
|------|------|------|
| `cli.js` | 单人分析 | `node bin/cli.js 2024 "张三"` |
| `compare.js` | 多人对比 | `node bin/compare.js 2024 "张三" "李四"` |
| `branch-compare.js` | 分支对比 | `node bin/branch-compare.js 2024 "张三" main develop` |
| `branch-multi-compare.js` | 多人多分支对比 | `node bin/branch-multi-compare.js 2024 main -- "张三" "李四"` |
| `score-team.js` | 自动化打分 | `node bin/score-team.js ./comparison-report-2024.json` |

**全局命令**（执行 `npm link` 后可用）：

| 全局命令 | 对应脚本 |
|----------|----------|
| `eng-value` | `bin/cli.js` |
| `eng-compare` | `bin/compare.js` |
| `eng-branch` | `bin/branch-compare.js` |
| `eng-branch-multi` | `bin/branch-multi-compare.js` |
| `eng-score` | `bin/score-team.js` |

---

## 📊 评分维度

### 1. 影响范围 (Impact Score)
- 修改的文件数量
- 涉及的目录数量
- 代码行变更规模

### 2. 代码质量 (AST Analysis)
- 函数、类、接口、类型定义
- React Hooks 使用
- 代码结构复杂度

### 3. 复杂度分析 (Complexity)
- **圈复杂度**: 基于控制流的分支数量
- **认知复杂度**: 代码理解难度
- **质量得分**: 综合复杂度评估（0-100）

### 4. 可维护性评分 (Maintainability)
- 注释率、函数长度、嵌套深度
- 魔法数字、命名质量、TODO 注释
- 文档注释、综合得分（0-100）

### 5. 可扩展性评分 (Extensibility)
- 接口使用、抽象类、类型定义
- 泛型、模块化、抽象化
- 设计模式、开闭原则、装饰器
- 综合得分（0-100）

### 6. 代码量 (Code Volume)
- 新增代码行数（使用对数避免堆代码）
- 删除冗余代码加分

### 7. 代码稳定性 (Churn Score)
- 文件修改频率
- 代码设计稳定性

### 得分等级

- **S 级**: ≥ 100 分 - 🏆 卓越贡献
- **A 级**: 70-99 分 - 🥇 优秀贡献
- **B 级**: 50-69 分 - 🥈 良好贡献
- **C 级**: 30-49 分 - 🥉 一般贡献
- **D 级**: < 30 分 - 📊 基础贡献

---

## 📁 输出报告

### 单人分析
- `engineering-report-<年份>.json` - 完整 JSON 数据
- `engineering-report-<年份>.md` - Markdown 摘要
- `engineering-report-<年份>.html` - **精美可视化报告** 🌟
- `annual-report-<年份>.md` - 年度工作总结

### 多人对比
- `comparison-report-<年份>.json` - 对比数据
- `comparison-report-<年份>.md` - 对比报告
- `comparison-report-<年份>.html` - **对比排名报告** 🌟

### 分支对比
- `branch-report-<年份>-<分支们>.json` - 分支数据
- `branch-report-<年份>-<分支们>.md` - 分支报告
- `branch-report-<年份>-<分支们>.html` - **分支可视化** 🌟

### 团队打分
- `*-scoring.json` - 评分数据
- `*-scoring.md` - 评分报告
- `*-scoring.html` - **评分可视化** 🌟
- `individual-<员工名>.html` - 个人评估报告

---

## 💡 使用场景

### 👤 个人开发者
- ✅ 生成年度工作总结
- ✅ 展示技术成长轨迹
- ✅ 量化代码贡献价值
- ✅ 准备绩效评估材料

### 👔 团队 Leader
- ✅ 评估团队成员表现
- ✅ 对比代码质量和产出
- ✅ 识别团队技术亮点
- ✅ 制定改进计划和目标
- ✅ 科学的绩效打分依据

### 🏢 技术管理
- ✅ 追踪项目进度和质量
- ✅ 分析版本发布贡献
- ✅ 优化团队资源分配
- ✅ 识别技术债务

---

## 🔧 技术栈

- **Node.js** - 运行环境 (>= 14.0)
- **@babel/parser** - JavaScript/TypeScript AST 解析
- **@babel/traverse** - AST 遍历和分析
- **Git** - 版本控制信息获取

---

## 📚 完整文档

> 📖 **[查看文档中心](docs/README.md)** - 所有文档的详细导航和按场景推荐

| 文档 | 说明 |
|------|------|
| **[📖 完整使用指南](docs/guides/USER_GUIDE.md)** | 详细的命令说明、实战案例和进阶技巧 |
| **[👔 绩效评分指南](docs/guides/PERFORMANCE_SCORING_GUIDE.md)** | 领导必读：如何基于报告科学打分 |
| **[🔧 代码质量评分](docs/references/MAINTAINABILITY_GUIDE.md)** | 可维护性和可扩展性评分体系 |
| **[📋 更新日志](docs/CHANGELOG.md)** | 版本更新记录和新功能 |

---

## ⚡ 快速示例

### 示例 1: 个人年度总结

```bash
# 分析 2024 年的贡献
eng-value 2024 "你的名字"

# 在浏览器中打开精美报告
open engineering-report-2024.html
```

**你将得到**:
- ✅ 全年提交数和工程价值得分
- ✅ 代码质量、可维护性、可扩展性评估
- ✅ Top 10 高价值贡献
- ✅ 月度工作分布图
- ✅ 技术栈和能力展示

### 示例 2: 团队绩效评估

```bash
# 1. 对比团队成员
eng-compare 2024 "成员A" "成员B" "成员C"

# 2. 自动化打分
eng-score ./comparison-report-2024.json

# 3. 打开评分报告
open comparison-report-2024-scoring.html
```

**你将得到**:
- 📊 团队成员综合排名（S/A/B/C/D 等级）
- 📈 6 大维度详细对比
- 🎯 优势和改进建议
- 💯 科学的评分结果和性能系数
- 📄 每个员工的个人评估报告

### 示例 3: 发版分支分析（避免重复统计）

```bash
# 分析发版分支的贡献（智能去重）
eng-branch 2024 "你的名字" release/v2.0 develop main

# 查看报告
open branch-report-2024-release-v2.0-develop-main.html
```

**你将得到**:
- ✅ 每个分支的独有 commit
- ✅ 共享 commit（避免重复统计）
- ✅ 每个分支的得分
- ✅ 总工作量（已去重）

---

## ⚠️ 注意事项

1. **必须在 Git 仓库目录下运行**
2. **Git 用户名必须与 commit 作者名完全匹配**（区分大小写）
3. **年份范围**: 2000 年至当前年份
4. **性能**: 处理大量 commit 时可能需要较长时间
5. **权限**: 确保有当前目录的写入权限

---

## 🐛 常见问题

### Q: 提示 "当前目录不是 Git 仓库"
**A**: 请在 Git 仓库的根目录下运行命令。使用 `git status` 检查。

### Q: 找不到 commit
**A**: 检查 Git 用户名是否正确。使用 `git log --author="用户名"` 验证。

### Q: Git 用户名如何查看？
**A**: 
```bash
# 查看所有作者
git log --format='%an' | sort -u

# 查看你的配置
git config user.name
```

### Q: 如何自定义评分权重？
**A**: 编辑 `score-team.js` 中的 `WEIGHTS` 配置，或修改 `core/score.js` 中的评分算法。详见 [完整使用指南](docs/guides/USER_GUIDE.md)。

### Q: 多分支对比时如何去重？
**A**: 工具会自动识别和去重共享的 commit（通过 commit hash）。同一个 commit 在多个分支中只会被统计一次。

更多问题请查看 **[完整使用指南](docs/guides/USER_GUIDE.md)** 的常见问题章节。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南

```bash
# 克隆项目
git clone <repository-url>
cd engineering-value-cli-ast-textsafe

# 安装依赖
npm install

# 运行测试
node test-quality.js

# 提交代码
git add .
git commit -m "feat: your feature"
git push
```

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🌟 致谢

感谢所有为本项目做出贡献的开发者！

---

**提示**: 这个工具主要用于个人工作总结和绩效评估，评分结果仅供参考，不应作为唯一的评价标准。代码质量和工程价值的评估应该是多维度的，需要结合实际项目情况和团队文化。

**最后更新**: 2026年2月27日  
**当前版本**: 1.0.0
