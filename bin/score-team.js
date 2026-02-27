#!/usr/bin/env node

/**
 * 团队成员自动化综合打分工具
 * 基于多维度深度分析计算综合得分
 * 
 * 使用方法：
 * node score-team.js <JSON报告文件路径>
 * 
 * 示例：
 * node score-team.js ./reports/branch-multi-comparison-2024-main-develop.json
 */

const fs = require('fs');
const path = require('path');

// 评分权重配置（可根据团队实际情况调整）
const WEIGHTS = {
  engineeringValue: 0.25,      // 工程价值 25%
  codeQuality: 0.25,            // 代码质量 25%
  workload: 0.20,               // 工作量 20%
  technicalImpact: 0.15,        // 技术影响力 15%
  codeComplexity: 0.10,         // 代码复杂度 10%
  astMetrics: 0.05              // AST指标 5%
};

// 等级标准
const GRADE_THRESHOLDS = {
  S: 90, // 卓越
  A: 80, // 优秀
  B: 70, // 良好
  C: 60, // 合格
  D: 0   // 需改进
};

// 性能系数
const PERFORMANCE_MULTIPLIERS = {
  S: 1.5,
  A: 1.2,
  B: 1.0,
  C: 0.8,
  D: 0.6
};

/**
 * 标准化数据访问 - 适配不同的数据结构
 */
function normalizeAuthorData(authorData) {
  // 创建标准化的数据结构
  return {
    author: authorData.author,
    // 统计数据 - 优先从 statistics 读取，如果不存在则从根级别读取
    statistics: {
      totalCommits: authorData.statistics?.totalCommits ?? authorData.totalCommits ?? 0,
      totalLinesAdded: authorData.statistics?.totalLinesAdded ?? authorData.totalAdd ?? 0,
      totalLinesDeleted: authorData.statistics?.totalLinesDeleted ?? authorData.totalDel ?? 0,
      totalFilesChanged: authorData.statistics?.totalFilesChanged ?? authorData.totalFiles ?? 0,
      averageScore: authorData.statistics?.averageScore ?? authorData.averageScore ?? 0,
      totalScore: authorData.statistics?.totalScore ?? authorData.totalScore ?? 0,
      averageImpact: authorData.statistics?.averageImpact ?? 0,
      totalFunctions: authorData.statistics?.totalFunctions ?? 0,
      totalClasses: authorData.statistics?.totalClasses ?? 0,
      totalInterfaces: authorData.statistics?.totalInterfaces ?? 0,
      totalHooks: authorData.statistics?.totalHooks ?? 0
    },
    // 质量数据
    quality: {
      score: authorData.quality?.score ?? 
             authorData.quality?.avgQualityScore ?? 
             authorData.complexity?.qualityScore ?? 0,
      averageComplexity: authorData.quality?.averageComplexity ?? 
                        authorData.quality?.avgCyclomaticComplexity ?? 
                        authorData.complexity?.avgCyclomatic ?? 0,
      maxComplexity: authorData.quality?.maxComplexity ?? 0
    }
  };
}

/**
 * 计算工程价值得分（0-100）
 */
function calculateEngineeringValueScore(authorData, allAuthors) {
  // 标准化数据
  const normalized = normalizeAuthorData(authorData);
  const avgScore = normalized.statistics.averageScore || 0;
  const totalScore = normalized.statistics.totalScore || 0;
  
  // 找出最高分作为参考
  const allNormalized = allAuthors.map(a => normalizeAuthorData(a));
  const maxAvgScore = Math.max(...allNormalized.map(a => a.statistics.averageScore || 0));
  const maxTotalScore = Math.max(...allNormalized.map(a => a.statistics.totalScore || 0));
  
  // 平均分占60%，总分占40%
  const avgScoreNormalized = maxAvgScore > 0 ? (avgScore / maxAvgScore) * 100 : 0;
  const totalScoreNormalized = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
  
  return avgScoreNormalized * 0.6 + totalScoreNormalized * 0.4;
}

/**
 * 计算代码质量得分（0-100）
 */
function calculateCodeQualityScore(authorData, allAuthors) {
  const normalized = normalizeAuthorData(authorData);
  const qualityScore = normalized.quality.score || 0;
  const complexityAvg = normalized.quality.averageComplexity || 0;
  
  // 找出最佳质量分数和最低复杂度
  const allNormalized = allAuthors.map(a => normalizeAuthorData(a));
  const maxQualityScore = Math.max(...allNormalized.map(a => a.quality.score || 0));
  const minComplexity = Math.min(...allNormalized.filter(a => (a.quality.averageComplexity || 0) > 0).map(a => a.quality.averageComplexity));
  
  // 质量分数占70%
  const qualityNormalized = maxQualityScore > 0 ? (qualityScore / maxQualityScore) * 100 : 0;
  
  // 复杂度越低越好，占30%
  let complexityScore = 0;
  if (minComplexity > 0 && complexityAvg > 0) {
    complexityScore = Math.max(0, 100 - ((complexityAvg / minComplexity - 1) * 100));
  }
  
  return qualityNormalized * 0.7 + complexityScore * 0.3;
}

/**
 * 计算工作量得分（0-100）
 */
function calculateWorkloadScore(authorData, allAuthors) {
  const normalized = normalizeAuthorData(authorData);
  const commits = normalized.statistics.totalCommits || 0;
  const linesAdded = normalized.statistics.totalLinesAdded || 0;
  const linesDeleted = normalized.statistics.totalLinesDeleted || 0;
  const totalLines = linesAdded + linesDeleted;
  
  // 找出最大值
  const allNormalized = allAuthors.map(a => normalizeAuthorData(a));
  const maxCommits = Math.max(...allNormalized.map(a => a.statistics.totalCommits || 0));
  const maxTotalLines = Math.max(...allNormalized.map(a => 
    (a.statistics.totalLinesAdded || 0) + (a.statistics.totalLinesDeleted || 0)
  ));
  
  // 提交数占40%，代码行数占60%
  const commitsNormalized = maxCommits > 0 ? (commits / maxCommits) * 100 : 0;
  const linesNormalized = maxTotalLines > 0 ? (totalLines / maxTotalLines) * 100 : 0;
  
  return commitsNormalized * 0.4 + linesNormalized * 0.6;
}

/**
 * 计算技术影响力得分（0-100）
 */
