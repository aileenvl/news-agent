import { NextResponse } from 'next/server';
import { generateTransformersSummary } from '@/lib/transformers-summary';

export async function POST(request: Request) {
  try {
    const { content, articleId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const summary = await generateTransformersSummary(content, articleId || 'temp-id');

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
