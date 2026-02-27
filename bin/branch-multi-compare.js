#!/usr/bin/env node

const { 
  getCommits, 
  getDiffStats, 
  getCommitInfo,
  getAllBranches,
  analyzeBranches 
} = require("../core/git");
const { analyzeBulk } = require("../core/ast");
const { calculateImpact } = require("../core/impact");
const { calculateChurn } = require("../core/churn");
const { calculateEngineeringScore, getScoreLevel } = require("../core/score");
const { analyzeBulkComplexity, calculateQualityScore } = require("../core/complexity");
const { comprehensiveQualityAnalysis } = require("../core/maintainability");
const { saveComparisonReport } = require("../core/report");

const fs = require("fs");

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('用法: node branch-multi-compare.js <年份> <分支1> [<分支2>] ... -- "<开发者1>" "<开发者2>" ...');
  console.log('\n示例:');
  console.log('  node branch-multi-compare.js 2024 main develop -- "张三" "李四" "王五"');
  console.log('  node branch-multi-compare.js 2024 main -- "张三" "李四"');
  console.log('\n说明:');
  console.log('  - 使用 -- 分隔分支列表和开发者列表');
  console.log('  - 自动去重：同一个 commit 在多个分支中只统计一次');
  console.log('  - 对比多个开发者在相同分支集合上的表现');
  process.exit(1);
}

// 查找分隔符 --
const separatorIndex = args.indexOf('--');
if (separatorIndex === -1) {
  console.error('❌ 错误: 缺少分隔符 --');
  console.log('请使用 -- 分隔分支和开发者，例如:');
  console.log('  node branch-multi-compare.js 2024 main develop -- "张三" "李四"');
  process.exit(1);
}

const year = args[0];
const branches = args.slice(1, separatorIndex);
const authors = args.slice(separatorIndex + 1);

if (branches.length === 0) {
  console.error('❌ 错误: 至少需要指定一个分支');
  process.exit(1);
}

if (authors.length < 2) {
  console.error('❌ 错误: 至少需要指定两个开发者进行对比');
  process.exit(1);
}

console.log(`\n🌳 开始分析 ${year} 年多人在多分支上的贡献对比...\n`);
console.log(`📊 分支: ${branches.join(', ')}`);
console.log(`👥 对比人员: ${authors.join(', ')}\n`);

