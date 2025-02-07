import { useState } from 'react';
import { Article } from '@/types';
import { ArticleCard } from './ArticleCard';
import { useSearch } from '@/hooks/useSearch';

const SOURCE_TYPES = [
  { id: 'hackernews', name: 'Hacker News', color: 'orange' },
  { id: 'huggingface', name: 'Hugging Face', color: 'yellow' }
];

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
}

export function ArticleList({ articles, loading }: ArticleListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-start space-x-6">
              {/* Upvote Skeleton */}
              <div className="flex flex-col items-center space-y-1 pt-1">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 w-4 bg-gray-200 rounded" />
              </div>

              <div className="flex-1">
                {/* Title Skeleton */}
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />

                {/* Meta Info Skeleton */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-4 bg-gray-200 rounded-full" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>

                {/* Actions Skeleton */}
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search query.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
