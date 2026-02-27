# Engineering Value CLI - 完整使用指南

> **版本**: 2.0  
> **更新日期**: 2026年2月

---

## 📖 目录

- [快速开始](#快速开始)
- [命令详解](#命令详解)
  - [单人分析](#单人分析)
  - [多人对比](#多人对比)
  - [分支对比](#分支对比)
  - [多人多分支对比](#多人多分支对比)
  - [团队自动化打分](#团队自动化打分)
- [报告说明](#报告说明)
- [实战案例](#实战案例)
- [常见问题](#常见问题)
- [进阶使用](#进阶使用)

---

## 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd engineering-metrics

# 安装依赖
npm install

# 全局安装（推荐）
npm link
```

### 第一次使用

```bash
# 进入你的 Git 仓库
cd /path/to/your/git/repo

# 分析自己在 2024 年的贡献
node /path/to/cli.js 2024 "你的名字"

# 或使用全局命令（如果已执行 npm link）
eng-value 2024 "你的名字"
```

---

## 命令详解

### 单人分析

分析单个开发者在指定年份的所有贡献。

#### 语法

```bash
node bin/cli.js <年份> "<Git 用户名>"
```

#### 参数说明

- **年份**: 2000 至当前年份之间的任意年份
- **Git 用户名**: 必须与 Git commit 作者名完全匹配（区分大小写）

#### 示例

```bash
# 分析 2024 年的贡献
node bin/cli.js 2024 "张三"

# 使用全局命令
eng-value 2024 "张三"

# 分析去年的贡献
eng-value 2023 "Zhang San"
```

#### 输出文件

运行后会生成以下报告文件：

- `engineering-report-<年份>.json` - 完整的 JSON 数据
- `engineering-report-<年份>.md` - Markdown 格式摘要报告
- `engineering-report-<年份>.html` - 精美的 HTML 可视化报告（**推荐在浏览器中打开**）
- `annual-report-<年份>.md` - 详细的年度工作总结

#### 示例输出

```
🔍 开始分析 2024 年 张三 的工程贡献...

✅ 找到 156 个 commit，开始分析...

进度: [██████████████████████████████████████████████████] 100% (156/156)

📊 统计摘要:
   总提交数: 156
   总得分: 12458.32
   平均得分: 79.86 (A 级)
   代码行数: +15234 -8765
   修改文件: 432 个
   
📈 代码质量指标:
   新增函数: 287 个
   新增类: 45 个
   新增接口: 123 个
   React Hooks: 34 个
   平均复杂度: 5.2
   质量得分: 78/100
   
🔧 可维护性得分: 82/100 (良好)
   注释率: 18%
   平均函数长度: 35 行
   命名质量: 92%
   
🚀 可扩展性得分: 75/100 (良好)
   接口使用: 123 个
   设计模式: 15 处
   模块化程度: 85%

💾 生成报告...

✅ 报告生成完成！
   - engineering-report-2024.json
   - engineering-report-2024.md
   - engineering-report-2024.html
   - annual-report-2024.md
```

---

### 多人对比

对比多个开发者的工程贡献，生成排名和对比报告。

#### 语法

```bash
node bin/compare.js <年份> "<开发者1>" "<开发者2>" [<开发者3>] ...
```

#### 参数说明

- **年份**: 对比的年份
- **开发者**: 至少 2 个开发者的 Git 用户名

#### 示例

```bash
# 对比两个人
node bin/compare.js 2024 "张三" "李四"

# 对比多个人
node bin/compare.js 2024 "张三" "李四" "王五" "赵六"

# 使用全局命令
eng-compare 2024 "张三" "李四"
```

#### 输出文件

- `comparison-report-<年份>.json` - 完整的对比数据
- `comparison-report-<年份>.md` - Markdown 格式对比报告
- `comparison-report-<年份>.html` - 精美的对比排名可视化报告（**强烈推荐**）

#### 对比内容

对比报告包含：
- 📊 **综合排名**: 按平均得分排序，显示奖牌（🥇🥈🥉）
- 📈 **详细统计**: 每个人的提交数、得分、代码量等
- 🏆 **Top 5 提交**: 每个人的最高价值贡献
- 📉 **多维对比**: 代码量、工程质量、影响范围等
- 🎯 **亮点总结**: 自动识别各项指标的最佳表现者
- 🔧 **可维护性对比**: 注释率、函数长度、命名质量等
- 🚀 **可扩展性对比**: 接口使用、设计模式、模块化程度等

#### 示例输出

```
📊 ═══════════════════════════════════════════════════════
                    对比统计摘要
═══════════════════════════════════════════════════════

排名  开发者           提交数    总得分    平均得分   等级    代码行数
────────────────────────────────────────────────────────────────
🥇 1  张三              156     12458     79.86      A    +15234/-8765
🥈 2  李四              203     15234     75.07      A    +18765/-10234
🥉 3  王五               89      5432     61.04      B    +7234/-4321

🎯 亮点分析:
   🌟 综合得分最高: 张三（平均得分 79.86）
   💪 提交次数最多: 李四（203 次）
   ✍️ 代码量最大: 李四（+18765 行）
   💎 代码质量最好: 张三（质量得分 78/100）

✅ 对比报告生成完成！
   - comparison-report-2024.json
   - comparison-report-2024.md
   - comparison-report-2024.html
```

---

### 分支对比

分析单个开发者在不同 Git 分支上的贡献，**自动去重**避免重复统计。

#### 核心特性

- ✅ **智能去重**: 同一个 commit 在多个分支中只统计一次（自动识别 merge）
- 📊 **分支统计**: 显示每个分支的独有 commit 和共享 commit
- 🔗 **关联分析**: 识别哪些 commit 被合并到多个分支
- 🏆 **分支得分**: 计算每个分支的总得分和平均得分

#### 语法

```bash
node bin/branch-compare.js <年份> "<Git 用户名>" [<分支1>] [<分支2>] ...
```

#### 参数说明

- **年份**: 分析的年份
- **Git 用户名**: 开发者的 Git 用户名
- **分支**: 可选，不指定时会列出所有分支供选择

#### 示例

```bash
# 查看所有分支列表
node bin/branch-compare.js 2024 "张三"

# 对比多个分支的贡献
node bin/branch-compare.js 2024 "张三" main develop feature/new-component

# 分析主分支和开发分支
node bin/branch-compare.js 2024 "张三" main develop

# 使用全局命令
eng-branch 2024 "张三" main develop
```

#### 输出文件

- `branch-report-<年份>-<分支名们>.json` - 完整的分支对比数据
- `branch-report-<年份>-<分支名们>.md` - Markdown 格式报告
- `branch-report-<年份>-<分支名们>.html` - HTML 可视化报告

#### 示例输出

```
🌳 开始分析 2024 年 张三 的分支贡献...

📊 分析分支: main, develop, feature/payment

═══════════════════════════════════════════════════════
                  分支统计概览
═══════════════════════════════════════════════════════

总 commit 数（已去重）: 156
共享 commit 数: 23

分支             总 Commit   独有 Commit   共享 Commit
────────────────────────────────────────────────────
main                   134            111            23
develop                145            122            23
feature/payment         45             45             0

📌 共享 Commit (在多个分支中存在的 23 个):

   a1b2c3d - feat: 添加支付功能
   → 存在于: main, develop

   d4e5f6g - fix: 修复登录问题
   → 存在于: main, develop

🏆 各分支得分:
分支             总得分    平均得分   等级    Commit数
──────────────────────────────────────────────────
main             10250.50    76.50      A         134
develop          11023.75    76.02      A         145
feature/payment   3456.80    76.82      A          45

✅ 分支对比报告已生成:
   - branch-report-2024-main-develop-feature-payment.json
   - branch-report-2024-main-develop-feature-payment.md
   - branch-report-2024-main-develop-feature-payment.html
```

#### 应用场景

- 📈 **Release 分析**: 对比不同发布版本的个人代码贡献
- 🔄 **Feature 追踪**: 分析个人在功能分支的开发进度
- 🎯 **工作量估算**: 避免重复计算合并的 commit
- 🌍 **环境部署**: 区分开发、测试、生产环境的代码

---

### 多人多分支对比

对比多个开发者在指定分支集合上的综合表现。

#### 语法

```bash
node bin/branch-multi-compare.js <年份> <分支1> [<分支2>] ... -- "<开发者1>" "<开发者2>" ...
```

#### 参数说明

- **年份**: 对比的年份
- **分支**: 至少 1 个分支名
- **--**: 分隔符（必须）
- **开发者**: 至少 2 个开发者的 Git 用户名

#### 示例

```bash
# 对比两个开发者在 main 分支的表现
node bin/branch-multi-compare.js 2024 main -- "张三" "李四"

# 对比三个开发者在多个分支的表现
node bin/branch-multi-compare.js 2024 main develop -- "张三" "李四" "王五"

# 对比多个开发者在功能分支的贡献
node bin/branch-multi-compare.js 2024 main feature/payment feature/notification -- "张三" "李四"

# 使用全局命令
eng-branch-multi 2024 main develop -- "张三" "李四" "王五"
```

#### 输出文件

- `branch-multi-comparison-<年份>-<分支名们>.json` - 完整对比数据
- `branch-multi-comparison-<年份>-<分支名们>.md` - Markdown 对比报告
- `branch-multi-comparison-<年份>-<分支名们>.html` - HTML 可视化报告

#### 核心功能

- 🆚 **综合排名**: 对比多个开发者在相同分支集合上的整体表现
- 📈 **分支维度**: 在每个分支上单独对比各开发者的贡献
- 💎 **质量对比**: 对比代码质量、复杂度和工程价值
- 🎯 **亮点识别**: 自动识别各维度的最佳表现者
- 📊 **可视化报告**: 生成 HTML/Markdown 多格式对比报告

#### 应用场景

- 🏆 **团队评估**: 对比团队成员在主要分支上的综合表现
- 📊 **版本对比**: 评估不同开发者在各版本分支的贡献
- 🆚 **分支维度**: 在每个分支上单独对比各开发者质量
- 🎯 **绩效考核**: 准确统计多分支工作量，用于绩效评估

---

### 团队自动化打分

基于多维度分析，自动计算团队成员的综合得分和等级排名。

#### 语法

```bash
node bin/score-team.js <JSON报告文件路径>
```

#### 参数说明

- **JSON报告文件路径**: 由 `compare.js` 或 `branch-multi-compare.js` 生成的 JSON 报告文件路径

#### 示例

```bash
# 1. 首先生成多人对比报告
node bin/compare.js 2024 "张三" "李四" "王五"

# 2. 对生成的 JSON 报告进行自动打分
node bin/score-team.js ./comparison-report-2024.json

# 或使用多分支对比
node bin/branch-multi-compare.js 2024 main develop -- "张三" "李四" "王五"
node bin/score-team.js ./branch-multi-comparison-2024-main-develop.json

# 使用全局命令
eng-score ./comparison-report-2024.json
```

#### 评分维度（可自定义权重）

默认权重配置：
- 🎯 **工程价值** (25%): 平均分数、总分数 - 整体工程贡献
- 💎 **代码质量** (25%): 质量评分、复杂度控制 - 代码健壮性
- 💼 **工作量** (20%): 提交数、代码行数 - 工作产出
- 🚀 **技术影响力** (15%): 影响分数、文件数 - 技术广度
- 🧠 **代码复杂度** (10%): 平均/最大复杂度 - 处理难题能力
- 🏗️ **AST指标** (5%): 函数/类/接口/Hooks - 架构能力

#### 等级标准

- **S级** (90-100分): 🏆 卓越表现 - 性能系数 **1.5x**
- **A级** (80-89分): 🥇 优秀表现 - 性能系数 **1.2x**
- **B级** (70-79分): 🥈 良好表现 - 性能系数 **1.0x**
- **C级** (60-69分): 🥉 合格表现 - 性能系数 **0.8x**
- **D级** (<60分): 📊 需改进 - 性能系数 **0.6x**

#### 输出文件

自动生成三种格式的评分报告：
- `*-scoring.json` - 完整的评分数据和详细维度
- `*-scoring.md` - Markdown 格式评分报告
- `*-scoring.html` - 可视化评分报告（**强烈推荐**）
- `individual-<员工名>.md` - 个人 Markdown 报告
- `individual-<员工名>.html` - 个人 HTML 报告（可直接发送给员工）

#### 自定义权重

编辑 `score-team.js` 文件，修改 `WEIGHTS` 配置：

```javascript
const WEIGHTS = {
  engineeringValue: 0.25,   // 工程价值 25%
  codeQuality: 0.25,        // 代码质量 25%
  workload: 0.20,           // 工作量 20%
  technicalImpact: 0.15,    // 技术影响力 15%
  codeComplexity: 0.10,     // 代码复杂度 10%
  astMetrics: 0.05          // AST指标 5%
};
```

根据团队特点调整权重，例如：
- **重质量的团队**: 提高 `codeQuality` 和 `codeComplexity` 权重
- **重产出的团队**: 提高 `workload` 和 `engineeringValue` 权重
- **重架构的团队**: 提高 `astMetrics` 和 `technicalImpact` 权重

---

## 报告说明

### JSON 报告

包含完整的原始数据，适合程序化处理和二次分析。

**主要字段**：
```json
{
  "year": 2024,
  "author": "张三",
  "totalCommits": 156,
  "totalScore": 12458.32,
  "averageScore": 79.86,
  "scoreLevel": "A",
  "totalAdd": 15234,
  "totalDel": 8765,
  "totalFiles": 432,
  "statistics": {
    "totalFunctions": 287,
    "totalClasses": 45,
    "totalInterfaces": 123,
    "totalHooks": 34
  },
  "topCommits": [...],
  "commits": [...]
}
```

### Markdown 报告

包含：
- 总体统计数据
- 代码质量指标
- 可维护性和可扩展性对比
- Top 10 高价值提交
- 详细提交记录

### HTML 报告

精美的可视化报告，包含：
- 响应式设计，适配各种屏幕
- 统计卡片展示
- 高价值提交列表
- 对比图表和排名
- 完整的样式和交互

**推荐使用浏览器打开 HTML 报告以获得最佳体验。**

---

## 实战案例

### 案例 1: 个人年度总结

**场景**: 你需要写年终总结，展示自己的工作成果。

```bash
# 生成 2024 年的报告
eng-value 2024 "你的名字"

# 打开 HTML 报告
open engineering-report-2024.html

# 查看年度总结文档
cat annual-report-2024.md
```

**报告包含**：
- ✅ 全年提交数和得分
- ✅ 代码质量指标
- ✅ 高价值贡献亮点
- ✅ 月度工作分布
- ✅ 技术栈和能力展示

### 案例 2: 团队绩效评估

**场景**: 你是团队 Leader，需要评估团队成员的表现。

```bash
# 1. 生成多人对比报告
eng-compare 2024 "成员A" "成员B" "成员C" "成员D"

# 2. 查看对比报告
open comparison-report-2024.html

# 3. 自动化打分
eng-score ./comparison-report-2024.json

# 4. 查看评分报告
open comparison-report-2024-scoring.html

# 5. 发送个人报告给员工
# individual-成员A.html
# individual-成员B.html
# ...
```

**你将得到**：
- 📊 团队成员综合排名
- 📈 各维度详细对比
- 🎯 优势和改进建议
- 💯 科学的评分结果
- 📄 个人评估报告

### 案例 3: 发版分支分析

**场景**: 你需要统计某个版本（如 v2.0）的开发贡献。

```bash
# 查看所有分支
git branch -a

# 分析发版分支的贡献（避免重复统计）
eng-branch 2024 "你的名字" release/v2.0 develop main

# 查看报告
open branch-report-2024-release-v2.0-develop-main.html
```

**报告显示**：
- ✅ 每个分支的独有 commit
- ✅ 共享 commit（避免重复统计）
- ✅ 每个分支的得分
- ✅ 总工作量（已去重）

### 案例 4: 多人多分支绩效对比

**场景**: 对比团队成员在主要开发分支上的表现。

```bash
# 对比团队成员在 main 和 develop 分支的表现
eng-branch-multi 2024 main develop -- "成员A" "成员B" "成员C"

# 查看对比报告
open branch-multi-comparison-2024-main-develop.html

# 自动化打分
eng-score ./branch-multi-comparison-2024-main-develop.json
```

**你将得到**：
- 🆚 多人在相同分支集合上的对比
- 📊 每个分支上的单独排名
- 💎 代码质量和工程价值对比
- 🎯 综合评分和等级

### 案例 5: 月度团队报告

**场景**: 每月生成团队报告，追踪进度。

创建脚本 `monthly-report.sh`：

```bash
#!/bin/bash

YEAR=$(date +%Y)
MONTH=$(date +%m)
TEAM=("张三" "李四" "王五")

# 生成对比报告
eng-compare $YEAR "${TEAM[@]}"

# 自动化打分
eng-score ./comparison-report-$YEAR.json

# 移动到归档目录
mkdir -p reports/$YEAR/$MONTH
mv comparison-report-* reports/$YEAR/$MONTH/
mv individual-*.html reports/$YEAR/$MONTH/

echo "✅ $YEAR年$MONTH月团队报告已生成"
echo "📁 报告位置: reports/$YEAR/$MONTH/"
```

使用：

```bash
chmod +x monthly-report.sh
./monthly-report.sh
```

---

## 常见问题

### Q1: 提示 "当前目录不是 Git 仓库"

**A**: 请在 Git 仓库的根目录下运行命令。

```bash
# 检查是否在 Git 仓库中
git status

# 如果不是，进入你的 Git 仓库
cd /path/to/your/git/repo
```

### Q2: 找不到 commit

**A**: 检查 Git 用户名是否正确，可以通过以下命令验证：

```bash
# 查看仓库中的所有作者
git log --format='%an' | sort -u

# 搜索特定作者的 commit
git log --author="你的名字"
```

### Q3: AST 分析失败

**A**: 部分文件可能存在语法错误或使用了不支持的特性，工具会自动跳过这些文件。这不影响整体分析结果。

### Q4: 报告生成慢

**A**: 这是正常的。分析大量 commit 需要时间，特别是包含 AST 分析和复杂度计算时。请耐心等待。

**加速技巧**：
- 只分析必要的分支
- 缩小时间范围（按月分析）
- 排除非代码文件较多的分支

### Q5: Git 用户名不匹配

**A**: Git 用户名必须与 commit 作者名完全匹配（区分大小写）。

```bash
# 查看你的 Git 配置
git config user.name

# 查看某个 commit 的作者
git show <commit-hash> --format="%an"
```

### Q6: 如何分析特定月份？

**A**: 目前工具支持按年份分析。如果需要按月份，可以暂时修改 `core/git.js` 中的日期过滤逻辑。

### Q7: 多分支对比时如何避免重复统计？

**A**: 工具会自动识别和去重共享的 commit（通过 commit hash）。同一个 commit 在多个分支中只会被统计一次。

### Q8: 如何导出报告？

**A**: 所有报告都会自动保存在当前目录。你可以：

```bash
# 将报告移动到指定目录
mv *.html *.md *.json /path/to/reports/

# 压缩报告
zip -r reports.zip *.html *.md *.json

# 通过邮件发送（macOS）
open -a Mail engineering-report-2024.html
```

---

## 进阶使用

### 自定义评分权重

编辑 `core/score.js`，调整评分算法：

```javascript
// 调整各项指标的权重
const abstractionBonus = 
  astStats.functions * 2 +      // 函数权重
  astStats.classes * 4 +         // 类权重
  astStats.interfaces * 3 +      // 接口权重
  astStats.hooks * 2;            // Hooks 权重

score += impactScore * 2;        // 影响范围权重
score += Math.log(addedLines + 1) * 1.5;  // 代码量权重
score -= churnScore * 0.5;       // churn 惩罚权重
```

### CI/CD 集成

#### GitHub Actions

创建 `.github/workflows/monthly-report.yml`:

```yaml
name: Monthly Team Report

on:
  schedule:
    - cron: '0 0 1 * *'  # 每月1号运行
  workflow_dispatch:

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: |
          git clone <engineering-value-cli-repo>
          cd engineering-metrics
          npm install
      
      - name: Generate report
        run: |
          cd engineering-metrics
          node bin/compare.js 2024 "Member1" "Member2" "Member3"
          node bin/score-team.js ./comparison-report-2024.json
      
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: team-reports
          path: |
            *.html
            *.md
            *.json
```

#### GitLab CI

创建 `.gitlab-ci.yml`:

```yaml
monthly-report:
  stage: report
  only:
    - schedules
  script:
    - git clone <engineering-value-cli-repo>
    - cd engineering-metrics
    - npm install
    - node bin/compare.js 2024 "Member1" "Member2" "Member3"
    - node bin/score-team.js ./comparison-report-2024.json
  artifacts:
    paths:
      - "*.html"
      - "*.md"
      - "*.json"
    expire_in: 1 month
```

### 批量分析脚本

创建 `batch-analysis.sh` 批量分析多个仓库：

```bash
#!/bin/bash

# 配置
YEAR=2024
AUTHOR="你的名字"
REPOS=(
  "/path/to/repo1"
  "/path/to/repo2"
  "/path/to/repo3"
)

# 创建报告目录
mkdir -p batch-reports/$YEAR

# 遍历仓库
for repo in "${REPOS[@]}"; do
  echo "分析仓库: $repo"
  
  cd "$repo"
  repo_name=$(basename "$repo")
  
  # 生成报告
  eng-value $YEAR "$AUTHOR"
  
  # 移动报告
  mv engineering-report-*.* "../batch-reports/$YEAR/${repo_name}_"
  
  cd -
done

echo "✅ 批量分析完成！"
echo "📁 报告位置: batch-reports/$YEAR/"
```

### 数据提取和分析

使用 `jq` 处理 JSON 报告：

```bash
# 提取平均得分
jq '.averageScore' comparison-report-2024.json

# 提取所有开发者的名字和得分
jq '.results[] | {author: .author, score: .averageScore}' comparison-report-2024.json

# 筛选 A 级开发者
jq '.results[] | select(.scoreLevel == "A") | .author' comparison-report-2024.json

# 计算团队总提交数
jq '[.results[].totalCommits] | add' comparison-report-2024.json

# 导出到 CSV
jq -r '.results[] | [.author, .totalCommits, .averageScore, .scoreLevel] | @csv' \
  comparison-report-2024.json > team-stats.csv
```

### 定制报告模板

修改 `core/report.js` 中的 HTML 模板，添加自定义样式或内容：

```javascript
// 添加公司 Logo
const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .company-logo {
      width: 200px;
      margin: 20px auto;
    }
  </style>
</head>
<body>
  <img src="https://your-company.com/logo.png" class="company-logo"/>
  <!-- 其他内容 -->
</body>
</html>
`;
```

---

## 附录

### 评分维度详解

完整的评分维度说明请参考：
- [代码可维护性和可扩展性质量评分](MAINTAINABILITY_GUIDE.md)
- [绩效评分指南 - 领导使用手册](PERFORMANCE_SCORING_GUIDE.md)

### 更新日志

查看完整的版本更新记录：[CHANGELOG.md](CHANGELOG.md)

### 技术支持

- 📧 Email: support@example.com
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📚 文档: [README.md](README.md)

---

**最后更新**: 2026年2月27日  
**版本**: 2.0.0  
**维护者**: Engineering Value CLI Team
