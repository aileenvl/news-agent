import { useState, useEffect } from 'react';
import { Article } from '@/types';
import { OramaClient } from '@oramacloud/client';

interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

const client = new OramaClient({
  endpoint: 'https://cloud.orama.run/v1/indexes/ai-agent-mufnf3',
  api_key: process.env.NEXT_PUBLIC_ORAMA_API_KEY || ''
});

export function useSearch({ query = '', page = 1, limit = 10 }: SearchParams = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const searchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const searchTerm = query?.trim() || '';
        const offset = (page - 1) * limit;

        console.log('Search params:', { searchTerm, page, limit, offset });

        const result = await client.search({
          term: searchTerm,
          limit,
          offset,
          mode: 'fulltext' as const
        });

        console.log('Search result:', result);
        
        if (!result || !Array.isArray(result.hits)) {
          throw new Error('Invalid response format from search');
        }

        const articles = result.hits.map(hit => hit.document as Article);
        const total = typeof result.count === 'number' ? result.count : 0;

        console.log('Processed results:', { 
          articlesCount: articles.length, 
          total,
          totalPages: Math.ceil(total / limit)
        });

        setArticles(articles);
        setTotalCount(total);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search articles. Please try again.');
        setTotalCount(0);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchArticles, 300);
    return () => clearTimeout(timeoutId);
  }, [query, page, limit]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    articles,
    loading,
    error,
    totalCount,
    currentPage: page,
    totalPages
  };
}
