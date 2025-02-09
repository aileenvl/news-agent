import { pipeline, SummarizationPipeline, SummarizationOutput, SummarizationSingle } from '@huggingface/transformers';
import { getCachedSummary, setCachedSummary } from './cache';

let summarizationPipeline: SummarizationPipeline | null = null;

export async function initTransformersSummarizer() {
  if (summarizationPipeline) return summarizationPipeline;

  console.log('Initializing transformers.js summarization model...');
  summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6');
  return summarizationPipeline;
}

export async function generateTransformersSummary(content: string, articleId: string): Promise<string> {
  // Check cache first
  const cachedSummary = getCachedSummary(articleId);
  if (cachedSummary) {
    console.log('Using cached summary for article:', articleId);
    return cachedSummary;
  }

  console.log('Generating new summary for article:', articleId);
  const pipe = await initTransformersSummarizer();
  
  try {
    // Truncate content if it's too long (model has a max input length)
    const truncatedContent = content.slice(0, 512);
    const result = await pipe(truncatedContent);
    
    let summary: string;
    if (Array.isArray(result)) {
      const firstResult = result[0] as SummarizationSingle;
      summary = firstResult.summary_text;
    } else {
      summary = (result as SummarizationSingle).summary_text;
    }
    
    if (!summary) {
      throw new Error('No summary generated');
    }
    
    // Cache the result
    setCachedSummary(articleId, summary);
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Failed to generate summary. Please try again.';
  }
}
