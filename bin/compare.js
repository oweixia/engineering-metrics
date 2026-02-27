#!/usr/bin/env node

const { getCommits, getDiffStats, getCommitInfo } = require("./core/git");
const { analyzeBulk } = require("./core/ast");
const { calculateImpact } = require("./core/impact");
const { calculateChurn } = require("./core/churn");
const { calculateEngineeringScore, getScoreLevel } = require("./core/score");
const { analyzeBulkComplexity, calculateQualityScore } = require("./core/complexity");
const { comprehensiveQualityAnalysis } = require("./core/maintainability");
const { saveComparisonReport } = require("./core/report");

// 解析命令行参数
const year = process.argv[2];
const authors = process.argv.slice(3);

if (!year || authors.length < 2) {
  console.log('用法: node compare.js <年份> "<开发者1>" "<开发者2>" [<开发者3>] ...');
  console.log('示例: node compare.js 2024 "张三" "李四" "王五"');
  console.log('\n至少需要指定 2 个开发者进行对比');
  process.exit(1);
}

console.log(`\n🔍 开始分析 ${year} 年多人贡献对比...\n`);
console.log(`📊 对比人员: ${authors.join(', ')}\n`);

/**
 * 分析单个作者的贡献
 */
async function analyzeAuthor(author) {
  console.log(`\n📝 分析 ${author} 的贡献...`);
  
  let commits = [];
  try {
    commits = getCommits(year, author);
  } catch (error) {
    console.error(`❌ 获取 ${author} 的 commit 失败: ${error.message}`);
    return null;
  }

  if (!commits.length) {
    console.log(`📭 未找到 ${author} 在 ${year} 年的 commit`);
    return {
      author,
      totalCommits: 0,
      totalScore: 0,
      averageScore: 0,
      scoreLevel: 'D',
      totalAdd: 0,
      totalDel: 0,
      totalFiles: 0,
      statistics: {
        totalFunctions: 0,
        totalClasses: 0,
        totalInterfaces: 0,
        totalHooks: 0
      },
      topCommits: [],
      commits: []
    };
  }

  console.log(`✅ 找到 ${commits.length} 个 commit`);

  let totalScore = 0;
  let detailed = [];
  let totalAdd = 0;
  let totalDel = 0;
  let allTouchedFiles = new Set();

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    
    if (i % 10 === 0) {
      process.stdout.write(`\r   进度: ${i + 1}/${commits.length}`);
    }

    try {
      const diff = getDiffStats(commit);
      const commitInfo = getCommitInfo(commit);
      const impact = calculateImpact(diff);
      const churn = calculateChurn(diff.touchedFiles, year);

      diff.touchedFiles.forEach(file => allTouchedFiles.add(file));

      const astStats = analyzeBulk(diff.touchedFiles);
      
      // 添加复杂度分析
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
        add: diff.add,
        del: diff.del,
        churn: Number(churn.toFixed(2)),
        ast: {
          functions: astStats.functions,
          classes: astStats.classes,
          interfaces: astStats.interfaces,
          hooks: astStats.hooks
        },
        complexity: {
          cyclomaticComplexity: complexityData.totalCyclomaticComplexity,
          cognitiveComplexity: complexityData.totalCognitiveComplexity,
          qualityScore: qualityScore
        }
      });
    } catch (error) {
      console.warn(`\n⚠️  处理 ${author} 的 commit ${commit.slice(0, 7)} 时出错: ${error.message}`);
    }
  }

  console.log(`\r   进度: ${commits.length}/${commits.length} ✓`);

  const avg = commits.length > 0 ? totalScore / commits.length : 0;
  const topCommits = [...detailed].sort((a, b) => b.score - a.score).slice(0, 5);
  
  const totalFunctions = detailed.reduce((sum, c) => sum + c.ast.functions, 0);
  const totalClasses = detailed.reduce((sum, c) => sum + c.ast.classes, 0);
  const totalInterfaces = detailed.reduce((sum, c) => sum + c.ast.interfaces, 0);
  const totalHooks = detailed.reduce((sum, c) => sum + c.ast.hooks, 0);
  
  // 计算平均代码质量
  const avgQualityScore = Math.round(
    detailed.reduce((sum, c) => sum + (c.complexity?.qualityScore || 0), 0) / commits.length
  );
  const avgCyclomaticComplexity = Math.round(
    detailed.reduce((sum, c) => sum + (c.complexity?.cyclomaticComplexity || 0), 0) / commits.length
  );
  const avgCognitiveComplexity = Math.round(
    detailed.reduce((sum, c) => sum + (c.complexity?.cognitiveComplexity || 0), 0) / commits.length
  );

  // 🆕 可维护性和可扩展性分析
  console.log(`   📊 分析代码可维护性和可扩展性...`);
  const qualityAnalysis = comprehensiveQualityAnalysis([...allTouchedFiles]);

  return {
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
      // 新增可维护性和可扩展性数据
      maintainability: qualityAnalysis.maintainability,
      extensibility: qualityAnalysis.extensibility,
      overall: qualityAnalysis.overall
    },
    topCommits,
    commits: detailed
  };
}

/**
 * 主函数
 */
