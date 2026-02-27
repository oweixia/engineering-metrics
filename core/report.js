const fs = require("fs");

/**
 * 保存 JSON 格式报告
 */
function saveJSON(year, data) {
  fs.writeFileSync(
    `engineering-report-${year}.json`,
    JSON.stringify(data, null, 2)
  );
}

/**
 * 保存 Markdown 格式报告
 */
function saveMarkdown(year, data) {
  const md = `# ${year} 年工程价值报告

## 📊 总体统计

| 指标 | 数值 |
|------|------|
| **作者** | ${data.author} |
| **总提交数** | ${data.totalCommits} |
| **总得分** | ${data.totalScore} |
| **平均得分** | ${data.averageScore} (${data.scoreLevel} 级) |
| **代码行数** | +${data.totalAdd} / -${data.totalDel} |
| **修改文件** | ${data.totalFiles} 个 |

## 🎯 代码质量指标

| 指标 | 数量 |
|------|------|
| **新增函数** | ${data.statistics.totalFunctions} |
| **新增类** | ${data.statistics.totalClasses} |
| **新增接口/类型** | ${data.statistics.totalInterfaces} |
| **React Hooks** | ${data.statistics.totalHooks} |

## 🏆 Top 10 高价值提交

${data.topCommits.map((c, idx) => `
### ${idx + 1}. ${c.message || 'No message'}

- **Commit**: \`${c.commit.slice(0, 7)}\`
- **日期**: ${c.date}
- **得分**: ${c.score} (${c.scoreLevel} 级)
- **修改文件**: ${c.files} 个
- **影响目录**: ${c.directories} 个
- **代码行**: +${c.add} / -${c.del}
- **代码质量**: 函数 ${c.ast.functions}, 类 ${c.ast.classes}, 接口 ${c.ast.interfaces}
`).join('\n---\n')}

## 📝 详细提交记录

共 ${data.commits.length} 个提交，详见 JSON 报告。

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;

  fs.writeFileSync(`engineering-report-${year}.md`, md);
}

/**
 * 保存 HTML 格式报告
 */
