/**
 * 计算工程价值得分
 * @param {Object} params - 评分参数
 * @param {number} params.impactScore - 影响范围得分
 * @param {number} params.churnScore - 文件修改频率得分
 * @param {number} params.addedLines - 新增代码行数
 * @param {number} params.deletedLines - 删除代码行数
 * @param {Object} params.astStats - AST 分析统计
 * @param {Object} params.complexityData - 复杂度分析数据（可选）
 * @param {number} params.qualityScore - 代码质量得分（可选）
 * @returns {number} 工程价值得分
 */
function calculateEngineeringScore({
  impactScore,
  churnScore,
  addedLines,
  deletedLines = 0,
  astStats,
  complexityData = null,
  qualityScore = null
}) {
  // 抽象能力加分：函数、类、接口、React Hooks
  const abstractionBonus = 
    astStats.functions * 2 + 
    astStats.classes * 4 + 
    astStats.interfaces * 3 + 
    astStats.hooks * 2;

  let score = 0;

  // 影响范围得分（权重 2）
  score += impactScore * 2;

  // 代码量得分（使用对数避免单纯堆代码行数）
  score += Math.log(addedLines + 1) * 1.5;

  // 抽象能力得分（权重 3）
  score += abstractionBonus * 3;

  // 代码精简加分（删除冗余代码）
  if (deletedLines > addedLines && deletedLines > 10) {
    score += Math.log(deletedLines - addedLines + 1) * 0.5;
  }

  // 代码流动性惩罚（频繁修改的文件可能存在设计问题）
  score -= churnScore * 0.5;

  // 代码质量加分（如果提供了质量数据）
  if (qualityScore !== null && complexityData !== null) {
    // 高质量代码（低复杂度、高注释率）获得加分
    const qualityBonus = (qualityScore / 100) * 15; // 最多加 15 分
    score += qualityBonus;

    // 复杂度分布加分（处理复杂问题的能力）
    if (complexityData.complexityDistribution) {
      const highComplexityRatio = 
        (complexityData.complexityDistribution.high + complexityData.complexityDistribution.veryHigh) / 
        Math.max(1, complexityData.analyzedFiles);
      
      // 适度的复杂代码说明处理了有难度的问题
      if (highComplexityRatio > 0.1 && highComplexityRatio < 0.5) {
        score += 5; // 难度加分
      }
    }
  }

  return Math.max(0, Math.round(score * 100) / 100);
}

/**
 * 计算得分等级
 * @param {number} score - 得分
 * @returns {string} 等级
 */
function getScoreLevel(score) {
  if (score >= 100) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

module.exports = { 
  calculateEngineeringScore,
  getScoreLevel 
};