function calculateTechnicalImpactScore(authorData, allAuthors) {
  const normalized = normalizeAuthorData(authorData);
  const impactScore = normalized.statistics.averageImpact || 0;
  const filesChanged = normalized.statistics.totalFilesChanged || 0;
  
  // 找出最大值
  const allNormalized = allAuthors.map(a => normalizeAuthorData(a));
  const maxImpact = Math.max(...allNormalized.map(a => a.statistics.averageImpact || 0));
  const maxFiles = Math.max(...allNormalized.map(a => a.statistics.totalFilesChanged || 0));
  
  // 影响力分数占70%，文件数占30%
  const impactNormalized = maxImpact > 0 ? (impactScore / maxImpact) * 100 : 0;
  const filesNormalized = maxFiles > 0 ? (filesChanged / maxFiles) * 100 : 0;
  
  return impactNormalized * 0.7 + filesNormalized * 0.3;
}

/**
 * 计算代码复杂度得分（0-100）
 * 注意：复杂度是负向指标，越低越好
 */
function calculateComplexityScore(authorData, allAuthors) {
  const normalized = normalizeAuthorData(authorData);
  const avgComplexity = normalized.quality.averageComplexity || 0;
  const maxComplexity = normalized.quality.maxComplexity || 0;
  
  // 找出团队的复杂度范围
  const allNormalized = allAuthors.map(a => normalizeAuthorData(a));
  const allAvgComplexities = allNormalized.filter(a => (a.quality.averageComplexity || 0) > 0)
    .map(a => a.quality.averageComplexity);
  const allMaxComplexities = allNormalized.filter(a => (a.quality.maxComplexity || 0) > 0)
    .map(a => a.quality.maxComplexity);
  
  if (allAvgComplexities.length === 0) return 50; // 默认中等分数
  
  const teamMinAvg = Math.min(...allAvgComplexities);
  const teamMaxAvg = Math.max(...allAvgComplexities);
  const teamMinMax = Math.min(...allMaxComplexities);
  const teamMaxMax = Math.max(...allMaxComplexities);
  
  // 计算相对位置（越接近最小值越好）
  let avgScore = 50;
  if (teamMaxAvg > teamMinAvg) {
    avgScore = 100 - ((avgComplexity - teamMinAvg) / (teamMaxAvg - teamMinAvg)) * 60;
  }
  
  let maxScore = 50;
  if (teamMaxMax > teamMinMax) {
    maxScore = 100 - ((maxComplexity - teamMinMax) / (teamMaxMax - teamMinMax)) * 60;
  }
  
  // 平均复杂度占70%，最大复杂度占30%
  return Math.max(0, Math.min(100, avgScore * 0.7 + maxScore * 0.3));
}

/**
 * 计算AST指标得分（0-100）
 */
function calculateASTMetricsScore(authorData, allAuthors) {
  const normalized = normalizeAuthorData(authorData);
  const functions = normalized.statistics.totalFunctions || 0;
  const classes = normalized.statistics.totalClasses || 0;
  const interfaces = normalized.statistics.totalInterfaces || 0;
  const hooks = normalized.statistics.totalHooks || 0;
  
  const totalStructures = functions + classes + interfaces + hooks;
  
  // 找出最大值
  const allNormalized = allAuthors.map(a => normalizeAuthorData(a));
  const maxStructures = Math.max(...allNormalized.map(a => 
    (a.statistics.totalFunctions || 0) + 
    (a.statistics.totalClasses || 0) + 
    (a.statistics.totalInterfaces || 0) + 
    (a.statistics.totalHooks || 0)
  ));
  
  // 代码结构数量反映了代码的组织性和架构能力
  return maxStructures > 0 ? (totalStructures / maxStructures) * 100 : 0;
}

/**
 * 计算综合得分
 */
function calculateComprehensiveScore(authorData, allAuthors) {
  const scores = {
    engineeringValue: calculateEngineeringValueScore(authorData, allAuthors),
    codeQuality: calculateCodeQualityScore(authorData, allAuthors),
    workload: calculateWorkloadScore(authorData, allAuthors),
    technicalImpact: calculateTechnicalImpactScore(authorData, allAuthors),
    codeComplexity: calculateComplexityScore(authorData, allAuthors),
    astMetrics: calculateASTMetricsScore(authorData, allAuthors)
  };
  
  // 计算加权总分
  const totalScore = 
    scores.engineeringValue * WEIGHTS.engineeringValue +
    scores.codeQuality * WEIGHTS.codeQuality +
    scores.workload * WEIGHTS.workload +
    scores.technicalImpact * WEIGHTS.technicalImpact +
    scores.codeComplexity * WEIGHTS.codeComplexity +
    scores.astMetrics * WEIGHTS.astMetrics;
  
  return {
    totalScore: Math.round(totalScore * 10) / 10,
    detailedScores: scores
  };
}

/**
 * 确定等级
 */
function determineGrade(score) {
  if (score >= GRADE_THRESHOLDS.S) return 'S';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
}

/**
 * 生成评价
 */
function generateEvaluation(grade, scores, authorData) {
  const evaluations = {
    S: '卓越表现！各项指标均处于团队领先水平，是团队的技术标杆。',
    A: '优秀表现！整体表现突出，在多个维度上表现优异。',
    B: '良好表现！工作稳定可靠，达到了预期标准。',
    C: '合格表现！基本完成工作任务，但仍有较大提升空间。',
    D: '需要改进！多个维度表现欠佳，需要重点关注和提升。'
  };
  
  // 找出优势和劣势
  const scoreEntries = Object.entries(scores.detailedScores)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  
  const strengths = scoreEntries.slice(0, 2).map(s => s.key);
  const weaknesses = scoreEntries.slice(-2).map(s => s.key);
  
  const dimensionNames = {
    engineeringValue: '工程价值',
    codeQuality: '代码质量',
    workload: '工作量',
    technicalImpact: '技术影响力',
    codeComplexity: '代码复杂度控制',
    astMetrics: '代码架构能力'
  };
  
  let evaluation = evaluations[grade] + '\n\n';
  evaluation += `优势领域：${strengths.map(s => dimensionNames[s]).join('、')}\n`;
  evaluation += `改进方向：${weaknesses.map(s => dimensionNames[s]).join('、')}`;
  
  return evaluation;
}

/**
 * 生成详细的改进建议
 */
