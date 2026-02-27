#!/usr/bin/env node

const { 
  getCommits, 
  getDiffStats, 
  getCommitInfo,
  getAllBranches,
  analyzeBranches 
} = require("./core/git");
const { analyzeBulk } = require("./core/ast");
const { calculateImpact } = require("./core/impact");
const { calculateChurn } = require("./core/churn");
const { calculateEngineeringScore, getScoreLevel } = require("./core/score");
const { analyzeBulkComplexity, calculateQualityScore } = require("./core/complexity");
const { saveComparisonReport } = require("./core/report");

const fs = require("fs");

// 解析命令行参数
const year = process.argv[2];
const author = process.argv[3];
const branchArgs = process.argv.slice(4);

if (!year || !author) {
  console.log('用法: node branch-compare.js <年份> "<Git 用户名>" [<分支1>] [<分支2>] ...');
  console.log('\n示例:');
  console.log('  node branch-compare.js 2024 "张三" main develop feature/new');
  console.log('  node branch-compare.js 2024 "张三"  # 分析所有分支');
  console.log('\n说明:');
  console.log('  - 不指定分支时，会分析用户提示选择分支');
  console.log('  - 自动去重：同一个 commit 在多个分支中只统计一次');
  process.exit(1);
}

console.log(`\n🌳 开始分析 ${year} 年 ${author} 的分支贡献...\n`);

// 获取要分析的分支列表
let branches = branchArgs;

if (branches.length === 0) {
  console.log('📋 未指定分支，获取所有分支列表...\n');
  try {
    const allBranches = getAllBranches(false);
    console.log(`找到 ${allBranches.length} 个本地分支:`);
    allBranches.forEach((branch, idx) => {
      console.log(`   ${idx + 1}. ${branch}`);
    });
    
    console.log('\n💡 提示: 重新运行命令并指定要分析的分支');
    console.log(`   例如: node branch-compare.js ${year} "${author}" ${allBranches.slice(0, 3).join(' ')}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ 获取分支列表失败: ${error.message}`);
    process.exit(1);
  }
}

console.log(`📊 分析分支: ${branches.join(', ')}\n`);

// 分析多分支
let branchAnalysis;
try {
  branchAnalysis = analyzeBranches(branches, year, author);
} catch (error) {
  console.error(`❌ 错误: ${error.message}`);
  process.exit(1);
}

// 显示分支统计
console.log('═══════════════════════════════════════════════════════');
console.log('                  分支统计概览');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`总 commit 数（已去重）: ${branchAnalysis.totalUniqueCommits}`);
console.log(`共享 commit 数: ${branchAnalysis.sharedCommits.length}`);
console.log();

console.log('分支         总 Commit   独有 Commit   共享 Commit');
console.log('────────────────────────────────────────────────────');

branches.forEach(branch => {
  const stats = branchAnalysis.branchStats[branch];
  const unique = branchAnalysis.uniqueCommits[branch].length;
  const shared = stats.totalCommits - unique;
  const branchName = branch.padEnd(12);
  const total = String(stats.totalCommits).padStart(10);
  const uniqueStr = String(unique).padStart(13);
  const sharedStr = String(shared).padStart(13);
  
  console.log(`${branchName} ${total} ${uniqueStr} ${sharedStr}`);
});

console.log('\n═══════════════════════════════════════════════════════\n');

// 显示共享的 commit（在多个分支中都存在）
if (branchAnalysis.sharedCommits.length > 0) {
  console.log(`📌 共享 Commit (在多个分支中存在的 ${branchAnalysis.sharedCommits.length} 个):\n`);
  
  branchAnalysis.sharedCommits.slice(0, 10).forEach(({ commit, branches: inBranches }) => {
    const info = getCommitInfo(commit);
    console.log(`   ${commit.slice(0, 7)} - ${info.message}`);
    console.log(`   → 存在于: ${inBranches.join(', ')}`);
    console.log();
  });
  
  if (branchAnalysis.sharedCommits.length > 10) {
    console.log(`   ... 还有 ${branchAnalysis.sharedCommits.length - 10} 个共享 commit\n`);
  }
}

// 分析去重后的所有 commit
console.log('🔍 分析去重后的所有 commit...\n');

const uniqueCommits = [...Object.keys(branchAnalysis.commitToBranches)];
console.log(`共 ${uniqueCommits.length} 个唯一 commit\n`);

let totalScore = 0;
let detailed = [];
let totalAdd = 0;
let totalDel = 0;
let allTouchedFiles = new Set();

function showProgress(current, total) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.min(50, Math.max(0, Math.floor(percentage / 2)));
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  process.stdout.write(`\r进度: [${bar}] ${percentage}% (${current}/${total})`);
}

for (let i = 0; i < uniqueCommits.length; i++) {
  const commit = uniqueCommits[i];
  
  showProgress(i + 1, uniqueCommits.length);

  try {
    const diff = getDiffStats(commit);
    const commitInfo = getCommitInfo(commit);
    const impact = calculateImpact(diff);
    const churn = calculateChurn(diff.touchedFiles, year);

    diff.touchedFiles.forEach(file => allTouchedFiles.add(file));

    const astStats = analyzeBulk(diff.touchedFiles);
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
      branches: branchAnalysis.commitToBranches[commit],
      files: diff.files,
      add: diff.add,
      del: diff.del,
      complexity: {
        qualityScore: qualityScore
      }
    });
  } catch (error) {
    console.warn(`\n⚠️  处理 commit ${commit.slice(0, 7)} 时出错: ${error.message}`);
  }
}

