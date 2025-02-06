import { pipeline, Pipeline } from '@huggingface/transformers';

let summarizationPipeline: Pipeline | null = null;

export async function initTransformersSummarizer() {
  if (summarizationPipeline) return summarizationPipeline;

  console.log('Initializing transformers.js summarization model...');
  summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
  return summarizationPipeline;
}

export async function generateTransformersSummary(content: string): Promise<string> {
  const pipe = await initTransformersSummarizer();
  
  try {
    const result = await pipe(content, {
      max_length: 150,
      min_length: 40,
      truncation: true
    });
    
    return result[0].summary_text;
  } catch (error) {
    console.error('Error generating summary with transformers:', error);
    throw error;
  }
}
