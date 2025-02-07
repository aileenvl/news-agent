'use client';

import { useState } from 'react';
import { Article } from '@/types';
import { generateSummary } from '@/lib/webai';
import { formatDistanceToNow } from 'date-fns';
import { ArrowTopRightOnSquareIcon, ChatBubbleLeftIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!article.content) return;

    // If we already have a summary, just toggle visibility
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }

    try {
      setLoading(true);
      const generatedSummary = await generateSummary(article.content, article.id);
      setSummary(generatedSummary);
      setShowSummary(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative hover:bg-gray-50 transition-colors duration-200 ease-in-out p-6 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start space-x-6">
        {/* Upvotes Column */}
        <div className="flex flex-col items-center space-y-1 pt-1">
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{article.upvotes || 0}</span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Source and Date */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            <span className="font-medium text-indigo-600">{article.source}</span>
            <span>•</span>
            <time dateTime={article.date}>
              {formatDistanceToNow(new Date(article.date), { addSuffix: true })}
            </time>
          </div>

          {/* Title and Link */}
          <div className="flex items-start justify-between">
            <h2 className="text-base font-semibold text-gray-900 pr-8">
              {article.title}
            </h2>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-gray-400 hover:text-gray-500"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            </a>
          </div>

          {/* Summary Button and Content */}
          <div className="mt-4">
            <button
              onClick={handleSummarize}
              disabled={loading}
              className={`inline-flex items-center space-x-2 text-sm ${
                loading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span>{loading ? 'Generating summary...' : summary ? (showSummary ? 'Hide summary' : 'Show summary') : 'Summarize'}</span>
            </button>

            {showSummary && summary && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                {summary}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
