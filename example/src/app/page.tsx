'use client';

import { useState } from 'react';

interface NameInfo {
  name?: string;
  address?: string;
  data?: string;
  timestamp?: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('请输入名称');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/getnames?name=${encodeURIComponent(name.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
      } else {
        setError(data.error || '查询失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">SatsNet API - getNames 测试</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              名称 (Name)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入要查询的名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '查询中...' : '查询名称信息'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">查询结果</h2>
            <div className="space-y-2">
              {result.name && (
                <div>
                  <span className="font-medium text-gray-700">名称:</span>
                  <span className="ml-2 text-gray-900">{result.name}</span>
                </div>
              )}
              {result.address && (
                <div>
                  <span className="font-medium text-gray-700">地址:</span>
                  <span className="ml-2 text-gray-900 break-all">{result.address}</span>
                </div>
              )}
              {result.data && (
                <div>
                  <span className="font-medium text-gray-700">数据:</span>
                  <span className="ml-2 text-gray-900 break-all">{result.data}</span>
                </div>
              )}
              {result.timestamp && (
                <div>
                  <span className="font-medium text-gray-700">时间戳:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
