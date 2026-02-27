const { execSync } = require("child_process");

/**
 * 安全执行 Git 命令
 * @param {string} cmd - 要执行的命令
 * @returns {string} 命令输出
 * @throws {Error} 当命令执行失败时抛出错误
 */
function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch (error) {
    throw new Error(`Git 命令执行失败: ${cmd}\n${error.message}`);
  }
}

/**
 * 验证年份格式
 * @param {string} year - 年份
 * @returns {boolean} 是否有效
 */
function validateYear(year) {
  const yearNum = parseInt(year);
  return yearNum >= 2000 && yearNum <= new Date().getFullYear();
}

/**
 * 检查是否在 Git 仓库中
 * @returns {boolean} 是否在 Git 仓库中
 */
function isGitRepository() {
  try {
    execSync("git rev-parse --git-dir", { encoding: "utf-8", stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取所有分支列表
 * @param {boolean} includeRemote - 是否包含远程分支
 * @returns {Array<string>} 分支名列表
 */
function getAllBranches(includeRemote = false) {
  if (!isGitRepository()) {
    throw new Error("当前目录不是 Git 仓库");
  }

  const flag = includeRemote ? '-a' : '';
  const raw = run(`git branch ${flag} --format="%(refname:short)"`);
  return raw ? raw.split("\n").filter(branch => branch.length > 0) : [];
}

/**
 * 检查分支是否存在
 * @param {string} branch - 分支名
 * @returns {boolean} 分支是否存在
 */
function branchExists(branch) {
  try {
    run(`git rev-parse --verify ${branch}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取指定年份和作者的所有 commit（支持分支过滤）
 * @param {string} year - 年份
 * @param {string} author - 作者名
 * @param {string|Array<string>} branches - 分支名或分支名数组（可选）
 * @returns {Array<string>} commit hash 列表（已去重）
 */
function getCommits(year, author, branches = null) {
  if (!validateYear(year)) {
    throw new Error(`无效的年份: ${year}，请输入 2000-${new Date().getFullYear()} 之间的年份`);
  }

  if (!isGitRepository()) {
    throw new Error("当前目录不是 Git 仓库，请在 Git 仓库根目录下运行此命令");
  }

  // 构建分支参数
  let branchArgs = '';
  if (branches) {
    const branchList = Array.isArray(branches) ? branches : [branches];
    
    // 验证分支存在
    for (const branch of branchList) {
      if (!branchExists(branch)) {
        throw new Error(`分支 "${branch}" 不存在`);
      }
    }
    
    branchArgs = branchList.join(' ');
  } else {
    // 如果不指定分支，使用 --all 获取所有分支的 commit
    branchArgs = '--all';
  }

  const raw = run(
    `git log ${branchArgs} --since="${year}-01-01" --until="${year}-12-31" --author="${author}" --pretty=format:"%H"`
  );
  
  const commits = raw ? raw.split("\n").filter(hash => hash.length > 0) : [];
  
  // 去重（使用 Set 自动去重）
  return [...new Set(commits)];
}

/**
 * 获取指定分支的 commit 列表
 * @param {string} branch - 分支名
 * @param {string} year - 年份
 * @param {string} author - 作者名
 * @returns {Array<string>} commit hash 列表
 */
function getCommitsByBranch(branch, year, author) {
  if (!validateYear(year)) {
    throw new Error(`无效的年份: ${year}`);
  }

  if (!branchExists(branch)) {
    throw new Error(`分支 "${branch}" 不存在`);
  }

  const raw = run(
    `git log ${branch} --since="${year}-01-01" --until="${year}-12-31" --author="${author}" --pretty=format:"%H"`
  );
  return raw ? raw.split("\n").filter(hash => hash.length > 0) : [];
}

/**
 * 多分支 commit 分析（带详细统计）
 * @param {Array<string>} branches - 分支名数组
 * @param {string} year - 年份
 * @param {string} author - 作者名
 * @returns {Object} 包含各分支统计和去重后的总 commit
 */
function analyzeBranches(branches, year, author) {
  const branchStats = {};
  const allCommits = new Set();
  const commitToBranches = {}; // commit -> [branches]

  branches.forEach(branch => {
    const commits = getCommitsByBranch(branch, year, author);
    branchStats[branch] = {
      totalCommits: commits.length,
      commits: commits
    };

    commits.forEach(commit => {
      allCommits.add(commit);
      if (!commitToBranches[commit]) {
        commitToBranches[commit] = [];
      }
      commitToBranches[commit].push(branch);
    });
  });

  // 统计独有和共享的 commit
  const uniqueCommits = {}; // branch -> unique commits
  const sharedCommits = []; // commits in multiple branches

  branches.forEach(branch => {
    uniqueCommits[branch] = [];
  });

  Object.entries(commitToBranches).forEach(([commit, inBranches]) => {
    if (inBranches.length === 1) {
      uniqueCommits[inBranches[0]].push(commit);
    } else {
      sharedCommits.push({
        commit,
        branches: inBranches
      });
    }
  });

  return {
    totalUniqueCommits: allCommits.size,
    branchStats,
    uniqueCommits,
    sharedCommits,
    commitToBranches
  };
}

/**
 * 获取单个 commit 的差异统计
 * @param {string} commit - commit hash
 * @returns {Object} 包含文件数、增删行数和修改文件列表
 */
function getDiffStats(commit) {
  const raw = run(`git show --numstat --format="" ${commit}`);
  let files = 0,
    add = 0,
    del = 0,
    touchedFiles = [];

  raw.split("\n").forEach(line => {
    const parts = line.split("\t");
    if (parts.length === 3) {
      files++;
      const addLines = Number(parts[0]) || 0;
      const delLines = Number(parts[1]) || 0;
      add += addLines;
      del += delLines;
      touchedFiles.push(parts[2]);
    }
  });

  return { files, add, del, touchedFiles };
}

/**
 * 获取 commit 的详细信息
 * @param {string} commit - commit hash
 * @returns {Object} commit 详细信息
 */
function getCommitInfo(commit) {
  try {
    const message = run(`git log -1 --pretty=format:"%s" ${commit}`);
    const date = run(`git log -1 --pretty=format:"%ad" --date=short ${commit}`);
    return { message, date };
  } catch {
    return { message: "无法获取提交信息", date: "" };
  }
}

module.exports = { 
  getCommits, 
  getDiffStats, 
  getCommitInfo,
  isGitRepository,
  validateYear,
  getAllBranches,
  branchExists,
  getCommitsByBranch,
  analyzeBranches
};