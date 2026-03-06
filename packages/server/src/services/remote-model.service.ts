import axios from 'axios';

interface RemoteModel {
  id: string;
  name: string;
  description: string;
  tags: string[];
  pulls: number;
  updated: string;
  versions?: ModelVersion[];
}

interface ModelVersion {
  id: string;
  name: string;
  size: string;
  parameters: string;
  quantization: string;
}

interface RemoteModelResponse {
  models: RemoteModel[];
  total: number;
  page: number;
  limit: number;
}

export class RemoteModelService {
  private client = axios.create({
    baseURL: 'https://ollama.com',
    timeout: 10000,
  });

  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private async fetchWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // 暂时禁用缓存，以便测试
    // const cached = this.cache.get(key);
    // const now = Date.now();

    // if (cached && now - cached.timestamp < this.CACHE_DURATION) {
    //   return cached.data;
    // }

    const data = await fetchFn();
    // this.cache.set(key, { data, timestamp: now });
    return data;
  }

  async getRemoteModels(query?: string, page: number = 1, limit: number = 20): Promise<RemoteModelResponse> {
    return this.fetchWithCache(`models_${query}_${page}_${limit}`, async () => {
      try {
        // 构建完整的URL，确保查询参数正确传递
        let url = '/search';
        const params = new URLSearchParams();
        if (query) {
          params.append('q', query);
        }
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        console.log(`Fetching remote models with URL: ${url}`);
        
        const response = await this.client.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        // 解析HTML内容，提取模型信息
        const models = this.parseModelsFromHtml(response.data);
        console.log(`Found ${models.length} models`);

        return {
          models,
          total: models.length,
          page,
          limit,
        };
      } catch (error) {
        console.error('Failed to fetch remote models:', error);
        throw new Error('Failed to fetch remote models');
      }
    });
  }

  async getRemoteModelDetail(id: string): Promise<RemoteModel> {
    return this.fetchWithCache(`model_${id}`, async () => {
      try {
        const response = await this.client.get(`/library/${id}`);
        return this.parseModelDetailFromHtml(response.data, id);
      } catch (error) {
        console.error(`Failed to fetch remote model detail for ${id}:`, error);
        throw new Error('Failed to fetch remote model detail');
      }
    });
  }

  private parseModelsFromHtml(html: string): RemoteModel[] {
    const models: RemoteModel[] = [];

    // 从HTML中提取模型信息
    // 解析实际的HTML结构
    const modelRegex = /<li[^>]*x-test-model[^>]*>([\s\S]*?)<\/li>/g;
    let match;

    while ((match = modelRegex.exec(html)) !== null) {
      const modelCard = match[1];
      
      const nameMatch = modelCard.match(/<span[^>]*x-test-search-response-title[^>]*>([^<]+)<\/span>/);
      const descriptionMatch = modelCard.match(/<p[^>]*class="max-w-lg break-words text-neutral-800 text-md[^>]*>([^<]+)<\/p>/);
      const tagsMatch = modelCard.match(/<span[^>]*x-test-capability[^>]*>([^<]+)<\/span>/g);
      const pullsMatch = modelCard.match(/<span[^>]*x-test-pull-count[^>]*>([^<]+)<\/span>/);
      const updatedMatch = modelCard.match(/<span[^>]*x-test-updated[^>]*>([^<]+)<\/span>/);

      if (nameMatch) {
        const name = nameMatch[1].trim();
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-.]/g, '');

        models.push({
          id,
          name,
          description: descriptionMatch ? descriptionMatch[1].trim() : '',
          tags: tagsMatch ? tagsMatch.map(tag => tag.replace(/<[^>]+>/g, '').trim()) : [],
          pulls: pullsMatch ? this.parsePulls(pullsMatch[1].replace(/,/g, '')) : 0,
          updated: updatedMatch ? updatedMatch[1].trim() : '',
        });
      }
    }

    return models;
  }

  private parseModelDetailFromHtml(html: string, id: string): RemoteModel {
    // 解析模型详情页面
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const descriptionMatch = html.match(/<div[^>]*class="description[^>]*>([\s\S]*?)<\/div>/);
    const tagsMatch = html.match(/<span[^>]*class="tag[^>]*>([^<]+)<\/span>/g);
    const pullsMatch = html.match(/(\d+(?:\.\d+)?)[KM]?\s*Pulls/);
    const updatedMatch = html.match(/Updated\s+([^<]+)/);

    return {
      id,
      name: nameMatch ? nameMatch[1].trim() : id,
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      tags: tagsMatch ? tagsMatch.map(tag => tag.replace(/<[^>]+>/g, '').trim()) : [],
      pulls: pullsMatch ? this.parsePulls(pullsMatch[1]) : 0,
      updated: updatedMatch ? updatedMatch[1].trim() : '',
      versions: [], // 这里需要根据实际HTML结构解析版本信息
    };
  }

  private parsePulls(pullsStr: string): number {
    const num = parseFloat(pullsStr);
    if (pullsStr.includes('K')) {
      return num * 1000;
    } else if (pullsStr.includes('M')) {
      return num * 1000000;
    }
    return num;
  }
}
