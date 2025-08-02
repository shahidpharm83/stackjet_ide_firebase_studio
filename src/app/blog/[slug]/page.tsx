
import { getBlogPost } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-8">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to all posts
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-muted-foreground text-lg mb-4">{post.description}</p>
      <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
        <span>{post.author}</span>
        <span>&middot;</span>
        <span>{post.date}</span>
      </div>
      <Image
        src={post.imageUrl}
        alt={post.title}
        width={1200}
        height={675}
        className="w-full h-auto rounded-lg mb-8"
        data-ai-hint="blog post image"
      />
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
