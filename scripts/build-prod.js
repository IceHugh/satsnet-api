#!/usr/bin/env node

/**
 * SatsNet API 生产构建脚本
 * 支持代码压缩、混淆和多种格式输出
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { minify } from 'terser';

class ProductionBuilder {
  constructor() {
    this.distDir = 'dist';
    this.srcDir = 'src';
    this.entryFile = 'src/index.ts';
    this.startTime = Date.now();
  }

  /**
   * 清理旧的构建文件
   */
  clean() {
    console.log('🧹 清理旧的构建文件...');
    try {
      execSync('rm -rf dist', { stdio: 'inherit' });
      console.log('✅ 清理完成');
    } catch (error) {
      console.log('✅ 目录已清理（或不存在）');
    }
  }

  /**
   * 确保构建目录存在
   */
  ensureDistDir() {
    if (!existsSync(this.distDir)) {
      mkdirSync(this.distDir, { recursive: true });
    }
  }

  /**
   * 构建 ESM 格式
   */
  async buildESM() {
    console.log('📦 构建 ESM 格式...');

    try {
      // 使用 Bun 构建 ESM
      execSync('bun build src/index.ts --outdir dist --target node --format esm --splitting', {
        stdio: 'inherit',
      });

      // 生成 TypeScript 声明文件
      execSync('tsc --project tsconfig.build.json && tsc-alias -p tsconfig.build.json', {
        stdio: 'inherit',
      });

      console.log('✅ ESM 构建完成');
    } catch (error) {
      throw new Error(`ESM 构建失败: ${error.message}`);
    }
  }

  /**
   * 构建 CommonJS 格式
   */
  async buildCJS() {
    console.log('📦 构建 CommonJS 格式...');

    try {
      execSync(
        'bun build src/index.ts --outdir dist --target node --format cjs --outfile index.cjs',
        {
          stdio: 'inherit',
        }
      );

      console.log('✅ CommonJS 构建完成');
    } catch (error) {
      throw new Error(`CommonJS 构建失败: ${error.message}`);
    }
  }

  /**
   * 压缩文件
   */
  async minifyFile(inputFile, outputFile, format = 'esm') {
    console.log(`🗜️  压缩 ${basename(inputFile)}...`);

    try {
      const inputCode = readFileSync(inputFile, 'utf8');

      // 压缩配置
      const options = {
        compress: {
          drop_console: true,
          drop_debugger: true,
          dead_code: true,
          unused: true,
          hoist_funs: true,
          hoist_vars: true,
          reduce_funcs: true,
          reduce_vars: true,
          sequences: true,
          conditionals: true,
          comparisons: true,
          evaluate: true,
          booleans: true,
          loops: true,
          if_return: true,
          join_vars: true,
          collapse_vars: true,
          string_interop: true,
          typeofs: true,
          passes: 2,
          unsafe: false,
        },
        mangle: {
          toplevel: false,
          eval: false,
          keep_fnames: false,
          keep_classnames: false,
          reserved: [],
        },
        format: {
          comments: false,
          ecma: 2022,
          quote_style: 1,
          wrap_func_args: false,
        },
        sourceMap: {
          filename: basename(outputFile),
          url: basename(outputFile) + '.map',
        },
      };

      const result = await minify(inputCode, options);

      // 写入压缩后的代码
      writeFileSync(outputFile, result.code);

      // 写入 source map
      if (result.map) {
        const mapFile = `${outputFile}.map`;
        writeFileSync(mapFile, result.map);
        console.log(`📋 Source map 已生成: ${mapFile}`);
      }

      // 计算压缩率
      const originalSize = Buffer.byteLength(inputCode, 'utf8');
      const minifiedSize = Buffer.byteLength(result.code, 'utf8');
      const reduction = (((originalSize - minifiedSize) / originalSize) * 100).toFixed(2);

      console.log(`✅ 压缩完成: ${originalSize}B → ${minifiedSize}B (减少 ${reduction}%)`);

      return {
        originalSize,
        minifiedSize,
        reduction: Number.parseFloat(reduction),
      };
    } catch (error) {
      throw new Error(`压缩失败: ${error.message}`);
    }
  }

  /**
   * 生成构建信息
   */
  generateBuildInfo(buildResults) {
    const buildInfo = {
      buildTime: new Date().toISOString(),
      buildDuration: Date.now() - this.startTime,
      version: this.getPackageVersion(),
      nodeVersion: process.version,
      files: buildResults,
      totalSize: {
        original: buildResults.reduce((sum, r) => sum + r.originalSize, 0),
        minified: buildResults.reduce((sum, r) => sum + r.minifiedSize, 0),
        reduction: 0,
      },
    };

    buildInfo.totalSize.reduction = (
      ((buildInfo.totalSize.original - buildInfo.totalSize.minified) /
        buildInfo.totalSize.original) *
      100
    ).toFixed(2);

    writeFileSync(join(this.distDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

    console.log('📊 构建信息已保存到: build-info.json');
  }

  /**
   * 获取包版本
   */
  getPackageVersion() {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 生成许可证文件
   */
  copyLicense() {
    if (existsSync('LICENSE')) {
      const license = readFileSync('LICENSE', 'utf8');
      writeFileSync(join(this.distDir, 'LICENSE'), license);
      console.log('📄 许可证文件已复制');
    }
  }

  /**
   * 生成 README
   */
  copyReadme() {
    if (existsSync('README.md')) {
      const readme = readFileSync('README.md', 'utf8');
      writeFileSync(join(this.distDir, 'README.md'), readme);
      console.log('📖 README 文件已复制');
    }
  }

  /**
   * 验证构建结果
   */
  async validateBuild() {
    console.log('🔍 验证构建结果...');

    const requiredFiles = ['index.js', 'index.cjs', 'index.min.js', 'index.min.cjs', 'index.d.ts'];

    const missingFiles = [];
    for (const file of requiredFiles) {
      if (!existsSync(join(this.distDir, file))) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`缺少必需的构建文件: ${missingFiles.join(', ')}`);
    }

    console.log('✅ 构建验证通过');
  }

  /**
   * 显示构建摘要
   */
  printSummary(buildResults) {
    const duration = Date.now() - this.startTime;
    const totalOriginal = buildResults.reduce((sum, r) => sum + r.originalSize, 0);
    const totalMinified = buildResults.reduce((sum, r) => sum + r.minifiedSize, 0);
    const totalReduction = (((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(2);

    console.log('\n🎉 构建完成！\n');
    console.log('📊 构建摘要:');
    console.log(`   ⏱️  构建时间: ${(duration / 1000).toFixed(2)}s`);
    console.log(
      `   📦 总大小: ${(totalOriginal / 1024).toFixed(2)}KB → ${(totalMinified / 1024).toFixed(2)}KB`
    );
    console.log(`   📉 压缩率: ${totalReduction}%`);
    console.log('\n📁 生成文件:');

    buildResults.forEach((result, index) => {
      const file = ['index.min.js', 'index.min.cjs'][index];
      console.log(`   ✅ ${file}: ${(result.minifiedSize / 1024).toFixed(2)}KB`);
    });

    console.log('\n🔧 可用命令:');
    console.log('   bun test              - 运行测试');
    console.log('   bun start             - 启动开发服务器');
    console.log('   npm publish          - 发布到 npm');
  }

  /**
   * 主构建流程
   */
  async build() {
    try {
      console.log('🚀 开始生产构建...\n');

      // 1. 清理
      this.clean();
      this.ensureDistDir();

      // 2. 构建 ESM
      await this.buildESM();

      // 3. 构建 CommonJS
      await this.buildCJS();

      // 4. 压缩文件
      console.log('\n🗜️  开始代码压缩和混淆...\n');

      const buildResults = [];

      // 压缩 ESM
      const esmResult = await this.minifyFile(
        join(this.distDir, 'index.js'),
        join(this.distDir, 'index.min.js'),
        'esm'
      );
      buildResults.push(esmResult);

      // 压缩 CommonJS
      const cjsResult = await this.minifyFile(
        join(this.distDir, 'index.cjs'),
        join(this.distDir, 'index.min.cjs'),
        'cjs'
      );
      buildResults.push(cjsResult);

      // 5. 复制元文件
      this.copyLicense();
      this.copyReadme();

      // 6. 生成构建信息
      this.generateBuildInfo(buildResults);

      // 7. 验证构建
      await this.validateBuild();

      // 8. 显示摘要
      this.printSummary(buildResults);

      console.log('\n✨ 生产构建完成！可以发布了。');
    } catch (error) {
      console.error('\n❌ 构建失败:', error.message);
      process.exit(1);
    }
  }
}

// 运行构建
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new ProductionBuilder();
  builder.build().catch(console.error);
}

export { ProductionBuilder };
