import { useState } from 'react';
import { useSearch } from '../hooks/useSearch';

interface SearchProps {
  initialQuery?: string;
}

const SOURCE_TYPES = [
  { id: 'hackernews', name: 'Hacker News', color: 'orange' },
  { id: 'huggingface', name: 'Hugging Face', color: 'yellow' }
];

export function Search({ initialQuery = '' }: SearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [limit, setLimit] = useState(10);

  const { 
    articles, 
    loading, 
    error, 
    totalCount, 
    currentPage, 
    totalPages,
    facets 
  } = useSearch({
    query,
    page,
    limit,
    facets: {
      category: {
        order: 'DESC',
        limit: 10,
        offset: 0
      }
    },
    sources: selectedSources
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources(prev => {
      const isSelected = prev.includes(sourceId);
      if (isSelected) {
        return prev.filter(id => id !== sourceId);
      } else {
        return [...prev, sourceId];
      }
    });
    setPage(1); // Reset to first page when sources change
  };

  const handleFacetClick = (facet: string, value: string) => {
    setSelectedFacets(prev => {
      const current = prev[facet] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [facet]: updated
      };
    });
    setPage(1); // Reset to first page when facets change
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | null = null;

    // Handle special cases
    if (totalPages <= 1) return [1];

    // Build the range array
    range.push(1);
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add dots between numbers
    for (let i of range) {
      if (l !== null) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const getSourcePillColor = (sourceId: string) => {
    const source = SOURCE_TYPES.find(s => s.id === sourceId);
    return source?.color || 'gray';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Source Type Pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SOURCE_TYPES.map((source) => (
          <button
            key={source.id}
            onClick={() => handleSourceToggle(source.id)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedSources.includes(source.id)
                ? `bg-${source.color}-100 text-${source.color}-800 ring-2 ring-${source.color}-500`
                : `bg-${source.color}-50 text-${source.color}-600 hover:bg-${source.color}-100`
            }`}
          >
            {source.name}
            {selectedSources.includes(source.id) && (
              <span className="ml-2 text-${source.color}-600">×</span>
            )}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search articles..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-red-600">{error}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Facets Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <h2 className="font-semibold text-lg mb-4">Categories</h2>
          {facets?.category && (
            <div className="space-y-2">
              {Object.entries(facets.category.values).map(([value, count]: [string, number]) => (
                <button
                  key={value}
                  onClick={() => handleFacetClick('category', value)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedFacets.category?.includes(value)
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span>{value}</span>
                  <span className="text-gray-500 text-xs">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {totalCount === 0 ? 'No results found' : 
                `Showing ${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, totalCount)} of ${totalCount} results`
              }
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select 
                className="border rounded-md text-sm px-2 py-1"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Articles List */}
          <div className="space-y-6">
            {articles.map((article) => (
              <article key={article.id} className="p-6 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  {article.source && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getSourcePillColor(article.source)}-100 text-${getSourcePillColor(article.source)}-800`}>
                      {SOURCE_TYPES.find(s => s.id === article.source)?.name || article.source}
                    </span>
                  )}
                  {article.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {article.category}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{new Date(article.date).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-600">{article.content.substring(0, 200)}...</p>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => setPage(Number(pageNum))}
                        className={`px-3 py-1 rounded-md border ${
                          currentPage === pageNum
                            ? 'bg-blue-50 text-blue-600 border-blue-500'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>

              {/* Mobile Pagination Info */}
              <div className="mt-3 text-center text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}

          {/* No Results */}
          {articles.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No articles found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
