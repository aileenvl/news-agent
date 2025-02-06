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
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }

    setLoading(true);
    try {
      const generatedSummary = await generateSummary(article.content);
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

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors duration-200">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {article.title}
            </a>
          </h2>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={handleSummarize}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
              {loading ? 'Summarizing...' : showSummary ? 'Hide Summary' : 'Summarize'}
            </button>
            
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
              Read Article
            </a>
          </div>

          {/* Summary */}
          {showSummary && summary && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