// 分析每个开发者
async function analyzeAuthor(author, branches, year) {
  console.log(`\n📝 分析 ${author} 的贡献...`);
  
  // 🔧 修复：先使用 getCommits 一次性获取所有指定分支的commits
  // 这样可以获取到更全面的数据，避免遗漏跨分支的commits
  // git log branch1 branch2 会获取这些分支的所有可达commits
  let allCommits = [];
  try {
    allCommits = getCommits(year, author, branches);
  } catch (error) {
    console.error(`   ❌ 获取commits失败: ${error.message}`);
    return null;
  }
  
  // 然后分析每个commit在哪些分支上（用于分支维度的统计）
  let branchAnalysis;
  try {
    branchAnalysis = analyzeBranches(branches, year, author);
  } catch (error) {
    console.error(`   ❌ 错误: ${error.message}`);
    return null;
  }

  // 使用从getCommits获取的完整commit列表
  const uniqueCommits = allCommits.length > 0 ? allCommits : [...Object.keys(branchAnalysis.commitToBranches)];
  
  console.log(`   📊 通过分支查询获取: ${Object.keys(branchAnalysis.commitToBranches).length} 个commits`);
  console.log(`   📊 通过完整查询获取: ${allCommits.length} 个commits`);
  
  if (uniqueCommits.length === 0) {
    console.log(`   ⚠️  未找到 ${author} 在指定分支的 commit`);
    return {
      author,
      totalCommits: 0,
      totalScore: 0,
      averageScore: 0,
      scoreLevel: 'N/A',
      totalAdd: 0,
      totalDel: 0,
      totalFiles: 0,
      branchAnalysis,
      commits: [],
      complexity: {
        avgCyclomatic: 0,
        avgCognitive: 0,
        qualityScore: 0
      }
    };
  }

  console.log(`   ✅ 找到 ${uniqueCommits.length} 个唯一 commit（已去重）`);

  let totalScore = 0;
  let detailed = [];
  let totalAdd = 0;
  let totalDel = 0;
  let allTouchedFiles = new Set();
  let totalCyclomatic = 0;
  let totalCognitive = 0;
  let totalQuality = 0;
  let complexityCount = 0;
  
  // 统计代码结构
  let totalFunctions = 0;
  let totalClasses = 0;
  let totalInterfaces = 0;
  let totalHooks = 0;

  function showProgress(current, total) {
    const percentage = Math.min(100, Math.round((current / total) * 100));
    const filled = Math.min(10, Math.max(0, Math.floor(percentage / 10)));
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r   进度: [${bar}] ${percentage}% (${current}/${total})`);
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

      // 累计复杂度数据（总是累计，即使没有函数）
      totalCyclomatic += complexityData.avgCyclomaticComplexity || 0;
      totalCognitive += complexityData.avgCognitiveComplexity || 0;
      totalQuality += qualityScore;
      complexityCount++;
      
      // 累计 AST 统计数据
      totalFunctions += astStats.functions || 0;
      totalClasses += astStats.classes || 0;
      totalInterfaces += astStats.interfaces || 0;
      totalHooks += astStats.hooks || 0;

      detailed.push({
        commit,
        message: commitInfo.message,
        date: commitInfo.date,
        score: Number(score.toFixed(2)),
        scoreLevel: getScoreLevel(score),
        branches: branchAnalysis.commitToBranches[commit] || ['其他分支'], // 如果不在指定分支中，标记为其他分支
        files: diff.files,
        add: diff.add,
        del: diff.del,
        complexity: {
          qualityScore: qualityScore
        }
      });
    } catch (error) {
      // 静默处理单个 commit 错误
    }
  }

  console.log(''); // 换行

  const avg = uniqueCommits.length > 0 ? totalScore / uniqueCommits.length : 0;
  const topCommits = [...detailed].sort((a, b) => b.score - a.score).slice(0, 5);

  // 计算每个分支的得分
  const branchScores = {};
  branches.forEach(branch => {
    const branchCommits = branchAnalysis.branchStats[branch].commits;
    const branchDetails = detailed.filter(d => branchCommits.includes(d.commit));
    const branchTotal = branchDetails.reduce((sum, d) => sum + d.score, 0);
    const branchAvg = branchDetails.length > 0 ? branchTotal / branchDetails.length : 0;
    
    branchScores[branch] = {
      totalScore: Number(branchTotal.toFixed(2)),
      averageScore: Number(branchAvg.toFixed(2)),
      scoreLevel: getScoreLevel(branchAvg),
      commits: branchDetails.length
    };
  });

  // 🆕 可维护性和可扩展性分析
  console.log(`   📊 分析代码可维护性和可扩展性...`);
  const qualityAnalysis = comprehensiveQualityAnalysis([...allTouchedFiles]);

  return {
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
    quality: {
      avgQualityScore: complexityCount > 0 ? Number((totalQuality / complexityCount).toFixed(2)) : 0,
      avgCyclomaticComplexity: complexityCount > 0 ? Number((totalCyclomatic / complexityCount).toFixed(2)) : 0,
      avgCognitiveComplexity: complexityCount > 0 ? Number((totalCognitive / complexityCount).toFixed(2)) : 0,
      // 新增可维护性和可扩展性数据
      maintainability: qualityAnalysis.maintainability,
      extensibility: qualityAnalysis.extensibility,
      overall: qualityAnalysis.overall
    },
    branchAnalysis: {
      totalUniqueCommits: branchAnalysis.totalUniqueCommits,
      sharedCommitsCount: branchAnalysis.sharedCommits.length,
      branchScores
    },
    commits: detailed,
    topCommits,
    complexity: {
      avgCyclomatic: complexityCount > 0 ? Number((totalCyclomatic / complexityCount).toFixed(2)) : 0,
      avgCognitive: complexityCount > 0 ? Number((totalCognitive / complexityCount).toFixed(2)) : 0,
      qualityScore: complexityCount > 0 ? Number((totalQuality / complexityCount).toFixed(2)) : 0
    }
  };
}

// 分析所有开发者
(async function() {
  const results = [];
  
  for (const author of authors) {
    const result = await analyzeAuthor(author, branches, year);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log('\n❌ 没有找到任何开发者的 commit\n');
    process.exit(1);
  }

  // 按平均得分排序
  results.sort((a, b) => b.averageScore - a.averageScore);

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('                    多人多分支对比统计');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`📊 分析分支: ${branches.join(', ')}`);
  console.log(`👥 对比人员: ${authors.length} 人\n`);

  // 综合排名
  console.log('🏆 综合排名（按平均得分）:\n');
  console.log('排名  开发者           Commit数   总得分    平均得分   等级    代码行数');
  console.log('──────────────────────────────────────────────────────────────────');

  const medals = ['🥇', '🥈', '🥉'];
  results.forEach((result, index) => {
    const medal = index < 3 ? medals[index] : '  ';
    const rank = String(index + 1).padStart(2);
    const author = result.author.padEnd(15);
    const commits = String(result.totalCommits).padStart(8);
    const totalScore = String(result.totalScore).padStart(10);
    const avgScore = String(result.averageScore).padStart(10);
    const level = result.scoreLevel.padStart(4);
    const codeLines = `+${result.totalAdd}/-${result.totalDel}`;

    console.log(`${medal} ${rank}  ${author}  ${commits}  ${totalScore}  ${avgScore}  ${level}    ${codeLines}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // 各分支得分对比
  console.log('📊 各分支得分对比:\n');
  
  branches.forEach(branch => {
    console.log(`\n分支: ${branch}`);
    console.log('────────────────────────────────────────────────────────');
    console.log('开发者           Commit数   总得分    平均得分   等级');
    console.log('────────────────────────────────────────────────────────');
    
    const branchResults = results
      .map(r => ({
        author: r.author,
        ...r.branchAnalysis.branchScores[branch]
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
    
    branchResults.forEach(br => {
      const author = br.author.padEnd(15);
      const commits = String(br.commits).padStart(8);
      const total = String(br.totalScore).padStart(9);
      const avg = String(br.averageScore).padStart(10);
      const level = br.scoreLevel.padStart(4);
      
      console.log(`${author}  ${commits}  ${total}  ${avg}  ${level}`);
    });
  });

  console.log('\n\n═══════════════════════════════════════════════════════════════\n');

  // 代码质量对比
  console.log('💎 代码质量对比:\n');
  console.log('开发者           质量得分   圈复杂度   认知复杂度   代码量');
  console.log('──────────────────────────────────────────────────────────────────');

  results.forEach(result => {
    const author = result.author.padEnd(15);
    const quality = String(result.complexity.qualityScore).padStart(8);
    const cyclo = String(result.complexity.avgCyclomatic).padStart(9);
    const cogni = String(result.complexity.avgCognitive).padStart(11);
    const codeLines = `+${result.totalAdd}/-${result.totalDel}`;

    console.log(`${author}  ${quality}  ${cyclo}  ${cogni}    ${codeLines}`);
  });

  console.log('\n\n🔧 可维护性对比:\n');
  console.log('开发者           可维护性   注释率   函数长度   嵌套深度   命名质量   等级');
  console.log('────────────────────────────────────────────────────────────────────');
  
  results.forEach(result => {
    const author = result.author.padEnd(15);
    const maintScore = String(result.quality?.maintainability?.score || 0).padStart(8);
    const commentRatio = String(result.quality?.maintainability?.avgCommentRatio || 0).padStart(5) + '%';
    const funcLen = String(result.quality?.maintainability?.avgFunctionLength || 0).padStart(7);
    const nesting = String(result.quality?.maintainability?.avgNestingDepth || 0).padStart(7);
    const naming = String(result.quality?.maintainability?.avgNamingQuality || 0).padStart(5) + '%';
    const level = (result.quality?.maintainability?.level || 'N/A').padEnd(6);
    
    console.log(`${author}  ${maintScore}     ${commentRatio}    ${funcLen}      ${nesting}      ${naming}    ${level}`);
  });

  console.log('\n\n🚀 可扩展性对比:\n');
  console.log('开发者           可扩展性   接口数   抽象类   模块化   抽象化   设计模式   等级');
  console.log('────────────────────────────────────────────────────────────────────────');
  
  results.forEach(result => {
    const author = result.author.padEnd(15);
    const extScore = String(result.quality?.extensibility?.score || 0).padStart(8);
    const interfaces = String(result.quality?.extensibility?.totalInterfaces || 0).padStart(5);
    const abstracts = String(result.quality?.extensibility?.totalAbstractClasses || 0).padStart(5);
    const modularity = String(result.quality?.extensibility?.avgModularity || 0).padStart(5);
    const abstraction = String(result.quality?.extensibility?.avgAbstractionRatio || 0).padStart(5) + '%';
    const patterns = String(result.quality?.extensibility?.totalPatterns || 0).padStart(7);
    const level = (result.quality?.extensibility?.level || 'N/A').padEnd(6);
    
    console.log(`${author}  ${extScore}     ${interfaces}      ${abstracts}     ${modularity}     ${abstraction}      ${patterns}      ${level}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // 详细统计
  console.log('📈 详细统计:\n');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.author}`);
    console.log(`   总 Commit: ${result.totalCommits} (已去重)`);
    console.log(`   总得分: ${result.totalScore}`);
    console.log(`   平均得分: ${result.averageScore} (${result.scoreLevel} 级)`);
    console.log(`   代码量: +${result.totalAdd} -${result.totalDel}`);
    console.log(`   修改文件: ${result.totalFiles} 个`);
    console.log(`   质量得分: ${result.complexity.qualityScore}/100`);
    console.log(`   共享 Commit: ${result.branchAnalysis.sharedCommitsCount} 个\n`);
  });

  // 亮点分析
  console.log('🎯 亮点分析:\n');

  const maxCommits = Math.max(...results.map(r => r.totalCommits));
  const maxScore = Math.max(...results.map(r => r.totalScore));
  const maxAvgScore = Math.max(...results.map(r => r.averageScore));
  const maxQuality = Math.max(...results.map(r => r.complexity.qualityScore));
  const maxAdd = Math.max(...results.map(r => r.totalAdd));

  results.forEach(result => {
    if (result.totalCommits === maxCommits) {
      console.log(`   🏆 ${result.author}: 提交最多 (${result.totalCommits} 个)`);
    }
    if (result.totalScore === maxScore) {
      console.log(`   🏆 ${result.author}: 总得分最高 (${result.totalScore})`);
    }
    if (result.averageScore === maxAvgScore) {
      console.log(`   🏆 ${result.author}: 平均得分最高 (${result.averageScore})`);
    }
    if (result.complexity.qualityScore === maxQuality) {
      console.log(`   🏆 ${result.author}: 代码质量最好 (${result.complexity.qualityScore}/100)`);
    }
    if (result.totalAdd === maxAdd) {
      console.log(`   🏆 ${result.author}: 新增代码最多 (+${result.totalAdd} 行)`);
    }
  });

  console.log('\n');

  // 保存报告
  const sortedByScore = [...results].sort((a, b) => b.averageScore - a.averageScore);
  const sortedByCommits = [...results].sort((a, b) => b.totalCommits - a.totalCommits);
  const sortedByCodeVolume = [...results].sort((a, b) => (b.totalAdd + b.totalDel) - (a.totalAdd + a.totalDel));
  
  const reportData = {
    year,
    branches,
    authors: authors,  // 传递完整的 authors 数组
    results,
    summary: {
      totalCommits: results.reduce((sum, r) => sum + r.totalCommits, 0),
      totalScore: results.reduce((sum, r) => sum + r.totalScore, 0),
      avgScore: results.reduce((sum, r) => sum + r.averageScore, 0) / results.length,
      totalAdd: results.reduce((sum, r) => sum + r.totalAdd, 0),
      totalDel: results.reduce((sum, r) => sum + r.totalDel, 0),
      totalLines: results.reduce((sum, r) => sum + r.totalAdd + r.totalDel, 0),
      topPerformer: sortedByScore[0]?.author || 'N/A',
      mostCommits: sortedByCommits[0]?.author || 'N/A',
      mostProductive: sortedByCodeVolume[0]?.author || 'N/A'
    }
  };

  const reportFile = `branch-multi-comparison-${year}-${branches.join('-')}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

  console.log(`✅ 多人多分支对比报告已生成: ${reportFile}`);

  // 生成 HTML/MD 报告
  try {
    const prefix = `branch-multi-comparison-${year}-${branches.join('-')}`;
    await saveComparisonReport(year, reportData, prefix);
    console.log(`✅ 可视化报告已生成:`);
    console.log(`   - ${prefix}.md`);
    console.log(`   - ${prefix}.html\n`);
  } catch (error) {
    console.warn(`⚠️  生成可视化报告失败: ${error.message}\n`);
  }
})();