function generateImprovementSuggestions(result, allResults) {
  const scoreEntries = Object.entries(result.scores.detailedScores)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.value - b.value);
  
  const dimensionNames = {
    engineeringValue: '工程价值',
    codeQuality: '代码质量',
    workload: '工作量',
    technicalImpact: '技术影响力',
    codeComplexity: '代码复杂度控制',
    astMetrics: '代码架构能力'
  };
  
  const suggestions = {
    engineeringValue: [
      '专注于高价值任务，避免过多低价值修改',
      '提高每次提交的质量和完整性',
      '参与更有技术含量的需求和功能开发',
      '主动思考技术方案，提升技术深度'
    ],
    codeQuality: [
      '降低代码复杂度，遵循单一职责原则',
      '增加单元测试覆盖率，提高代码健壮性',
      '重构冗余代码，提升代码可维护性',
      '参加代码评审，学习优秀实践'
    ],
    workload: [
      '提高开发效率，合理安排时间',
      '主动承担更多任务，增加贡献量',
      '提升任务完成速度，减少等待时间',
      '识别并解决阻塞开发的问题'
    ],
    technicalImpact: [
      '扩大技术影响范围，参与更多模块开发',
      '主动进行技术分享和知识传递',
      '参与关键基础设施建设',
      '在技术决策中发挥更大作用'
    ],
    codeComplexity: [
      '将复杂逻辑拆分为更小的函数',
      '减少嵌套深度，使代码更易读',
      '使用设计模式简化复杂场景',
      '为复杂代码添加详细注释'
    ],
    astMetrics: [
      '提升代码抽象能力，合理使用类和接口',
      '注重代码组织，设计清晰的模块结构',
      '学习设计模式和架构最佳实践',
      '参与系统架构讨论和设计'
    ]
  };
  
  // 找出最需要改进的3个维度
  const topWeaknesses = scoreEntries.slice(0, 3);
  
  const improvementPlan = topWeaknesses.map(({ key, value }) => {
    return {
      dimension: dimensionNames[key],
      score: Math.round(value * 10) / 10,
      suggestions: suggestions[key] || []
    };
  });
  
  return improvementPlan;
}

/**
 * 计算与团队的对比数据
 */
