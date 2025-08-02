
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlogPost } from '@/lib/data';

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Image
          src={post.imageUrl}
          alt={post.title}
          width={600}
          height={400}
          className="w-full h-auto rounded-t-lg object-cover"
          data-ai-hint="blog post summary"
        />
      </CardHeader>
      <CardContent className="flex-1">
        <CardTitle className="text-xl font-bold mb-2">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-3">{post.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          <span>{post.author}</span>
          <span className="mx-2">&middot;</span>
          <span>{post.date}</span>
        </div>
        <Link href={`/blog/${post.slug}`} passHref>
          <Button variant="outline" size="sm">
            Read More
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
