const { execSync } = require("child_process");

/**
 * 批量获取文件的修改频率（churn）
 * @param {Array<string>} files - 文件路径列表
 * @param {string} year - 年份
 * @returns {Map<string, number>} 文件路径到修改次数的映射
 */
function getFilesChurnBatch(files, year) {
  const churnMap = new Map();
  
  if (!files || files.length === 0) {
    return churnMap;
  }

  // 批量获取所有文件的 churn 信息，提升性能
  try {
    // 获取指定年份所有 commit 和修改的文件
    const result = execSync(
      `git log --since="${year}-01-01" --until="${year}-12-31" --name-only --pretty=format:`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    ).trim();
    
    if (!result) {
      return churnMap;
    }

    // 统计每个文件出现的次数
    const allFiles = result.split('\n').filter(line => line.trim());
    allFiles.forEach(file => {
      if (file) {
        churnMap.set(file, (churnMap.get(file) || 0) + 1);
      }
    });
  } catch (error) {
    // Churn 分析失败时静默处理（避免打断进度条）
    // 如需调试，取消下面注释：
    // console.warn(`警告: 获取文件 churn 信息失败: ${error.message}`);
  }

  return churnMap;
}

/**
 * 计算文件的平均修改频率
 * @param {Array<string>} files - 文件路径列表
 * @param {string} year - 年份
 * @returns {number} 平均修改频率
 */
function calculateChurn(files, year) {
  if (!files || files.length === 0) {
    return 0;
  }

  const churnMap = getFilesChurnBatch(files, year);
  
  let total = 0;
  let count = 0;
  
  files.forEach(file => {
    const churn = churnMap.get(file) || 0;
    total += churn;
    count++;
  });

  return count > 0 ? total / count : 0;
}

/**
 * 获取高频修改文件列表
 * @param {Array<string>} files - 文件路径列表
 * @param {string} year - 年份
 * @param {number} threshold - 阈值，默认为5
 * @returns {Array<Object>} 高频修改的文件列表
 */
function getHighChurnFiles(files, year, threshold = 5) {
  const churnMap = getFilesChurnBatch(files, year);
  
  return files
    .map(file => ({
      file,
      churn: churnMap.get(file) || 0
    }))
    .filter(item => item.churn >= threshold)
    .sort((a, b) => b.churn - a.churn);
}

module.exports = { 
  calculateChurn, 
  getFilesChurnBatch,
  getHighChurnFiles 
};
