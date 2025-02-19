// Import types only for TypeScript
import { generateTransformersSummary } from './transformers-summary';

type LlmInference = any;

let llmInference: LlmInference | undefined;

export async function initLLM() {
  if (llmInference) return llmInference;

  console.log('Initializing WebAI model...');
  
  // Comment out MediaPipe for now due to type issues
  // const { FilesetResolver, LlmInference } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.8');
  // const genaiFileset = await FilesetResolver.forGenAiTasks(
  //   'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.8/wasm'
  // );

  // llmInference = await LlmInference.createFromOptions(genaiFileset, {
  //   baseOptions: {
  //     modelAssetPath: 'https://storage.googleapis.com/jmstore/WebAIDemos/models/Gemma2/gemma2-2b-it-gpu-int8.bin'
  //   },
  //   maxTokens: 1000,
  //   topK: 1,
  //   temperature: 0.01
  // });

  return llmInference;
}

export async function generateSummary(content: string, articleId: string): Promise<string> {
  // Use transformers.js for summarization instead of MediaPipe
  return generateTransformersSummary(content, articleId);

  /* WebAI implementation (kept for future use)
  const llm = await initLLM();
  
  const prompt = `Please provide a concise summary of the following text. Focus on the key points and main ideas:

${content}

Summary:`;

  return new Promise((resolve, reject) => {
    let summary = '';

    try {
      llm.generateResponse(prompt, (partialResponse: string, isComplete: boolean) => {
        summary += partialResponse;
        if (isComplete) {
          resolve(summary.trim());
        }
      });
    } catch (error) {
      console.error('Error generating summary with WebAI:', error);
      reject(error);
    }
  });
  */
}
