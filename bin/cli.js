#!/usr/bin/env node

const { getCommits, getDiffStats, getCommitInfo } = require("./core/git");
const { analyzeBulk } = require("./core/ast");
const { calculateImpact } = require("./core/impact");
const { calculateChurn } = require("./core/churn");
const { calculateEngineeringScore, getScoreLevel } = require("./core/score");
const { analyzeBulkComplexity, calculateQualityScore } = require("./core/complexity");
const {
  saveJSON,
  saveMarkdown,
  saveHTML,
  saveAnnualReport
} = require("./core/report");

const fs = require("fs");

// 解析命令行参数
const year = process.argv[2];
const author = process.argv[3];

if (!year || !author) {
  console.log('用法: node cli.js <年份> "<Git 用户名>"');
  console.log('示例: node cli.js 2025 "张三"');
  process.exit(1);
}

console.log(`\n🔍 开始分析 ${year} 年 ${author} 的工程贡献...\n`);

let commits = [];
try {
  commits = getCommits(year, author);
} catch (error) {
  console.error(`❌ 错误: ${error.message}`);
  process.exit(1);
}

if (!commits.length) {
  console.log(`📭 未找到 ${year} 年 ${author} 的 commit`);
  process.exit(0);
}

console.log(`✅ 找到 ${commits.length} 个 commit，开始分析...\n`);

let totalScore = 0;
let detailed = [];
let totalAdd = 0;
let totalDel = 0;
let allTouchedFiles = new Set();

// 显示进度的辅助函数
function showProgress(current, total) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.min(50, Math.max(0, Math.floor(percentage / 2)));
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  process.stdout.write(`\r进度: [${bar}] ${percentage}% (${current}/${total})`);
}

for (let i = 0; i < commits.length; i++) {
  const commit = commits[i];
  
  showProgress(i + 1, commits.length);

  try {
    const diff = getDiffStats(commit);
    const commitInfo = getCommitInfo(commit);
    const impact = calculateImpact(diff);
    const churn = calculateChurn(diff.touchedFiles, year);

    // 统计所有修改的文件
    diff.touchedFiles.forEach(file => allTouchedFiles.add(file));

    // 批量分析 AST
    const astStats = analyzeBulk(diff.touchedFiles);

    // 批量分析代码复杂度
    const complexityData = analyzeBulkComplexity(diff.touchedFiles);
    const qualityScore = calculateQualityScore(complexityData);

    const score = calculateEngineeringScore({
      impactScore: impact.impactScore,
      churnScore: churn,
      addedLines: diff.add,
      deletedLines: diff.del,
      astStats: astStats,
      complexityData: complexityData,
      qualityScore: qualityScore
    });

    totalScore += score;
    totalAdd += diff.add;
    totalDel += diff.del;

    detailed.push({
      commit,
      message: commitInfo.message,
      date: commitInfo.date,
      score: Number(score.toFixed(2)),
      scoreLevel: getScoreLevel(score),
      files: diff.files,
      directories: impact.directoryCount,
      fileTypes: impact.fileTypes,
      add: diff.add,
      del: diff.del,
      churn: Number(churn.toFixed(2)),
      ast: {
        functions: astStats.functions,
        classes: astStats.classes,
        interfaces: astStats.interfaces,
        hooks: astStats.hooks,
        exports: astStats.exports,
        imports: astStats.imports
      },
      complexity: {
        cyclomaticComplexity: complexityData.totalCyclomaticComplexity,
        cognitiveComplexity: complexityData.totalCognitiveComplexity,
        maxNestingDepth: complexityData.maxNestingDepth,
        avgFunctionLength: complexityData.avgFunctionLength,
        commentRatio: complexityData.avgCommentRatio,
        qualityScore: qualityScore,
        distribution: complexityData.complexityDistribution
      },
      touchedFiles: diff.touchedFiles
    });
  } catch (error) {
    console.warn(`\n⚠️  处理 commit ${commit.slice(0, 7)} 时出错: ${error.message}`);
  }
}

console.log('\n');

const avg = totalScore / commits.length;

// 计算统计信息
const topCommits = [...detailed].sort((a, b) => b.score - a.score).slice(0, 10);
const totalFunctions = detailed.reduce((sum, c) => sum + c.ast.functions, 0);
const totalClasses = detailed.reduce((sum, c) => sum + c.ast.classes, 0);
const totalInterfaces = detailed.reduce((sum, c) => sum + c.ast.interfaces, 0);
const totalHooks = detailed.reduce((sum, c) => sum + c.ast.hooks, 0);

// 计算平均代码质量指标
const avgQualityScore = Math.round(
  detailed.reduce((sum, c) => sum + (c.complexity?.qualityScore || 0), 0) / commits.length
);
const avgCyclomaticComplexity = Math.round(
  detailed.reduce((sum, c) => sum + (c.complexity?.cyclomaticComplexity || 0), 0) / commits.length
);
const avgCognitiveComplexity = Math.round(
  detailed.reduce((sum, c) => sum + (c.complexity?.cognitiveComplexity || 0), 0) / commits.length
);
const avgCommentRatio = Math.round(
  detailed.reduce((sum, c) => sum + (c.complexity?.commentRatio || 0), 0) / commits.length
);

const reportData = {
  year,
  author,
  totalCommits: commits.length,
  totalScore: Number(totalScore.toFixed(2)),
  averageScore: Number(avg.toFixed(2)),
  scoreLevel: getScoreLevel(avg),
  totalAdd,
  totalDel,
  totalFiles: allTouchedFiles.size,
  statistics: {
    totalFunctions,
    totalClasses,
    totalInterfaces,
    totalHooks
  },
  quality: {
    avgQualityScore,
    avgCyclomaticComplexity,
    avgCognitiveComplexity,
    avgCommentRatio
  },
  topCommits,
  commits: detailed
};

console.log('📊 统计摘要:');
console.log(`   总提交数: ${commits.length}`);
console.log(`   总得分: ${reportData.totalScore}`);
console.log(`   平均得分: ${reportData.averageScore} (${reportData.scoreLevel} 级)`);
console.log(`   代码行数: +${totalAdd} -${totalDel}`);
console.log(`   修改文件: ${allTouchedFiles.size} 个`);
console.log(`   新增函数: ${totalFunctions} 个`);
console.log(`   新增类: ${totalClasses} 个`);
console.log(`   新增接口: ${totalInterfaces} 个`);
console.log(`\n💎 代码质量指标:`);
console.log(`   质量得分: ${avgQualityScore}/100`);
console.log(`   平均圈复杂度: ${avgCyclomaticComplexity}`);
console.log(`   平均认知复杂度: ${avgCognitiveComplexity}`);
console.log(`   平均注释率: ${avgCommentRatio}%\n`);

console.log('💾 生成报告...');

try {
  saveJSON(year, reportData);
  saveMarkdown(year, reportData);
  saveHTML(year, reportData);
  saveAnnualReport(year, reportData);
  
  console.log('\n✅ 报告生成完成！');
  console.log(`   - engineering-report-${year}.json`);
  console.log(`   - engineering-report-${year}.md`);
  console.log(`   - engineering-report-${year}.html`);
  console.log(`   - annual-report-${year}.md\n`);
} catch (error) {
  console.error(`\n❌ 生成报告时出错: ${error.message}`);
  process.exit(1);
}