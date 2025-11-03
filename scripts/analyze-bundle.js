#!/usr/bin/env node

/**
 * 包大小分析脚本
 * 用于分析构建结果的包大小和依赖关系
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { brotliCompressSync, gzipSync } from 'zlib';

class BundleAnalyzer {
  constructor() {
    this.distDir = 'dist';
    this.analysis = {
      files: {},
      totalSize: 0,
      totalGzipSize: 0,
      totalBrotliSize: 0,
      compressionRatio: {},
      dependencies: {},
      buildInfo: null,
    };
  }

  /**
   * 读取构建信息
   */
  readBuildInfo() {
    const buildInfoPath = join(this.distDir, 'build-info.json');
    if (existsSync(buildInfoPath)) {
      try {
        this.analysis.buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf8'));
        console.log('📋 已读取构建信息');
      } catch (error) {
        console.warn('⚠️  无法读取构建信息');
      }
    }
  }

  /**
   * 计算文件大小
   */
  calculateFileSize(filePath) {
    const content = readFileSync(filePath);
    const size = content.length;

    // 计算 gzip 压缩大小
    const gzipSize = gzipSync(content).length;

    // 计算 Brotli 压缩大小
    const brotliSize = brotliCompressSync(content).length;

    return { size, gzipSize, brotliSize };
  }

  /**
   * 分析文件
   */
  analyzeFile(filePath) {
    const fileName = basename(filePath);
    const stats = statSync(filePath);
    const { size, gzipSize, brotliSize } = this.calculateFileSize(filePath);

    const fileAnalysis = {
      path: filePath,
      fileName,
      size,
      sizeFormatted: this.formatBytes(size),
      gzipSize,
      gzipSizeFormatted: this.formatBytes(gzipSize),
      brotliSize,
      brotliSizeFormatted: this.formatBytes(brotliSize),
      gzipReduction: (((size - gzipSize) / size) * 100).toFixed(2),
      brotliReduction: (((size - brotliSize) / size) * 100).toFixed(2),
      lastModified: stats.mtime,
      extension: extname(filePath),
    };

    this.analysis.files[fileName] = fileAnalysis;
    this.analysis.totalSize += size;
    this.analysis.totalGzipSize += gzipSize;
    this.analysis.totalBrotliSize += brotliSize;

    return fileAnalysis;
  }

  /**
   * 分析构建目录
   */
  analyzeDirectory() {
    console.log('🔍 分析构建目录...');

    if (!existsSync(this.distDir)) {
      throw new Error(`构建目录不存在: ${this.distDir}`);
    }

    const files = readdirSync(this.distDir);
    const jsFiles = files.filter(
      (file) => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')
    );

    if (jsFiles.length === 0) {
      throw new Error('未找到 JavaScript 构建文件');
    }

    jsFiles.forEach((file) => {
      const filePath = join(this.distDir, file);
      this.analyzeFile(filePath);
    });

    // 计算总体压缩比
    this.analysis.compressionRatio = {
      gzip: (
        ((this.analysis.totalSize - this.analysis.totalGzipSize) / this.analysis.totalSize) *
        100
      ).toFixed(2),
      brotli: (
        ((this.analysis.totalSize - this.analysis.totalBrotliSize) / this.analysis.totalSize) *
        100
      ).toFixed(2),
    };

    console.log('✅ 文件分析完成');
  }

  /**
   * 分析依赖关系
   */
  analyzeDependencies() {
    console.log('🔗 分析依赖关系...');

    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      this.analysis.dependencies = {
        production: packageJson.dependencies || {},
        development: packageJson.devDependencies || {},
        total:
          Object.keys(packageJson.dependencies || {}).length +
          Object.keys(packageJson.devDependencies || {}).length,
      };
      console.log('✅ 依赖关系分析完成');
    } catch (error) {
      console.warn('⚠️  无法读取 package.json');
    }
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Number.parseFloat((bytes / k ** i).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📊 包大小分析报告\n');

    // 基本信息
    if (this.analysis.buildInfo) {
      console.log('📋 构建信息:');
      console.log(`   🕐 构建时间: ${this.analysis.buildInfo.buildTime}`);
      console.log(`   ⏱️  构建耗时: ${this.analysis.buildInfo.buildDuration}ms`);
      console.log(`   📦 版本: ${this.analysis.buildInfo.version}\n`);
    }

    // 文件大小分析
    console.log('📁 文件大小分析:');
    Object.values(this.analysis.files).forEach((file) => {
      console.log(`   📄 ${file.fileName}:`);
      console.log(`      📊 原始大小: ${file.sizeFormatted}`);
      console.log(`      📦 Gzip 大小: ${file.gzipSizeFormatted} (压缩 ${file.gzipReduction}%)`);
      console.log(
        `      🗜️  Brotli 大小: ${file.brotliSizeFormatted} (压缩 ${file.brotliReduction}%)`
      );
    });

    // 总体统计
    console.log('\n📈 总体统计:');
    console.log(`   📊 总原始大小: ${this.formatBytes(this.analysis.totalSize)}`);
    console.log(
      `   📦 Gzip 总大小: ${this.formatBytes(this.analysis.totalGzipSize)} (压缩 ${this.analysis.compressionRatio.gzip}%)`
    );
    console.log(
      `   🗜️  Brotli 总大小: ${this.formatBytes(this.analysis.totalBrotliSize)} (压缩 ${this.analysis.compressionRatio.brotli}%)\n`
    );

    // 依赖分析
    if (this.analysis.dependencies.total > 0) {
      console.log('🔗 依赖分析:');
      console.log(`   📦 生产依赖: ${Object.keys(this.analysis.dependencies.production).length}`);
      console.log(`   🛠️  开发依赖: ${Object.keys(this.analysis.dependencies.development).length}`);
      console.log(`   📊 总依赖数: ${this.analysis.dependencies.total}\n`);
    }

    // 性能建议
    this.generateRecommendations();
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    console.log('💡 优化建议:');

    const totalSizeKB = this.analysis.totalSize / 1024;

    if (totalSizeKB > 100) {
      console.log('   ⚠️  包大小较大，建议考虑以下优化:');
      console.log('      • 使用 tree-shaking 减少未使用代码');
      console.log('      • 考虑代码分割 (code splitting)');
      console.log('      • 评估依赖的必要性');
    } else if (totalSizeKB > 50) {
      console.log('   ✅ 包大小适中，可进一步优化:');
      console.log('      • 检查是否有重复的依赖');
      console.log('      • 考虑使用更轻量的替代库');
    } else {
      console.log('   ✅ 包大小优秀！');
    }

    const gzipReduction = Number.parseFloat(this.analysis.compressionRatio.gzip);
    if (gzipReduction < 60) {
      console.log('   🔍 Gzip 压缩率较低，可能需要检查代码重复');
    } else if (gzipReduction > 80) {
      console.log('   🎉 Gzip 压缩效果很好！');
    }

    console.log('\n🌐 网络传输建议:');
    console.log(`   📦 使用 Gzip 传输可节省 ${this.analysis.compressionRatio.gzip}% 带宽`);
    console.log(`   🗜️  使用 Brotli 传输可节省 ${this.analysis.compressionRatio.brotli}% 带宽`);
  }

  /**
   * 保存分析结果
   */
  saveAnalysis() {
    const analysisData = {
      ...this.analysis,
      analysisTime: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    const outputPath = join(this.distDir, 'bundle-analysis.json');
    writeFileSync(outputPath, JSON.stringify(analysisData, null, 2));

    console.log(`\n💾 分析结果已保存到: ${outputPath}`);
  }

  /**
   * 主分析流程
   */
  async analyze() {
    try {
      console.log('🔍 开始包大小分析...\n');

      // 读取构建信息
      this.readBuildInfo();

      // 分析文件大小
      this.analyzeDirectory();

      // 分析依赖关系
      this.analyzeDependencies();

      // 生成报告
      this.generateReport();

      // 保存分析结果
      this.saveAnalysis();

      console.log('\n✨ 分析完成！');
    } catch (error) {
      console.error('\n❌ 分析失败:', error.message);
      process.exit(1);
    }
  }
}

// 运行分析
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

export { BundleAnalyzer };