console.log('\n');

const avg = uniqueCommits.length > 0 ? totalScore / uniqueCommits.length : 0;
const topCommits = [...detailed].sort((a, b) => b.score - a.score).slice(0, 10);

// 计算每个分支的得分（基于其包含的 commit）
const branchScores = {};
branches.forEach(branch => {
  const branchCommits = branchAnalysis.branchStats[branch].commits;
  const branchDetails = detailed.filter(d => branchCommits.includes(d.commit));
  const branchTotal = branchDetails.reduce((sum, d) => sum + d.score, 0);
  const branchAvg = branchDetails.length > 0 ? branchTotal / branchDetails.length : 0;
  
  branchScores[branch] = {
    totalScore: Number(branchTotal.toFixed(2)),
    averageScore: Number(branchAvg.toFixed(2)),
    scoreLevel: getScoreLevel(branchAvg)
  };
});

console.log('📊 总体统计:');
console.log(`   唯一 commit 数: ${uniqueCommits.length}`);
console.log(`   总得分: ${totalScore.toFixed(2)}`);
console.log(`   平均得分: ${avg.toFixed(2)} (${getScoreLevel(avg)} 级)`);
console.log(`   代码行数: +${totalAdd} -${totalDel}`);
console.log(`   修改文件: ${allTouchedFiles.size} 个\n`);

console.log('🏆 各分支得分:');
console.log('分支             总得分    平均得分   等级    Commit数');
console.log('──────────────────────────────────────────────────');

branches.forEach(branch => {
  const stats = branchAnalysis.branchStats[branch];
  const scores = branchScores[branch];
  const branchName = branch.padEnd(15);
  const total = String(scores.totalScore).padStart(8);
  const avg = String(scores.averageScore).padStart(10);
  const level = scores.scoreLevel.padStart(4);
  const commits = String(stats.totalCommits).padStart(8);
  
  console.log(`${branchName}  ${total}  ${avg}  ${level}    ${commits}`);
});

console.log('\n═══════════════════════════════════════════════════════\n');

// 计算统计数据
const totalFunctions = detailed.reduce((sum, d) => sum + (d.ast?.functions || 0), 0);
const totalClasses = detailed.reduce((sum, d) => sum + (d.ast?.classes || 0), 0);
const totalInterfaces = detailed.reduce((sum, d) => sum + (d.ast?.interfaces || 0), 0);
const totalHooks = detailed.reduce((sum, d) => sum + (d.ast?.hooks || 0), 0);

// 保存原始 JSON 报告
const reportData = {
  year,
  author,
  branches,
  branchAnalysis: {
    totalUniqueCommits: branchAnalysis.totalUniqueCommits,
    sharedCommitsCount: branchAnalysis.sharedCommits.length,
    branchStats: Object.fromEntries(
      branches.map(branch => [
        branch,
        {
          totalCommits: branchAnalysis.branchStats[branch].totalCommits,
          uniqueCommits: branchAnalysis.uniqueCommits[branch].length,
          score: branchScores[branch]
        }
      ])
    ),
    sharedCommits: branchAnalysis.sharedCommits
  },
  totalScore: Number(totalScore.toFixed(2)),
  averageScore: Number(avg.toFixed(2)),
  scoreLevel: getScoreLevel(avg),
  totalAdd,
  totalDel,
  totalFiles: allTouchedFiles.size,
  topCommits,
  commits: detailed
};

const reportFile = `branch-report-${year}-${branches.join('-')}.json`;
fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

console.log(`✅ 分支对比报告已生成: ${reportFile}`);

// 生成 MD 和 HTML 报告（使用对比报告格式）
try {
  // 构造符合 saveComparisonReport 期望的数据格式
  const comparisonData = {
    year,
    branches,
    authors: [author],  // 单人数组
    results: [{
      author,
      totalCommits: uniqueCommits.length,
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
      topCommits: topCommits.map(c => ({
        commit: c.commit,
        message: c.message,
        date: c.date,
        score: c.score,
        scoreLevel: c.scoreLevel,
        files: c.files,
        add: c.add,
        del: c.del,
        branches: c.branches
      })),
      branchAnalysis: reportData.branchAnalysis
    }],
    summary: {
      totalCommits: uniqueCommits.length,
      totalScore: Number(totalScore.toFixed(2)),
      avgScore: Number(avg.toFixed(2)),
      totalAdd,
      totalDel,
      totalLines: totalAdd + totalDel,
      topPerformer: author,
      mostCommits: author,
      mostProductive: author
    }
  };
  
  const prefix = `branch-report-${year}-${branches.join('-')}`;
  saveComparisonReport(year, comparisonData, prefix);
  console.log(`✅ 可视化报告已生成:`);
  console.log(`   - ${prefix}.md`);
  console.log(`   - ${prefix}.html\n`);
} catch (error) {
  console.warn(`⚠️  生成可视化报告失败: ${error.message}\n`);
}

