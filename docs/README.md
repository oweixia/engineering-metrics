# 📚 Engineering Value CLI - 文档中心

欢迎使用 Engineering Value CLI！这里是完整的文档导航。

---

## 📖 文档导航

### 🚀 快速开始

- **[项目主页](../README.md)** - 项目概览、安装和快速使用
- **[完整使用指南](guides/USER_GUIDE.md)** - 详细的命令说明、案例和技巧

### 👥 用户指南

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [完整使用指南](guides/USER_GUIDE.md) | 详细的命令说明、实战案例、进阶技巧 | 所有用户 |
| [绩效评分指南](guides/PERFORMANCE_SCORING_GUIDE.md) | 如何基于报告科学打分、评估团队 | 团队Leader、HR |

### 📋 参考文档

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [代码质量评分体系](references/MAINTAINABILITY_GUIDE.md) | 可维护性和可扩展性评分详解 | 关注代码质量的开发者 |

### 📝 其他

- **[更新日志](CHANGELOG.md)** - 版本更新记录和新功能说明
- **[项目结构](PROJECT_STRUCTURE.md)** - 完整的项目目录结构说明

---

## 🎯 按场景选择文档

### 场景 1: 第一次使用这个工具
1. **阅读**: [项目主页](../README.md) 了解功能
2. **实践**: 跟着「快速开始」部分运行第一个命令
3. **深入**: 遇到问题时查阅 [完整使用指南](guides/USER_GUIDE.md)

### 场景 2: 我要生成个人年度总结
1. **快速上手**: [项目主页](../README.md) → 「快速示例 1」
2. **详细步骤**: [完整使用指南](guides/USER_GUIDE.md) → 「实战案例 1: 个人年度总结」

### 场景 3: 我要评估团队成员，给绩效打分
1. **了解功能**: [项目主页](../README.md) → 「多人对比」和「团队打分」
2. **学习打分**: [绩效评分指南](guides/PERFORMANCE_SCORING_GUIDE.md) ⭐ **必读**
3. **详细步骤**: [完整使用指南](guides/USER_GUIDE.md) → 「实战案例 2: 团队绩效评估」

### 场景 4: 我要分析发版分支，避免重复统计
1. **了解去重**: [项目主页](../README.md) → 「分支对比」
2. **详细步骤**: [完整使用指南](guides/USER_GUIDE.md) → 「实战案例 3: 发版分支分析」

### 场景 5: 我想了解代码质量是怎么评估的
1. **快速了解**: [项目主页](../README.md) → 「评分维度」
2. **深入学习**: [代码质量评分体系](references/MAINTAINABILITY_GUIDE.md)

### 场景 6: 遇到问题或报错
1. **常见问题**: [项目主页](../README.md) → 「常见问题」
2. **详细解答**: [完整使用指南](guides/USER_GUIDE.md) → 「常见问题」

### 场景 7: 我想定制功能或集成到 CI/CD
1. **进阶技巧**: [完整使用指南](guides/USER_GUIDE.md) → 「进阶使用」

---

## 📂 文档结构

```
docs/
├── README.md                          # 📚 本文档（文档中心）
│
├── guides/                            # 👥 用户指南
│   ├── USER_GUIDE.md                  # 完整使用指南
│   └── PERFORMANCE_SCORING_GUIDE.md   # 绩效评分指南（领导必读）
│
├── references/                        # 📋 参考文档
│   └── MAINTAINABILITY_GUIDE.md       # 代码质量评分体系
│
├── CHANGELOG.md                       # 更新日志
└── PROJECT_STRUCTURE.md               # 项目结构说明
```

---

## 🔗 快速链接

### 常用命令

```bash
# 个人分析
eng-value 2024 "你的名字"

# 团队对比
eng-compare 2024 "成员A" "成员B" "成员C"

# 分支对比（智能去重）
eng-branch 2024 "你的名字" main develop

# 多人多分支对比
eng-branch-multi 2024 main develop -- "成员A" "成员B"

# 自动化打分
eng-score ./comparison-report-2024.json
```

### 文档快速访问

- 📖 [完整使用指南](guides/USER_GUIDE.md) - 所有命令的详细说明
- 👔 [绩效评分指南](guides/PERFORMANCE_SCORING_GUIDE.md) - Leader 必读
- 🔧 [代码质量评分](references/MAINTAINABILITY_GUIDE.md) - 质量体系详解
- 📋 [更新日志](CHANGELOG.md) - 版本历史

---

## 💡 推荐阅读顺序

**对于开发者**:
1. [项目主页](../README.md) - 了解基本功能
2. [完整使用指南](guides/USER_GUIDE.md) - 掌握所有命令
3. [代码质量评分](references/MAINTAINABILITY_GUIDE.md) - 理解质量评估

**对于团队Leader**:
1. [项目主页](../README.md) - 了解基本功能
2. [绩效评分指南](guides/PERFORMANCE_SCORING_GUIDE.md) - 学习科学打分 ⭐
3. [完整使用指南](guides/USER_GUIDE.md) - 掌握进阶用法

---

## 📞 获取帮助

- 📖 查阅相关文档
- 🐛 提交问题: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 讨论交流: [Discussions](https://github.com/your-repo/discussions)

---

**最后更新**: 2026年2月27日