async function main() {
  const results = [];

  // 分析每个作者
  for (const author of authors) {
    const result = await analyzeAuthor(author);
    if (result) {
      results.push(result);
    }
  }

  if (results.length < 2) {
    console.error('\n❌ 至少需要 2 个有效的开发者数据才能进行对比');
    process.exit(1);
  }

  // 生成对比报告
  console.log('\n\n📊 ═══════════════════════════════════════════════════════');
  console.log('                    对比统计摘要');
  console.log('═══════════════════════════════════════════════════════\n');

  // 按平均得分排序
  const sortedResults = [...results].sort((a, b) => b.averageScore - a.averageScore);

  console.log('排名  开发者           提交数    总得分    平均得分   等级    代码行数      质量得分');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  
  sortedResults.forEach((r, idx) => {
    const rank = idx + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    const name = r.author.padEnd(15);
    const commits = String(r.totalCommits).padStart(6);
    const total = String(r.totalScore).padStart(8);
    const avg = String(r.averageScore).padStart(8);
    const level = r.scoreLevel.padStart(4);
    const lines = `+${r.totalAdd}/-${r.totalDel}`.padEnd(15);
    const quality = String(r.quality?.avgQualityScore || 0).padStart(3);
    
    console.log(`${medal} ${rank}  ${name} ${commits}  ${total}  ${avg}  ${level}    ${lines}  ${quality}/100`);
  });

  console.log('\n💎 代码质量对比:');
  console.log('开发者           圈复杂度   认知复杂度   质量得分');
  console.log('────────────────────────────────────────────────');
  
  sortedResults.forEach((r) => {
    const name = r.author.padEnd(15);
    const cyclomatic = String(r.quality?.avgCyclomaticComplexity || 0).padStart(8);
    const cognitive = String(r.quality?.avgCognitiveComplexity || 0).padStart(10);
    const quality = String(r.quality?.avgQualityScore || 0).padStart(8);
    
    console.log(`${name}  ${cyclomatic}     ${cognitive}       ${quality}/100`);
  });

  console.log('\n🔧 可维护性对比:');
  console.log('开发者           可维护性   注释率   函数长度   嵌套深度   命名质量   等级');
  console.log('────────────────────────────────────────────────────────────────────');
  
  sortedResults.forEach((r) => {
    const name = r.author.padEnd(15);
    const maintScore = String(r.quality?.maintainability?.score || 0).padStart(8);
    const commentRatio = String(r.quality?.maintainability?.avgCommentRatio || 0).padStart(5) + '%';
    const funcLen = String(r.quality?.maintainability?.avgFunctionLength || 0).padStart(7);
    const nesting = String(r.quality?.maintainability?.avgNestingDepth || 0).padStart(7);
    const naming = String(r.quality?.maintainability?.avgNamingQuality || 0).padStart(5) + '%';
    const level = (r.quality?.maintainability?.level || 'N/A').padEnd(6);
    
    console.log(`${name}  ${maintScore}     ${commentRatio}    ${funcLen}      ${nesting}      ${naming}    ${level}`);
  });

  console.log('\n🚀 可扩展性对比:');
  console.log('开发者           可扩展性   接口数   抽象类   模块化   抽象化   设计模式   等级');
  console.log('────────────────────────────────────────────────────────────────────────');
  
  sortedResults.forEach((r) => {
    const name = r.author.padEnd(15);
    const extScore = String(r.quality?.extensibility?.score || 0).padStart(8);
    const interfaces = String(r.quality?.extensibility?.totalInterfaces || 0).padStart(5);
    const abstracts = String(r.quality?.extensibility?.totalAbstractClasses || 0).padStart(5);
    const modularity = String(r.quality?.extensibility?.avgModularity || 0).padStart(5);
    const abstraction = String(r.quality?.extensibility?.avgAbstractionRatio || 0).padStart(5) + '%';
    const patterns = String(r.quality?.extensibility?.totalPatterns || 0).padStart(7);
    const level = (r.quality?.extensibility?.level || 'N/A').padEnd(6);
    
    console.log(`${name}  ${extScore}     ${interfaces}      ${abstracts}     ${modularity}     ${abstraction}      ${patterns}      ${level}`);
  });

  console.log('\n═══════════════════════════════════════════════════════\n');

  // 生成详细报告文件
  const comparisonData = {
    year,
    authors: authors,
    comparisonDate: new Date().toISOString(),
    results: results,
    summary: {
      totalCommits: results.reduce((sum, r) => sum + r.totalCommits, 0),
      totalScore: results.reduce((sum, r) => sum + r.totalScore, 0),
      totalLines: results.reduce((sum, r) => sum + r.totalAdd + r.totalDel, 0),
      topPerformer: sortedResults[0].author,
      mostCommits: [...results].sort((a, b) => b.totalCommits - a.totalCommits)[0].author,
      mostProductive: [...results].sort((a, b) => (b.totalAdd + b.totalDel) - (a.totalAdd + a.totalDel))[0].author
    }
  };

  console.log('💾 生成对比报告...\n');

  try {
    saveComparisonReport(year, comparisonData);
    
    console.log('✅ 对比报告生成完成！');
    console.log(`   - comparison-report-${year}.json`);
    console.log(`   - comparison-report-${year}.md`);
    console.log(`   - comparison-report-${year}.html\n`);
  } catch (error) {
    console.error(`\n❌ 生成报告时出错: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n❌ 运行出错: ${error.message}`);
  process.exit(1);
});
