import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Mano Veikla`,
    description: post.description,
    openGraph: {
      title: `${post.title} — Mano Veikla`,
      description: post.description,
      url: `https://manoveikla.lt/blog/${slug}`,
      type: "article",
    },
  };
}

function renderContent(content: string) {
  const paragraphs = content.split("\n\n").filter(Boolean);

  return paragraphs.map((block, i) => {
    const trimmed = block.trim();

    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="mt-10 mb-4 text-2xl font-bold">
          {trimmed.replace("## ", "")}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="mt-8 mb-3 text-xl font-semibold">
          {trimmed.replace("### ", "")}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
      return (
        <ul key={i} className="my-4 list-disc space-y-1 pl-6">
          {items.map((item, j) => (
            <li key={j}>{item.replace("- ", "")}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="my-4 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <time className="mt-2 block text-sm text-gray-500">{post.date}</time>
      </header>
      <div className="prose prose-lg max-w-none">{renderContent(post.content)}</div>
    </article>
  );
}
