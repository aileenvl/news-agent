import type { NextApiRequest, NextApiResponse } from 'next';
import { Article } from '@/types';

// Sample data for testing pagination
const sampleArticles: Article[] = Array.from({ length: 50 }, (_, i) => ({
  id: `article-${i + 1}`,
  title: `Article ${i + 1}`,
  content: `This is the content for article ${i + 1}. It contains some sample text to demonstrate the search functionality.`,
  url: `https://example.com/article-${i + 1}`,
  date: new Date(2024, 0, i + 1).toISOString(),
  source: 'Sample Source',
  category: ['Technology', 'Science', 'Business', 'Health'][Math.floor(Math.random() * 4)],
  upvotes: Math.floor(Math.random() * 100)
}));

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Filter articles based on search query
  let filteredArticles = sampleArticles;
  if (query) {
    const searchTerm = (query as string).toLowerCase();
    filteredArticles = sampleArticles.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.content.toLowerCase().includes(searchTerm)
    );
  }

  // Calculate facets
  const categories = filteredArticles.reduce((acc, article) => {
    if (article.category) {
      acc[article.category] = (acc[article.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Paginate results
  const paginatedArticles = filteredArticles.slice(offset, offset + limitNum);

  res.status(200).json({
    hits: paginatedArticles.map(article => ({ document: article })),
    total: filteredArticles.length,
    facets: {
      category: {
        count: Object.keys(categories).length,
        values: categories
      }
    }
  });
}
