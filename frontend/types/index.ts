export interface Article {
  id: string;
  title: string;
  url: string;
  content: string;
  date: string;
  source: string;
  category?: string;
  upvotes?: number;
}
