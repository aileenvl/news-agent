import { useState, useEffect } from 'react';
import { Article } from '@/types';
import { OramaClient } from '@oramacloud/client';

interface FacetConfig {
  order?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

interface FacetValue {
  values: Record<string, number>;
}

interface SearchFacets {
  category?: FacetValue;
}

interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  facets?: {
    category?: FacetConfig;
  };
  sources?: string[];
}

// Type guard to check if a document matches Article interface
function isArticle(doc: unknown): doc is Article {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    typeof (doc as any).id === 'string' &&
    typeof (doc as any).title === 'string' &&
    typeof (doc as any).url === 'string' &&
    typeof (doc as any).content === 'string' &&
    typeof (doc as any).date === 'string' &&
    typeof (doc as any).source === 'string'
  );
}

const client = new OramaClient({
  endpoint: 'https://cloud.orama.run/v1/indexes/ai-agent-mufnf3',
  api_key: process.env.NEXT_PUBLIC_ORAMA_API_KEY || ''
});

export function useSearch({ query = '', page = 1, limit = 10, facets = {}, sources = [] }: SearchParams = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [facetsResult, setFacets] = useState<SearchFacets | null>(null);

  useEffect(() => {
    const searchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const searchTerm = query?.trim() || '';
        const offset = (page - 1) * limit;

        console.log('Search params:', { searchTerm, page, limit, offset, facets, sources });

        const result = await client.search({
          term: searchTerm,
          limit: sources.length > 0 ? limit * 2 : limit,
          offset,
          mode: 'fulltext' as const,
          facets
        });

        console.log('Search result:', result);
        
        if (!result || !Array.isArray(result.hits)) {
          throw new Error('Invalid response format from search');
        }

        // Filter articles by source if sources are specified
        const validArticles = result.hits
          .map(hit => hit.document as unknown)
          .filter(isArticle);

        const articlesWithSourceFilter = validArticles
          .slice(0, sources.length > 0 ? limit * 2 : limit)
          .filter(article => sources.length === 0 || sources.includes(article.source));

        const articles = articlesWithSourceFilter.slice(0, limit);

        const total = typeof result.count === 'number' ? result.count : 0;

        // Set facets if available in the result
        if (result.facets) {
          setFacets(result.facets as SearchFacets);
        } else {
          setFacets(null);
        }

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
  }, [query, page, limit, facets, sources]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    articles,
    loading,
    error,
    totalCount,
    currentPage: page,
    totalPages,
    facets: facetsResult
  };
}
