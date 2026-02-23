/**
 * 网页内容解析辅助函数
 */

// 提取页面标题
export function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  
  return '';
}

// 解析 GitHub 页面内容
export function parseGitHubContent(html: string, url: string): string {
  let content = '';
  
  // 提取仓库描述
  const descMatch = html.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/i);
  if (descMatch) {
    content += `## 描述\n${descMatch[1].trim()}\n\n`;
  }
  
  // 提取 README 内容
  const readmeContent = parseReadmeContent(html);
  if (readmeContent) {
    content += `## README\n${readmeContent}\n`;
  }
  
  // 提取文件列表
  const fileMatches = html.matchAll(/<a[^>]*class="[^"]*js-navigation-open[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi);
  const files: string[] = [];
  for (const match of fileMatches) {
    files.push(match[2].trim());
  }
  if (files.length > 0) {
    content += `\n## 文件结构\n${files.slice(0, 20).join('\n')}`;
  }
  
  return content || html.slice(0, 2000);
}

// 解析 README 内容
export function parseReadmeContent(html: string): string {
  // 尝试找 README 的内容
  const readmeMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (readmeMatch) {
    return cleanHtml(readmeMatch[1]);
  }
  
  // 尝试找 main 或 default 分支的内容
  const mainMatch = html.match(/<div[^>]*id="readme"[^>]*>([\s\S]*?)<\/div>/i);
  if (mainMatch) {
    return cleanHtml(mainMatch[1]);
  }
  
  return '';
}

// 解析通用网页内容
export function parseGeneralContent(html: string): string {
  // 移除脚本和样式
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // 提取主要内容
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    content = mainMatch[1];
  } else {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content = bodyMatch[1];
    }
  }
  
  return cleanHtml(content);
}

// 清理 HTML 标签
export function cleanHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 10000);
}

// 解析搜索结果
export function parseSearchResults(html: string, limit: number): Array<{
  title: string;
  url: string;
  snippet: string;
}> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];
  
  // 匹配 DuckDuckGo 结果
  const resultMatches = html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi);
  
  for (const match of resultMatches) {
    if (results.length >= limit) break;
    
    const url = match[1].replace('/duckduckgo.com/l/?uddg=', '').split('&')[0];
    const title = match[2].trim();
    const snippet = cleanHtml(match[3]);
    
    if (title && url) {
      results.push({ title, url, snippet });
    }
  }
  
  // 如果上面没匹配到，尝试备用方案
  if (results.length === 0) {
    const simpleMatches = html.matchAll(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/gi);
    for (const match of simpleMatches) {
      if (results.length >= limit) break;
      const url = match[1];
      const title = match[2].trim();
      if (url.startsWith('http') && !url.includes('duckduckgo') && title) {
        results.push({ title, url, snippet: '' });
      }
    }
  }
  
  return results;
}