function calculateTeamComparison(result, allResults) {
  const teamAvg = {};
  const teamMax = {};
  const teamMin = {};
  
  // 计算团队各维度的平均、最大、最小值
  Object.keys(result.scores.detailedScores).forEach(dimension => {
    const scores = allResults.map(r => r.scores.detailedScores[dimension]);
    teamAvg[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length;
    teamMax[dimension] = Math.max(...scores);
    teamMin[dimension] = Math.min(...scores);
  });
  
  return {
    teamAverage: teamAvg,
    teamMax: teamMax,
    teamMin: teamMin,
    rank: allResults.findIndex(r => r.author === result.author) + 1,
    totalMembers: allResults.length
  };
}

/**
 * 生成单个员工的详细Markdown报告
 */
function generateIndividualMarkdownReport(result, allResults, reportData) {
  const comparison = calculateTeamComparison(result, allResults);
  const improvements = generateImprovementSuggestions(result, allResults);
  const normalized = normalizeAuthorData(result.authorData);
  const stats = normalized.statistics;
  const quality = normalized.quality;
  
  let md = `# ${result.author} - 个人绩效评估报告\n\n`;
  md += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `---\n\n`;
  
  // 综合评分
  md += `## 📊 综合评分\n\n`;
  md += `### 总体表现\n\n`;
  md += `- **综合得分**: ${result.scores.totalScore} 分\n`;
  md += `- **等级评定**: ${result.grade} 级\n`;
  md += `- **性能系数**: ${result.multiplier}x\n`;
  md += `- **团队排名**: ${comparison.rank} / ${comparison.totalMembers}\n\n`;
  
  const gradeDesc = {
    S: '🏆 **卓越表现** - 各项指标均处于团队领先水平，是团队的技术标杆。建议作为技术导师，带领团队成长。',
    A: '🥇 **优秀表现** - 整体表现突出，在多个维度上表现优异。继续保持，可向S级发起冲击。',
    B: '🥈 **良好表现** - 工作稳定可靠，达到了预期标准。持续改进，向A级进阶。',
    C: '🥉 **合格表现** - 基本完成工作任务，但仍有较大提升空间。需要重点关注改进方向。',
    D: '📊 **需要改进** - 多个维度表现欠佳，需要制定具体的改进计划并持续跟进。'
  };
  
  md += `${gradeDesc[result.grade]}\n\n`;
  
  // 各维度详细分析
  md += `## 📈 各维度详细分析\n\n`;
  
  const dimensions = [
    { key: 'engineeringValue', name: '工程价值', weight: WEIGHTS.engineeringValue, icon: '🎯' },
    { key: 'codeQuality', name: '代码质量', weight: WEIGHTS.codeQuality, icon: '💎' },
    { key: 'workload', name: '工作量', weight: WEIGHTS.workload, icon: '💼' },
    { key: 'technicalImpact', name: '技术影响力', weight: WEIGHTS.technicalImpact, icon: '🚀' },
    { key: 'codeComplexity', name: '代码复杂度', weight: WEIGHTS.codeComplexity, icon: '🧠' },
    { key: 'astMetrics', name: 'AST指标', weight: WEIGHTS.astMetrics, icon: '🏗️' }
  ];
  
  dimensions.forEach(dim => {
    const score = Math.round(result.scores.detailedScores[dim.key] * 10) / 10;
    const teamAvg = Math.round(comparison.teamAverage[dim.key] * 10) / 10;
    const diff = score - teamAvg;
    const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    const level = score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 70 ? '中等' : score >= 60 ? '合格' : '待提升';
    
    md += `### ${dim.icon} ${dim.name} (权重 ${(dim.weight * 100).toFixed(0)}%)\n\n`;
    md += `- **个人得分**: ${score} 分 (${level})\n`;
    md += `- **团队平均**: ${teamAvg} 分\n`;
    md += `- **与团队对比**: ${diffStr} 分 ${diff > 0 ? '(高于平均)' : diff < 0 ? '(低于平均)' : '(持平)'}\n`;
    md += `- **加权贡献**: ${(score * dim.weight).toFixed(1)} 分\n\n`;
  });
  
  // 优势分析
  md += `## 💪 优势分析\n\n`;
  const scoreEntries = Object.entries(result.scores.detailedScores)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  
  const topStrengths = scoreEntries.slice(0, 3);
  const dimensionMap = Object.fromEntries(dimensions.map(d => [d.key, d]));
  
  md += `您在以下维度表现突出：\n\n`;
  topStrengths.forEach((item, index) => {
    const dim = dimensionMap[item.key];
    const score = Math.round(item.value * 10) / 10;
    md += `${index + 1}. **${dim.icon} ${dim.name}**: ${score} 分`;
    if (score >= 90) md += ' - 卓越水平';
    else if (score >= 80) md += ' - 优秀水平';
    md += '\n';
  });
  
  md += `\n**继续发挥优势**：将这些优势领域作为您的核心竞争力，并考虑在团队中分享经验。\n\n`;
  
  // 改进方向
  md += `## 🎯 改进方向与行动建议\n\n`;
  md += `基于数据分析，以下是建议重点关注的改进方向：\n\n`;
  
  improvements.forEach((item, index) => {
    md += `### ${index + 1}. ${item.dimension} (当前 ${item.score} 分)\n\n`;
    md += `**具体行动建议**：\n\n`;
    item.suggestions.forEach(sugg => {
      md += `- ${sugg}\n`;
    });
    md += '\n';
  });
  
  // 原始数据统计
  md += `## 📋 原始数据统计\n\n`;
  md += `### 工作量指标\n\n`;
  md += `| 指标 | 数值 |\n`;
  md += `|------|------|\n`;
  md += `| 提交次数 | ${stats.totalCommits} |\n`;
  md += `| 新增代码 | +${stats.totalLinesAdded} 行 |\n`;
  md += `| 删除代码 | -${stats.totalLinesDeleted} 行 |\n`;
  md += `| 修改文件 | ${stats.totalFilesChanged} 个 |\n\n`;
  
  md += `### 质量指标\n\n`;
  md += `| 指标 | 数值 |\n`;
  md += `|------|------|\n`;
  md += `| 平均分数 | ${stats.averageScore?.toFixed(2) || 'N/A'} |\n`;
  md += `| 平均影响力 | ${stats.averageImpact?.toFixed(2) || 'N/A'} |\n`;
  md += `| 质量得分 | ${quality.score?.toFixed(2) || 'N/A'} / 100 |\n`;
  md += `| 平均复杂度 | ${quality.averageComplexity?.toFixed(2) || 'N/A'} |\n`;
  md += `| 最大复杂度 | ${quality.maxComplexity || 'N/A'} |\n\n`;
  
  md += `### 代码结构\n\n`;
  md += `| 指标 | 数量 |\n`;
  md += `|------|------|\n`;
  md += `| 函数 | ${stats.totalFunctions || 0} |\n`;
  md += `| 类 | ${stats.totalClasses || 0} |\n`;
  md += `| 接口 | ${stats.totalInterfaces || 0} |\n`;
  md += `| Hooks | ${stats.totalHooks || 0} |\n\n`;
  
  // 发展建议
  md += `## 🚀 发展建议\n\n`;
  
  if (result.grade === 'S') {
    md += `作为团队的技术标杆，建议：\n\n`;
    md += `- 承担更多技术架构和方向决策的责任\n`;
    md += `- 指导和培养团队成员，传递最佳实践\n`;
    md += `- 探索创新技术，为团队带来新的技术视野\n`;
    md += `- 参与跨团队协作，扩大技术影响力\n`;
  } else if (result.grade === 'A') {
    md += `优秀的表现！继续保持并向更高目标进发：\n\n`;
    md += `- 在薄弱环节寻求突破，向S级标准看齐\n`;
    md += `- 主动承担有挑战性的技术任务\n`;
    md += `- 提升技术影响力，参与技术分享\n`;
    md += `- 关注代码质量和架构设计\n`;
  } else if (result.grade === 'B') {
    md += `稳定可靠的表现！建议关注以下提升方向：\n\n`;
    md += `- 系统性提升薄弱维度的能力\n`;
    md += `- 提高工作的技术含量和质量\n`;
    md += `- 主动学习新技术和最佳实践\n`;
    md += `- 参与代码评审，学习优秀代码\n`;
  } else if (result.grade === 'C') {
    md += `需要重点改进以达到团队期望：\n\n`;
    md += `- 制定具体的改进计划，逐项突破\n`;
    md += `- 寻求导师指导，快速提升能力\n`;
    md += `- 加强基础技能学习和实践\n`;
    md += `- 提高代码质量和工作效率\n`;
  } else {
    md += `需要紧急改进，建议采取以下行动：\n\n`;
    md += `- 与主管进行一对一深度沟通\n`;
    md += `- 制定详细的绩效改进计划(PIP)\n`;
    md += `- 寻求专业培训和导师辅导\n`;
    md += `- 每周跟踪改进进展\n`;
  }
  
  md += `\n---\n\n`;
  md += `*本报告由工程价值分析工具自动生成，数据来源于 Git 代码仓库分析。建议结合实际工作情况和主观评价进行综合评估。*\n`;
  
  return md;
}

/**
 * 生成单个员工的详细HTML报告
 */
function generateIndividualHTMLReport(result, allResults, reportData) {
  const comparison = calculateTeamComparison(result, allResults);
  const improvements = generateImprovementSuggestions(result, allResults);
  const normalized = normalizeAuthorData(result.authorData);
  const stats = normalized.statistics;
  const quality = normalized.quality;
  
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${result.author} - 个人绩效评估报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .score-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    .score-item {
      text-align: center;
    }
    .score-item .label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .score-item .value {
      font-size: 36px;
      font-weight: bold;
    }
    .score-item .sub {
      font-size: 14px;
      margin-top: 5px;
    }
    .grade-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 25px;
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
    }
    .grade-S { background: #f39c12; }
    .grade-A { background: #e74c3c; }
    .grade-B { background: #3498db; }
    .grade-C { background: #95a5a6; }
    .grade-D { background: #7f8c8d; }
    h2 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      margin: 30px 0 20px 0;
    }
    h3 {
      color: #34495e;
      margin: 20px 0 10px 0;
    }
    .dimension-card {
      background: #f8f9fa;
      padding: 20px;
      margin: 15px 0;
      border-radius: 8px;
      border-left: 4px solid #3498db;
    }
    .dimension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .dimension-title {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
    }
    .dimension-score {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
    }
    .progress-bar {
      height: 30px;
      background: #ecf0f1;
      border-radius: 15px;
      overflow: hidden;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2ecc71);
      transition: width 0.5s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      color: white;
      font-weight: bold;
    }
    .comparison {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      font-size: 14px;
    }
    .comparison-item {
      flex: 1;
      padding: 8px;
      background: white;
      border-radius: 5px;
      text-align: center;
    }
    .comparison-label {
      color: #7f8c8d;
      font-size: 12px;
    }
    .comparison-value {
      font-weight: bold;
      color: #2c3e50;
    }
    .strengths, .improvements {
      background: #e8f8f5;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .improvements {
      background: #fef5e7;
    }
    .list-item {
      padding: 10px 0;
      border-bottom: 1px solid #ecf0f1;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .suggestion-list {
      margin-top: 10px;
      padding-left: 20px;
    }
    .suggestion-list li {
      margin: 8px 0;
      color: #555;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border-top: 3px solid #3498db;
    }
    .stat-label {
      color: #7f8c8d;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    .advice-box {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .advice-box h3 {
      color: #1976d2;
      margin-top: 0;
    }
    .advice-box ul {
      margin-top: 10px;
      padding-left: 20px;
    }
    .advice-box li {
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #7f8c8d;
      font-size: 14px;
      border-top: 1px solid #ecf0f1;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${result.author}</h1>
      <div class="subtitle">个人绩效评估报告</div>
      <div class="subtitle">生成时间：${new Date().toLocaleString('zh-CN')}</div>
    </div>
    
    <div class="content">
      <div class="score-card">
        <div class="score-item">
          <div class="label">综合得分</div>
          <div class="value">${result.scores.totalScore}</div>
          <div class="grade-badge grade-${result.grade}">${result.grade}级</div>
        </div>
        <div class="score-item">
          <div class="label">性能系数</div>
          <div class="value">${result.multiplier}x</div>
        </div>
        <div class="score-item">
          <div class="label">团队排名</div>
          <div class="value">${comparison.rank}</div>
          <div class="sub">/ ${comparison.totalMembers}人</div>
        </div>
      </div>
      
      <h2>📈 各维度详细分析</h2>`;
  
  const dimensions = [
    { key: 'engineeringValue', name: '🎯 工程价值', weight: WEIGHTS.engineeringValue },
    { key: 'codeQuality', name: '💎 代码质量', weight: WEIGHTS.codeQuality },
    { key: 'workload', name: '💼 工作量', weight: WEIGHTS.workload },
    { key: 'technicalImpact', name: '🚀 技术影响力', weight: WEIGHTS.technicalImpact },
    { key: 'codeComplexity', name: '🧠 代码复杂度', weight: WEIGHTS.codeComplexity },
    { key: 'astMetrics', name: '🏗️ AST指标', weight: WEIGHTS.astMetrics }
  ];
  
  dimensions.forEach(dim => {
    const score = Math.round(result.scores.detailedScores[dim.key] * 10) / 10;
    const teamAvg = Math.round(comparison.teamAverage[dim.key] * 10) / 10;
    const teamMax = Math.round(comparison.teamMax[dim.key] * 10) / 10;
    const diff = score - teamAvg;
    const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    
    html += `
      <div class="dimension-card">
        <div class="dimension-header">
          <div class="dimension-title">${dim.name} <span style="color:#7f8c8d;font-size:14px;">(权重 ${(dim.weight * 100).toFixed(0)}%)</span></div>
          <div class="dimension-score">${score} 分</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${score}%">${score.toFixed(1)}</div>
        </div>
        <div class="comparison">
          <div class="comparison-item">
            <div class="comparison-label">团队平均</div>
            <div class="comparison-value">${teamAvg}</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">团队最高</div>
            <div class="comparison-value">${teamMax}</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">与平均差</div>
            <div class="comparison-value" style="color:${diff > 0 ? '#27ae60' : '#e74c3c'}">${diffStr}</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">加权贡献</div>
            <div class="comparison-value">${(score * dim.weight).toFixed(1)}</div>
          </div>
        </div>
      </div>`;
  });
  
  // 优势分析
  html += `
      <h2>💪 优势分析</h2>
      <div class="strengths">
        <h3>您在以下维度表现突出：</h3>`;
  
  const scoreEntries = Object.entries(result.scores.detailedScores)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  
  const topStrengths = scoreEntries.slice(0, 3);
  const dimensionMap = Object.fromEntries(dimensions.map(d => [d.key, d]));
  
  topStrengths.forEach((item, index) => {
    const dim = dimensionMap[item.key];
    const score = Math.round(item.value * 10) / 10;
    let level = '';
    if (score >= 90) level = ' - <strong style="color:#27ae60;">卓越水平</strong>';
    else if (score >= 80) level = ' - <strong style="color:#2ecc71;">优秀水平</strong>';
    
    html += `
        <div class="list-item">
          <strong>${index + 1}. ${dim.name}: ${score} 分</strong>${level}
        </div>`;
  });
  
  html += `
        <p style="margin-top:15px;color:#555;">💡 <strong>继续发挥优势</strong>：将这些优势领域作为您的核心竞争力，并考虑在团队中分享经验。</p>
      </div>`;
  
  // 改进方向
  html += `
      <h2>🎯 改进方向与行动建议</h2>
      <div class="improvements">
        <h3>建议重点关注以下改进方向：</h3>`;
  
  improvements.forEach((item, index) => {
    html += `
        <div class="list-item">
          <h4 style="color:#d68910;">${index + 1}. ${item.dimension} (当前 ${item.score} 分)</h4>
          <ul class="suggestion-list">`;
    
    item.suggestions.forEach(sugg => {
      html += `<li>${sugg}</li>`;
    });
    
    html += `
          </ul>
        </div>`;
  });
  
  html += `
      </div>`;
  
  // 原始数据统计
  html += `
      <h2>📋 原始数据统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">提交次数</div>
          <div class="stat-value">${stats.totalCommits}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">新增代码</div>
          <div class="stat-value">+${stats.totalLinesAdded}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">删除代码</div>
          <div class="stat-value">-${stats.totalLinesDeleted}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">修改文件</div>
          <div class="stat-value">${stats.totalFilesChanged}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均分数</div>
          <div class="stat-value">${stats.averageScore?.toFixed(2) || 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均影响力</div>
          <div class="stat-value">${stats.averageImpact?.toFixed(2) || 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">质量得分</div>
          <div class="stat-value">${quality.score?.toFixed(1) || 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均复杂度</div>
          <div class="stat-value">${quality.averageComplexity?.toFixed(2) || 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">函数数</div>
          <div class="stat-value">${stats.totalFunctions || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">类数</div>
          <div class="stat-value">${stats.totalClasses || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">接口数</div>
          <div class="stat-value">${stats.totalInterfaces || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Hooks数</div>
          <div class="stat-value">${stats.totalHooks || 0}</div>
        </div>
      </div>`;
  
  // 发展建议
  html += `
      <h2>🚀 发展建议</h2>
      <div class="advice-box">`;
  
  if (result.grade === 'S') {
    html += `
        <h3>作为团队的技术标杆，建议：</h3>
        <ul>
          <li>承担更多技术架构和方向决策的责任</li>
          <li>指导和培养团队成员，传递最佳实践</li>
          <li>探索创新技术，为团队带来新的技术视野</li>
          <li>参与跨团队协作，扩大技术影响力</li>
        </ul>`;
  } else if (result.grade === 'A') {
    html += `
        <h3>优秀的表现！继续保持并向更高目标进发：</h3>
        <ul>
          <li>在薄弱环节寻求突破，向S级标准看齐</li>
          <li>主动承担有挑战性的技术任务</li>
          <li>提升技术影响力，参与技术分享</li>
          <li>关注代码质量和架构设计</li>
        </ul>`;
  } else if (result.grade === 'B') {
    html += `
        <h3>稳定可靠的表现！建议关注以下提升方向：</h3>
        <ul>
          <li>系统性提升薄弱维度的能力</li>
          <li>提高工作的技术含量和质量</li>
          <li>主动学习新技术和最佳实践</li>
          <li>参与代码评审，学习优秀代码</li>
        </ul>`;
  } else if (result.grade === 'C') {
    html += `
        <h3>需要重点改进以达到团队期望：</h3>
        <ul>
          <li>制定具体的改进计划，逐项突破</li>
          <li>寻求导师指导，快速提升能力</li>
          <li>加强基础技能学习和实践</li>
          <li>提高代码质量和工作效率</li>
        </ul>`;
  } else {
    html += `
        <h3>需要紧急改进，建议采取以下行动：</h3>
        <ul>
          <li>与主管进行一对一深度沟通</li>
          <li>制定详细的绩效改进计划(PIP)</li>
          <li>寻求专业培训和导师辅导</li>
          <li>每周跟踪改进进展</li>
        </ul>`;
  }
  
  html += `
      </div>
      
      <div class="footer">
        <p>本报告由工程价值分析工具自动生成，数据来源于 Git 代码仓库分析。</p>
        <p>建议结合实际工作情况和主观评价进行综合评估。</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * 生成Markdown格式报告
 */
function generateMarkdownReport(scoringResults, reportData) {
  let md = '# 团队成员综合评分报告\n\n';
  md += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  
  // 评分配置说明
  md += '## 评分体系说明\n\n';
  md += '### 评分维度及权重\n\n';
  md += `- 工程价值：${(WEIGHTS.engineeringValue * 100).toFixed(0)}%\n`;
  md += `- 代码质量：${(WEIGHTS.codeQuality * 100).toFixed(0)}%\n`;
  md += `- 工作量：${(WEIGHTS.workload * 100).toFixed(0)}%\n`;
  md += `- 技术影响力：${(WEIGHTS.technicalImpact * 100).toFixed(0)}%\n`;
  md += `- 代码复杂度：${(WEIGHTS.codeComplexity * 100).toFixed(0)}%\n`;
  md += `- AST指标：${(WEIGHTS.astMetrics * 100).toFixed(0)}%\n\n`;
  
  md += '### 等级标准\n\n';
  md += '- S级（90-100分）：卓越表现，性能系数 1.5x\n';
  md += '- A级（80-89分）：优秀表现，性能系数 1.2x\n';
  md += '- B级（70-79分）：良好表现，性能系数 1.0x\n';
  md += '- C级（60-69分）：合格表现，性能系数 0.8x\n';
  md += '- D级（<60分）：需要改进，性能系数 0.6x\n\n';
  
  // 总体排名
  md += '## 总体排名\n\n';
  md += '| 排名 | 姓名 | 综合得分 | 等级 | 性能系数 |\n';
  md += '|------|------|----------|------|----------|\n';
  
  scoringResults.forEach((result, index) => {
    md += `| ${index + 1} | ${result.author} | ${result.scores.totalScore} | ${result.grade} | ${result.multiplier}x |\n`;
  });
  md += '\n';
  
  // 详细评分
  md += '## 详细评分\n\n';
  
  scoringResults.forEach((result, index) => {
    md += `### ${index + 1}. ${result.author}\n\n`;
    md += `**综合得分：${result.scores.totalScore} 分 | 等级：${result.grade} | 性能系数：${result.multiplier}x**\n\n`;
    
    // 各维度得分
    md += '#### 各维度得分\n\n';
    md += '| 维度 | 得分 | 权重 | 加权得分 |\n';
    md += '|------|------|------|----------|\n';
    
    const dimensions = [
      { key: 'engineeringValue', name: '工程价值', weight: WEIGHTS.engineeringValue },
      { key: 'codeQuality', name: '代码质量', weight: WEIGHTS.codeQuality },
      { key: 'workload', name: '工作量', weight: WEIGHTS.workload },
      { key: 'technicalImpact', name: '技术影响力', weight: WEIGHTS.technicalImpact },
      { key: 'codeComplexity', name: '代码复杂度', weight: WEIGHTS.codeComplexity },
      { key: 'astMetrics', name: 'AST指标', weight: WEIGHTS.astMetrics }
    ];
    
    dimensions.forEach(dim => {
      const score = Math.round(result.scores.detailedScores[dim.key] * 10) / 10;
      const weighted = Math.round(score * dim.weight * 10) / 10;
      md += `| ${dim.name} | ${score} | ${(dim.weight * 100).toFixed(0)}% | ${weighted} |\n`;
    });
    md += '\n';
    
    // 原始数据统计
    md += '#### 原始数据统计\n\n';
    const normalized = normalizeAuthorData(result.authorData);
    const stats = normalized.statistics;
    const quality = normalized.quality;
    
    md += '**工程指标：**\n';
    md += `- 提交数：${stats.totalCommits}\n`;
    md += `- 代码行数：+${stats.totalLinesAdded} / -${stats.totalLinesDeleted}\n`;
    md += `- 文件修改数：${stats.totalFilesChanged}\n`;
    md += `- 平均分数：${stats.averageScore?.toFixed(2) || 'N/A'}\n`;
    md += `- 平均影响力：${stats.averageImpact?.toFixed(2) || 'N/A'}\n\n`;
    
    md += '**质量指标：**\n';
    md += `- 质量分数：${quality.score?.toFixed(2) || 'N/A'} / 100\n`;
    md += `- 平均复杂度：${quality.averageComplexity?.toFixed(2) || 'N/A'}\n`;
    md += `- 最大复杂度：${quality.maxComplexity || 'N/A'}\n\n`;
    
    md += '**代码结构：**\n';
    md += `- 函数数：${stats.totalFunctions || 0}\n`;
    md += `- 类数：${stats.totalClasses || 0}\n`;
    md += `- 接口数：${stats.totalInterfaces || 0}\n`;
    md += `- Hooks数：${stats.totalHooks || 0}\n\n`;
    
    // 评价
    md += '#### 综合评价\n\n';
    md += result.evaluation.split('\n').map(line => line.trim()).filter(line => line).join('\n\n');
    md += '\n\n';
    
    md += '---\n\n';
  });
  
  return md;
}

/**
 * 生成HTML格式报告
 */
function generateHTMLReport(scoringResults, reportData) {
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>团队成员综合评分报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    h2 {
      color: #34495e;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-left: 10px;
      border-left: 4px solid #3498db;
    }
    h3 {
      color: #34495e;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h4 {
      color: #7f8c8d;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .meta {
      color: #7f8c8d;
      margin-bottom: 30px;
    }
    .config-section {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .config-section ul {
      list-style-position: inside;
      margin-top: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #3498db;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .member-card {
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .member-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ecf0f1;
    }
    .member-name {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    .member-score {
      text-align: right;
    }
    .score-value {
      font-size: 36px;
      font-weight: bold;
      color: #3498db;
    }
    .score-grade {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      margin-left: 10px;
    }
    .grade-S { background: #f39c12; color: white; }
    .grade-A { background: #e74c3c; color: white; }
    .grade-B { background: #3498db; color: white; }
    .grade-C { background: #95a5a6; color: white; }
    .grade-D { background: #7f8c8d; color: white; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-item {
      background: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
    }
    .stat-label {
      color: #7f8c8d;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .stat-value {
      color: #2c3e50;
      font-size: 18px;
      font-weight: bold;
    }
    .evaluation {
      background: #e8f4f8;
      border-left: 4px solid #3498db;
      padding: 20px;
      margin-top: 20px;
      border-radius: 5px;
    }
    .chart-container {
      margin: 20px 0;
    }
    .bar-chart {
      margin: 10px 0;
    }
    .bar-label {
      display: inline-block;
      width: 150px;
      font-size: 14px;
      color: #555;
    }
    .bar-wrapper {
      display: inline-block;
      width: calc(100% - 250px);
      height: 25px;
      background: #ecf0f1;
      border-radius: 3px;
      position: relative;
      margin-right: 10px;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2ecc71);
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .bar-value {
      display: inline-block;
      width: 80px;
      text-align: right;
      font-weight: bold;
      color: #3498db;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>团队成员综合评分报告</h1>
    <div class="meta">生成时间：${new Date().toLocaleString('zh-CN')}</div>
    
    <div class="config-section">
      <h3>评分体系说明</h3>
      <h4>评分维度及权重</h4>
      <ul>
        <li>工程价值：${(WEIGHTS.engineeringValue * 100).toFixed(0)}%</li>
        <li>代码质量：${(WEIGHTS.codeQuality * 100).toFixed(0)}%</li>
        <li>工作量：${(WEIGHTS.workload * 100).toFixed(0)}%</li>
        <li>技术影响力：${(WEIGHTS.technicalImpact * 100).toFixed(0)}%</li>
        <li>代码复杂度：${(WEIGHTS.codeComplexity * 100).toFixed(0)}%</li>
        <li>AST指标：${(WEIGHTS.astMetrics * 100).toFixed(0)}%</li>
      </ul>
      <h4>等级标准</h4>
      <ul>
        <li>S级（90-100分）：卓越表现，性能系数 1.5x</li>
        <li>A级（80-89分）：优秀表现，性能系数 1.2x</li>
        <li>B级（70-79分）：良好表现，性能系数 1.0x</li>
        <li>C级（60-69分）：合格表现，性能系数 0.8x</li>
        <li>D级（<60分）：需要改进，性能系数 0.6x</li>
      </ul>
    </div>
    
    <h2>总体排名</h2>
    <table>
      <thead>
        <tr>
          <th>排名</th>
          <th>姓名</th>
          <th>综合得分</th>
          <th>等级</th>
          <th>性能系数</th>
        </tr>
      </thead>
      <tbody>`;
  
  scoringResults.forEach((result, index) => {
    html += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${result.author}</strong></td>
          <td><strong>${result.scores.totalScore}</strong></td>
          <td><span class="score-grade grade-${result.grade}">${result.grade}</span></td>
          <td>${result.multiplier}x</td>
        </tr>`;
  });
  
  html += `
      </tbody>
    </table>
    
    <h2>详细评分</h2>`;
  
  scoringResults.forEach((result, index) => {
    const normalized = normalizeAuthorData(result.authorData);
    const stats = normalized.statistics;
    const quality = normalized.quality;
    
    html += `
    <div class="member-card">
      <div class="member-header">
        <div>
          <div class="member-name">${index + 1}. ${result.author}</div>
        </div>
        <div class="member-score">
          <span class="score-value">${result.scores.totalScore}</span>
          <span class="score-grade grade-${result.grade}">${result.grade}</span>
          <div style="margin-top: 5px; color: #7f8c8d;">性能系数：${result.multiplier}x</div>
        </div>
      </div>
      
      <h4>各维度得分</h4>
      <div class="chart-container">`;
    
    const dimensions = [
      { key: 'engineeringValue', name: '工程价值' },
      { key: 'codeQuality', name: '代码质量' },
      { key: 'workload', name: '工作量' },
      { key: 'technicalImpact', name: '技术影响力' },
      { key: 'codeComplexity', name: '代码复杂度' },
      { key: 'astMetrics', name: 'AST指标' }
    ];
    
    dimensions.forEach(dim => {
      const score = Math.round(result.scores.detailedScores[dim.key] * 10) / 10;
      html += `
        <div class="bar-chart">
          <span class="bar-label">${dim.name}</span>
          <div class="bar-wrapper">
            <div class="bar-fill" style="width: ${score}%"></div>
          </div>
          <span class="bar-value">${score} 分</span>
        </div>`;
    });
    
    html += `
      </div>
      
      <h4>原始数据统计</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">提交数</div>
          <div class="stat-value">${stats.totalCommits}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">代码行数</div>
          <div class="stat-value">+${stats.totalLinesAdded} / -${stats.totalLinesDeleted}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">文件修改数</div>
          <div class="stat-value">${stats.totalFilesChanged}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均分数</div>
          <div class="stat-value">${stats.averageScore?.toFixed(2) || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均影响力</div>
          <div class="stat-value">${stats.averageImpact?.toFixed(2) || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">质量分数</div>
          <div class="stat-value">${quality.score?.toFixed(2) || 'N/A'} / 100</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均复杂度</div>
          <div class="stat-value">${quality.averageComplexity?.toFixed(2) || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最大复杂度</div>
          <div class="stat-value">${quality.maxComplexity || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">函数数</div>
          <div class="stat-value">${stats.totalFunctions || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">类数</div>
          <div class="stat-value">${stats.totalClasses || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">接口数</div>
          <div class="stat-value">${stats.totalInterfaces || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Hooks数</div>
          <div class="stat-value">${stats.totalHooks || 0}</div>
        </div>
      </div>
      
      <div class="evaluation">
        <h4>综合评价</h4>
        <p>${result.evaluation.split('\n').map(line => line.trim()).filter(line => line).join('</p><p>')}</p>
      </div>
    </div>`;
  });
  
  html += `
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * 主函数
 */
async function main() {
  console.log('团队成员自动化综合打分工具\n');
  
  // 检查参数
  if (process.argv.length < 3) {
    console.error('使用方法：node score-team.js <JSON报告文件路径>');
    console.error('示例：node score-team.js ./reports/branch-multi-comparison-2024-main-develop.json');
    process.exit(1);
  }
  
  const jsonFilePath = process.argv[2];
  
  // 检查文件是否存在
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`错误：文件不存在 - ${jsonFilePath}`);
    process.exit(1);
  }
  
  console.log(`读取报告文件：${jsonFilePath}`);
  
  // 读取JSON报告
  let reportData;
  try {
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
    reportData = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`错误：无法读取或解析JSON文件 - ${error.message}`);
    process.exit(1);
  }
  
  // 验证数据格式
  if (!reportData.results || !Array.isArray(reportData.results)) {
    console.error('错误：JSON文件格式不正确，缺少 results 数组');
    process.exit(1);
  }
  
  console.log(`\n找到 ${reportData.results.length} 名团队成员\n`);
  
  // 计算每个成员的得分
  const scoringResults = reportData.results.map(authorData => {
    const scores = calculateComprehensiveScore(authorData, reportData.results);
    const grade = determineGrade(scores.totalScore);
    const multiplier = PERFORMANCE_MULTIPLIERS[grade];
    const evaluation = generateEvaluation(grade, scores, authorData);
    
    return {
      author: authorData.author,
      scores,
      grade,
      multiplier,
      evaluation,
      authorData
    };
  });
  
  // 按得分排序
  scoringResults.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
  
  // 输出简要结果到控制台
  console.log('='.repeat(80));
  console.log('综合评分结果');
  console.log('='.repeat(80));
  console.log();
  
  scoringResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.author}`);
    console.log(`   综合得分：${result.scores.totalScore} 分`);
    console.log(`   等级：${result.grade} | 性能系数：${result.multiplier}x`);
    console.log(`   各维度得分：`);
    console.log(`   - 工程价值：${Math.round(result.scores.detailedScores.engineeringValue * 10) / 10}`);
    console.log(`   - 代码质量：${Math.round(result.scores.detailedScores.codeQuality * 10) / 10}`);
    console.log(`   - 工作量：${Math.round(result.scores.detailedScores.workload * 10) / 10}`);
    console.log(`   - 技术影响力：${Math.round(result.scores.detailedScores.technicalImpact * 10) / 10}`);
    console.log(`   - 代码复杂度：${Math.round(result.scores.detailedScores.codeComplexity * 10) / 10}`);
    console.log(`   - AST指标：${Math.round(result.scores.detailedScores.astMetrics * 10) / 10}`);
    console.log();
  });
  
  // 保存详细报告
  const reportDir = path.dirname(jsonFilePath);
  const baseNameWithoutExt = path.basename(jsonFilePath, '.json');
  
  // 保存JSON
  const scoringJsonPath = path.join(reportDir, `${baseNameWithoutExt}-scoring.json`);
  fs.writeFileSync(scoringJsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    weights: WEIGHTS,
    gradeThresholds: GRADE_THRESHOLDS,
    performanceMultipliers: PERFORMANCE_MULTIPLIERS,
    results: scoringResults
  }, null, 2));
  console.log(`✓ JSON报告已保存：${scoringJsonPath}`);
  
  // 保存Markdown
  const markdownReport = generateMarkdownReport(scoringResults, reportData);
  const scoringMdPath = path.join(reportDir, `${baseNameWithoutExt}-scoring.md`);
  fs.writeFileSync(scoringMdPath, markdownReport);
  console.log(`✓ Markdown报告已保存：${scoringMdPath}`);
  
  // 保存HTML
  const htmlReport = generateHTMLReport(scoringResults, reportData);
  const scoringHtmlPath = path.join(reportDir, `${baseNameWithoutExt}-scoring.html`);
  fs.writeFileSync(scoringHtmlPath, htmlReport);
  console.log(`✓ HTML报告已保存：${scoringHtmlPath}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('生成个人详细报告...');
  console.log('='.repeat(80));
  console.log();
  
  // 为每个成员生成单独的个人报告
  scoringResults.forEach((result, index) => {
    const sanitizedName = result.author.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    
    // 生成个人Markdown报告
    const individualMd = generateIndividualMarkdownReport(result, scoringResults, reportData);
    const individualMdPath = path.join(reportDir, `individual-${sanitizedName}.md`);
    fs.writeFileSync(individualMdPath, individualMd);
    console.log(`✓ ${result.author} 的Markdown报告已保存：${individualMdPath}`);
    
    // 生成个人HTML报告
    const individualHtml = generateIndividualHTMLReport(result, scoringResults, reportData);
    const individualHtmlPath = path.join(reportDir, `individual-${sanitizedName}.html`);
    fs.writeFileSync(individualHtmlPath, individualHtml);
    console.log(`✓ ${result.author} 的HTML报告已保存：${individualHtmlPath}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('评分和报告生成完成！');
  console.log('='.repeat(80));
  console.log('\n📊 总结：');
  console.log(`   - 团队总报告: 3 个文件 (JSON + MD + HTML)`);
  console.log(`   - 个人详细报告: ${scoringResults.length * 2} 个文件 (每人 MD + HTML)`);
  console.log(`   - 报告目录: ${reportDir}`);
  console.log('\n💡 建议：');
  console.log(`   1. 打开团队HTML报告查看整体对比: ${path.basename(scoringHtmlPath)}`);
  console.log(`   2. 为每个成员发送其个人HTML报告进行一对一反馈`);
  console.log(`   3. 个人报告包含详细的优缺点分析和改进建议\n`);
}

// 执行主函数
main().catch(error => {
  console.error('执行出错：', error);
  process.exit(1);
});
