#!/usr/bin/env node

/**
 * 快速测试可维护性和可扩展性分析功能
 */

const { comprehensiveQualityAnalysis } = require('./core/maintainability');
const path = require('path');

console.log('\n🔍 测试可维护性和可扩展性分析功能\n');

// 测试当前项目的几个核心文件
const testFiles = [
  path.join(__dirname, 'core/maintainability.js'),
  path.join(__dirname, 'core/complexity.js'),
  path.join(__dirname, 'core/ast.js'),
  path.join(__dirname, 'core/score.js')
];

console.log('📁 分析文件:');
testFiles.forEach(file => console.log(`   - ${path.basename(file)}`));

console.log('\n⏳ 正在分析...\n');

const result = comprehensiveQualityAnalysis(testFiles);

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 可维护性分析结果:\n');
console.log(`   总得分: ${result.maintainability.score}/100 (${result.maintainability.level})`);
console.log(`   注释率: ${result.maintainability.avgCommentRatio}%`);
console.log(`   平均函数长度: ${result.maintainability.avgFunctionLength} 行`);
console.log(`   最大函数长度: ${result.maintainability.maxFunctionLength} 行`);
console.log(`   平均嵌套深度: ${result.maintainability.avgNestingDepth}`);
console.log(`   命名质量: ${result.maintainability.avgNamingQuality}%`);
console.log(`   魔法数字: ${result.maintainability.totalMagicNumbers} 个`);
console.log(`   TODO 注释: ${result.maintainability.totalTodoComments} 个`);

console.log('\n🚀 可扩展性分析结果:\n');
console.log(`   总得分: ${result.extensibility.score}/100 (${result.extensibility.level})`);
console.log(`   接口数: ${result.extensibility.totalInterfaces}`);
console.log(`   抽象类: ${result.extensibility.totalAbstractClasses}`);
console.log(`   类型定义: ${result.extensibility.totalTypeDefinitions}`);
console.log(`   泛型使用: ${result.extensibility.totalGenerics}`);
console.log(`   模块化程度: ${result.extensibility.avgModularity}`);
console.log(`   抽象化比例: ${result.extensibility.avgAbstractionRatio}%`);
console.log(`   开闭原则得分: ${result.extensibility.avgOcpScore}/100`);

console.log('\n🎨 设计模式使用:');
Object.entries(result.extensibility.designPatterns).forEach(([pattern, count]) => {
  if (count > 0) {
    console.log(`   - ${pattern}: ${count} 次`);
  }
});

console.log('\n💯 综合质量:\n');
console.log(`   综合得分: ${result.overall.score}/100 (${result.overall.level})`);
console.log(`   - 可维护性占 60%: ${Math.round(result.maintainability.score * 0.6)}`);
console.log(`   - 可扩展性占 40%: ${Math.round(result.extensibility.score * 0.4)}`);

console.log('\n═══════════════════════════════════════════════════════\n');

// 给出建议
console.log('💡 改进建议:\n');

if (result.maintainability.avgCommentRatio < 10) {
  console.log('   ⚠️  注释率偏低，建议增加代码注释和文档');
}

if (result.maintainability.avgFunctionLength > 50) {
  console.log('   ⚠️  函数平均长度较大，建议拆分为更小的函数');
}

if (result.maintainability.avgNestingDepth > 4) {
  console.log('   ⚠️  嵌套深度较深，建议优化代码结构');
}

if (result.extensibility.totalInterfaces === 0) {
  console.log('   💡 考虑使用 TypeScript 接口提高代码可扩展性');
}

if (result.extensibility.totalPatterns < 3) {
  console.log('   💡 考虑应用合适的设计模式提高代码质量');
}

if (result.overall.score >= 90) {
  console.log('   ✨ 代码质量优秀！保持这个水平！');
} else if (result.overall.score >= 75) {
  console.log('   ✅ 代码质量良好，继续优化可以更好！');
} else if (result.overall.score >= 60) {
  console.log('   📈 代码质量中等，还有提升空间');
} else {
  console.log('   🎯 代码质量需要改进，建议参考上述建议');
}

console.log('\n✅ 测试完成！\n');
