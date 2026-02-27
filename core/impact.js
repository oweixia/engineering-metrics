/**
 * 计算代码修改的影响范围
 * @param {Object} diff - 包含修改文件信息的对象
 * @returns {Object} 影响范围统计
 */
function calculateImpact(diff) {
  const directories = new Set();
  const fileTypes = new Map();
  
  diff.touchedFiles.forEach(file => {
    // 统计目录
    const parts = file.split('/');
    if (parts.length > 1) {
      directories.add(parts[0]);
    }
    
    // 统计文件类型
    const ext = file.split('.').pop();
    fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
  });

  // 计算影响分数：文件数 + 目录数权重 + 代码行变更权重
  const impactScore = diff.files + directories.size * 2 + Math.sqrt(diff.add + diff.del) * 0.5;

  return {
    fileCount: diff.files,
    directoryCount: directories.size,
    fileTypes: Object.fromEntries(fileTypes),
    impactScore: Math.round(impactScore * 10) / 10
  };
}

module.exports = { calculateImpact };
