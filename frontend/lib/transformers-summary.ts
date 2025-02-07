import { pipeline, Pipeline } from '@huggingface/transformers';
import { getCachedSummary, setCachedSummary } from './cache';

let summarizationPipeline: Pipeline | null = null;

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
    const result = await pipe(`please summarize this article: ${content}`);
    const summary = result[0].summary_text;
    
    // Cache the result
    setCachedSummary(articleId, summary);
    
    return summary;
  } catch (error) {
    console.error('Error generating summary with transformers:', error);
    throw error;
  }
}
