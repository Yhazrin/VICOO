/**
 * 天气查询工具
 * 示例：展示如何添加自定义工具
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 获取天气信息
 * 注意：这是一个示例，实际需要调用真实的天气 API
 */
export const getWeather = tool(
  async ({ location }: { location: string }) => {
    // 这里可以替换为真实的天气 API 调用
    // 例如使用 OpenWeatherMap, WeatherAPI 等

    // 示例返回值
    const weatherData = {
      location,
      temperature: 24,
      condition: 'sunny',
      humidity: 65,
      wind: '10 km/h'
    };

    return JSON.stringify(weatherData);
  },
  {
    name: 'get_weather',
    description: '获取指定城市的天气信息。当用户询问某个地方的天气或气温时使用。',
    schema: z.object({
      location: z.string().describe('城市名称，格式为"城市, 国家"，例如 "San Francisco, US" 或 "北京, 中国"'),
    }),
  }
);

// 导出所有自定义工具
export const customTools = [getWeather];

export default {
  getWeather,
  customTools
};