function saveHTML(year, data) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${year} 年工程价值报告 - ${data.author}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    header p {
      font-size: 1.2em;
      opacity: 0.9;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 8px;
    }
    .stat-value {
      color: #667eea;
      font-size: 2em;
      font-weight: bold;
    }
    .stat-level {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8em;
      margin-left: 8px;
    }
    .section {
      padding: 40px;
    }
    .section h2 {
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .commit-list {
      list-style: none;
    }
    .commit-item {
      background: #f8f9fa;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .commit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .commit-message {
      font-weight: bold;
      color: #333;
      flex: 1;
    }
    .commit-score {
      background: #667eea;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: bold;
    }
    .commit-meta {
      display: flex;
      gap: 20px;
      font-size: 0.9em;
      color: #666;
      flex-wrap: wrap;
    }
    .commit-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .badge {
      background: #e9ecef;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.85em;
    }
    footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
    .level-S { background: #ff6b6b; }
    .level-A { background: #f06595; }
    .level-B { background: #cc5de8; }
    .level-C { background: #845ef7; }
    .level-D { background: #5c7cfa; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 ${year} 年工程价值报告</h1>
      <p>${data.author}</p>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">总提交数</div>
        <div class="stat-value">${data.totalCommits}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总得分</div>
        <div class="stat-value">${data.totalScore}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均得分</div>
        <div class="stat-value">
          ${data.averageScore}
          <span class="stat-level level-${data.scoreLevel}">${data.scoreLevel}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">新增代码</div>
        <div class="stat-value" style="color: #51cf66;">+${data.totalAdd}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">删除代码</div>
        <div class="stat-value" style="color: #ff6b6b;">-${data.totalDel}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">修改文件</div>
        <div class="stat-value">${data.totalFiles}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">新增函数</div>
        <div class="stat-value">${data.statistics.totalFunctions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">新增类</div>
        <div class="stat-value">${data.statistics.totalClasses}</div>
      </div>
    </div>

    <div class="section">
      <h2>🏆 Top 10 高价值提交</h2>
      <ul class="commit-list">
        ${data.topCommits.map((c, idx) => `
          <li class="commit-item">
            <div class="commit-header">
              <div class="commit-message">
                ${idx + 1}. ${c.message || '无提交信息'}
              </div>
              <div class="commit-score level-${c.scoreLevel}">${c.score}</div>
            </div>
            <div class="commit-meta">
              <span>📅 ${c.date}</span>
              <span>🔖 <code>${c.commit.slice(0, 7)}</code></span>
              <span>📁 ${c.files} 文件</span>
              <span>📂 ${c.directories} 目录</span>
              <span>➕ ${c.add} 行</span>
              <span>➖ ${c.del} 行</span>
              ${c.ast.functions ? `<span class="badge">⚡ ${c.ast.functions} 函数</span>` : ''}
              ${c.ast.classes ? `<span class="badge">🏛️ ${c.ast.classes} 类</span>` : ''}
              ${c.ast.interfaces ? `<span class="badge">📋 ${c.ast.interfaces} 接口</span>` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    </div>

    <footer>
      报告生成时间: ${new Date().toLocaleString('zh-CN')} | 
      使用 <a href="https://github.com" target="_blank" style="color: #667eea;">Engineering Value CLI</a> 生成
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(`engineering-report-${year}.html`, html);
}

/**
 * 保存年度总结报告
 */
function saveAnnualReport(year, data) {
  const top = data.topCommits.slice(0, 5);

  // 计算月度统计
  const monthlyStats = {};
  data.commits.forEach(c => {
    if (c.date) {
      const month = c.date.substring(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { commits: 0, score: 0, add: 0, del: 0 };
      }
      monthlyStats[month].commits++;
      monthlyStats[month].score += c.score;
      monthlyStats[month].add += c.add;
      monthlyStats[month].del += c.del;
    }
  });

  const report = `# ${year} 年度工作总结报告

> 作者: ${data.author}  
> 生成时间: ${new Date().toLocaleString('zh-CN')}

---

## 📊 一、年度整体贡献

### 核心数据

在 **${year}** 年度，共完成 **${data.totalCommits}** 次代码提交，累计工程价值得分 **${data.totalScore}** 分，平均每次提交得分 **${data.averageScore}** 分（**${data.scoreLevel}** 级评价）。

### 代码贡献统计

- **新增代码**: ${data.totalAdd} 行
- **删除代码**: ${data.totalDel} 行
- **净增长**: ${data.totalAdd - data.totalDel} 行
- **修改文件**: ${data.totalFiles} 个

### 工程能力体现

- **新增函数**: ${data.statistics.totalFunctions} 个
- **新增类**: ${data.statistics.totalClasses} 个
- **新增接口/类型**: ${data.statistics.totalInterfaces} 个
- **React Hooks**: ${data.statistics.totalHooks} 个

---

## 🏆 二、高价值贡献亮点

以下是本年度价值最高的 5 次提交：

${top.map((c, idx) => `
### ${idx + 1}. ${c.message || '无提交信息'}

**基本信息**
- Commit: \`${c.commit.slice(0, 7)}\`
- 日期: ${c.date}
- 工程得分: **${c.score}** 分 (${c.scoreLevel} 级)

**贡献内容**
- 修改文件: ${c.files} 个
- 影响目录: ${c.directories} 个
- 代码变更: +${c.add} / -${c.del} 行

**代码质量**
- 新增函数: ${c.ast.functions} 个
- 新增类: ${c.ast.classes} 个
- 新增接口: ${c.ast.interfaces} 个
${c.ast.hooks > 0 ? `- React Hooks: ${c.ast.hooks} 个` : ''}
`).join('\n---\n')}

---

## 📈 三、月度工作分布

${Object.entries(monthlyStats)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([month, stats]) => `
### ${month}

- 提交次数: ${stats.commits}
- 累计得分: ${stats.score.toFixed(2)}
- 代码变更: +${stats.add} / -${stats.del}
`).join('\n')}

---

## 💡 四、工程亮点总结

### 技术贡献

1. **代码架构优化**: 通过重构和模块化设计，提升了代码的可维护性和扩展性
2. **新功能开发**: 在多个业务模块中完成核心功能实现
3. **代码质量提升**: 注重抽象设计，增加 ${data.statistics.totalFunctions} 个函数和 ${data.statistics.totalClasses} 个类
4. **技术栈应用**: 合理使用现代前端技术，包括 React Hooks 等

### 工程能力

- 持续推动模块抽象与代码复用，减少重复实现
- 对高频修改模块进行结构优化，降低代码流动性
- 优化配置与工程结构，降低系统复杂度
- 增强代码可维护性与扩展能力

---

## 🎯 五、绩效价值体现

### 对团队的贡献

1. **系统稳定性**: 通过 ${data.totalCommits} 次提交，持续参与核心模块建设与优化
2. **代码质量**: 平均每次提交得分 ${data.averageScore}，高于一般水平
3. **影响范围**: 修改 ${data.totalFiles} 个文件，覆盖多个业务目录与配置模块
4. **技术深度**: 新增 ${data.statistics.totalFunctions} 个函数，体现了良好的工程抽象能力

### 核心价值

- ✅ **工程化能力**: 持续推进工程化建设，提升开发效率
- ✅ **代码质量**: 注重代码抽象和设计，保持良好的代码边界
- ✅ **业务理解**: 深入参与业务开发，提供有价值的技术方案
- ✅ **持续改进**: 对系统进行持续优化，提升整体质量

---

## 📝 六、总结与展望

${year} 年度在工程贡献方面取得了显著成果，通过 ${data.totalCommits} 次高质量的代码提交，为团队和项目带来了持续的价值。在新增 ${data.totalAdd} 行代码的同时，也删除了 ${data.totalDel} 行冗余代码，体现了对代码质量的重视。

未来将继续保持高质量的工程实践，在以下方面持续发力：
- 深化技术架构优化
- 提升代码抽象能力
- 加强工程化建设
- 提高开发效率和质量

---

*本报告由 Engineering Value CLI 自动生成*
`;

  fs.writeFileSync(`annual-report-${year}.md`, report);
}

/**
 * 保存对比报告（JSON）
 */
function saveComparisonJSON(year, data, prefix = 'comparison-report') {
  fs.writeFileSync(
    `${prefix}-${year}.json`,
    JSON.stringify(data, null, 2)
  );
}

/**
 * 保存对比报告（Markdown）
 */
function saveComparisonMarkdown(year, data, prefix = 'comparison-report') {
  const sortedResults = [...data.results].sort((a, b) => b.averageScore - a.averageScore);
  
  const md = `# ${year} 年多人贡献对比报告

> 生成时间: ${new Date().toLocaleString('zh-CN')}  
> 对比人员: ${data.authors.join(', ')}

---

## 📊 总体排名

| 排名 | 开发者 | 提交数 | 总得分 | 平均得分 | 等级 | 新增代码 | 删除代码 | 修改文件 |
|------|--------|--------|--------|----------|------|----------|----------|----------|
${sortedResults.map((r, idx) => {
  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
  return `| ${medal} | **${r.author}** | ${r.totalCommits} | ${r.totalScore} | ${r.averageScore} | **${r.scoreLevel}** | +${r.totalAdd} | -${r.totalDel} | ${r.totalFiles} |`;
}).join('\n')}

## 🏆 亮点总结

- **🌟 综合得分最高**: ${data.summary.topPerformer}（平均得分 ${sortedResults[0].averageScore}）
- **💪 提交次数最多**: ${data.summary.mostCommits}
- **✍️ 代码量最大**: ${data.summary.mostProductive}

## 📈 详细分析

${sortedResults.map((r, idx) => `
### ${idx + 1}. ${r.author}

#### 基本统计
- **提交数**: ${r.totalCommits}
- **总得分**: ${r.totalScore}
- **平均得分**: ${r.averageScore} (${r.scoreLevel} 级)
- **代码行数**: +${r.totalAdd} / -${r.totalDel}
- **修改文件**: ${r.totalFiles} 个

#### 代码质量
- **新增函数**: ${r.statistics.totalFunctions} 个
- **新增类**: ${r.statistics.totalClasses} 个
- **新增接口**: ${r.statistics.totalInterfaces} 个
- **React Hooks**: ${r.statistics.totalHooks} 个

#### Top 5 高价值提交
${r.topCommits.slice(0, 5).map((c, i) => `
${i + 1}. **${c.message || '无提交信息'}** (${c.score} 分)
   - Commit: \`${c.commit.slice(0, 7)}\`
   - 日期: ${c.date}
   - 修改: ${c.files} 个文件，+${c.add}/-${c.del} 行
`).join('\n')}
`).join('\n---\n')}

## 📊 综合对比

### 提交数对比
${sortedResults.map(r => `- **${r.author}**: ${r.totalCommits} 次`).join('\n')}

### 代码量对比
${sortedResults.map(r => `- **${r.author}**: +${r.totalAdd} / -${r.totalDel} (净增 ${r.totalAdd - r.totalDel})`).join('\n')}

### 工程质量对比
${sortedResults.map(r => `- **${r.author}**: 函数 ${r.statistics.totalFunctions}, 类 ${r.statistics.totalClasses}, 接口 ${r.statistics.totalInterfaces}`).join('\n')}

---

*本报告由 Engineering Value CLI 自动生成*
`;

  fs.writeFileSync(`${prefix}-${year}.md`, md);
}

/**
 * 保存对比报告（HTML）
 */
function saveComparisonHTML(year, data, prefix = 'comparison-report') {
  const sortedResults = [...data.results].sort((a, b) => b.averageScore - a.averageScore);
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${year} 年多人贡献对比报告</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    header p {
      font-size: 1.2em;
      opacity: 0.9;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .summary-label {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 8px;
    }
    .summary-value {
      color: #f5576c;
      font-size: 1.8em;
      font-weight: bold;
    }
    .rankings {
      padding: 40px;
    }
    .rankings h2 {
      color: #333;
      margin-bottom: 30px;
      text-align: center;
      font-size: 2em;
    }
    .ranking-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    .ranking-table th {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    .ranking-table td {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }
    .ranking-table tr:hover {
      background: #f8f9fa;
    }
    .medal {
      font-size: 1.5em;
    }
    .level-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      color: white;
      font-weight: bold;
      font-size: 0.9em;
    }
    .level-S { background: #ff6b6b; }
    .level-A { background: #f06595; }
    .level-B { background: #cc5de8; }
    .level-C { background: #845ef7; }
    .level-D { background: #5c7cfa; }
    .author-section {
      padding: 40px;
      background: #f8f9fa;
      margin-bottom: 2px;
    }
    .author-section:nth-child(even) {
      background: white;
    }
    .author-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }
    .author-rank {
      font-size: 3em;
      font-weight: bold;
      color: #f5576c;
      opacity: 0.3;
    }
    .author-name {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #f5576c;
    }
    .author-section:nth-child(even) .stat-item {
      background: #f8f9fa;
    }
    .stat-item-label {
      color: #666;
      font-size: 0.85em;
      margin-bottom: 5px;
    }
    .stat-item-value {
      color: #333;
      font-size: 1.5em;
      font-weight: bold;
    }
    .top-commits {
      margin-top: 20px;
    }
    .top-commits h4 {
      color: #333;
      margin-bottom: 15px;
    }
    .commit-item {
      background: rgba(245, 87, 108, 0.05);
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 3px solid #f5576c;
    }
    .commit-message {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .commit-meta {
      font-size: 0.9em;
      color: #666;
    }
    .chart-placeholder {
      background: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏆 ${year} 年多人贡献对比报告</h1>
      <p>对比人员: ${data.authors.join(', ')}</p>
    </header>

    <div class="summary">
      <div class="summary-card">
        <div class="summary-label">总提交数</div>
        <div class="summary-value">${data.summary.totalCommits}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">总得分</div>
        <div class="summary-value">${data.summary.totalScore.toFixed(0)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">总代码量</div>
        <div class="summary-value">${(data.summary.totalLines / 1000).toFixed(1)}k</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">🌟 综合最佳</div>
        <div class="summary-value" style="font-size: 1.3em;">${data.summary.topPerformer}</div>
      </div>
    </div>

    <div class="rankings">
      <h2>📊 综合排名</h2>
      <table class="ranking-table">
        <thead>
          <tr>
            <th style="width: 60px;">排名</th>
            <th>开发者</th>
            <th>提交数</th>
            <th>总得分</th>
            <th>平均得分</th>
            <th>等级</th>
            <th>代码行数</th>
          </tr>
        </thead>
        <tbody>
          ${sortedResults.map((r, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
            return `
            <tr>
              <td><span class="medal">${medal || (idx + 1)}</span></td>
              <td><strong>${r.author}</strong></td>
              <td>${r.totalCommits}</td>
              <td>${r.totalScore}</td>
              <td><strong>${r.averageScore}</strong></td>
              <td><span class="level-badge level-${r.scoreLevel}">${r.scoreLevel}</span></td>
              <td>+${r.totalAdd} / -${r.totalDel}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${sortedResults.map((r, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
      return `
      <div class="author-section">
        <div class="author-header">
          <div class="author-rank">${medal || (idx + 1)}</div>
          <div>
            <div class="author-name">${r.author}</div>
            <span class="level-badge level-${r.scoreLevel}">${r.scoreLevel} 级</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-item-label">提交数</div>
            <div class="stat-item-value">${r.totalCommits}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">总得分</div>
            <div class="stat-item-value">${r.totalScore}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">平均得分</div>
            <div class="stat-item-value">${r.averageScore}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">新增代码</div>
            <div class="stat-item-value" style="color: #51cf66;">+${r.totalAdd}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">删除代码</div>
            <div class="stat-item-value" style="color: #ff6b6b;">-${r.totalDel}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">修改文件</div>
            <div class="stat-item-value">${r.totalFiles}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">新增函数</div>
            <div class="stat-item-value">${r.statistics.totalFunctions}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">新增类</div>
            <div class="stat-item-value">${r.statistics.totalClasses}</div>
          </div>
        </div>

        <div class="top-commits">
          <h4>🏆 Top 5 高价值提交</h4>
          ${r.topCommits.slice(0, 5).map((c, i) => `
            <div class="commit-item">
              <div class="commit-message">${i + 1}. ${c.message || '无提交信息'} (${c.score} 分)</div>
              <div class="commit-meta">
                📅 ${c.date} | 🔖 ${c.commit.slice(0, 7)} | 📁 ${c.files} 个文件 | ➕${c.add} ➖${c.del}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      `;
    }).join('')}

    <footer>
      报告生成时间: ${new Date().toLocaleString('zh-CN')} | 
      使用 <a href="https://github.com" target="_blank" style="color: #f5576c;">Engineering Value CLI</a> 生成
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(`comparison-report-${year}.html`, html);
}

/**
 * 保存完整的对比报告
 */
function saveComparisonReport(year, data, prefix = 'comparison-report') {
  saveComparisonJSON(year, data, prefix);
  saveComparisonMarkdown(year, data, prefix);
  saveComparisonHTML(year, data, prefix);
}

module.exports = {
  saveJSON,
  saveMarkdown,
  saveHTML,
  saveAnnualReport,
  saveComparisonReport
};