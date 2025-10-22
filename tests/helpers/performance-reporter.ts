/**
 * 性能测试报告工具
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
}

export class PerformanceReporter {
  private metrics: PerformanceMetric[] = [];

  /**
   * 记录性能指标
   */
  record(name: string, value: number, unit = 'ms'): void {
    this.metrics.push({ name, value, unit });
  }

  /**
   * 记录时间
   */
  recordTime(name: string, durationMs: number): void {
    this.record(name, durationMs, 'ms');
  }

  /**
   * 记录内存使用
   */
  recordMemory(name: string, memoryUsage: number): void {
    this.record(name, memoryUsage, 'bytes');
  }

  /**
   * 记录百分比
   */
  recordPercentage(name: string, percentage: number): void {
    this.record(name, percentage, '%');
  }

  /**
   * 记录计数
   */
  recordCount(name: string, count: number): void {
    this.record(name, count, 'count');
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 生成性能报告摘要
   */
  generateSummary(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics recorded';
    }

    return this.metrics.map((metric) => `${metric.name}: ${metric.value}${metric.unit}`).join(', ');
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * 格式化内存大小
   */
  static formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 格式化百分比
   */
  static formatPercentage(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`;
  }
}
