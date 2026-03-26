import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blogas — Mano Veikla",
  description:
    "Straipsniai apie individualią veiklą, mokesčius, IV vs MB palyginimą ir kitos naudingos žinios verslininkams Lietuvoje.",
  openGraph: {
    title: "Blogas — Mano Veikla",
    description:
      "Straipsniai apie individualią veiklą, mokesčius, IV vs MB palyginimą ir kitos naudingos žinios verslininkams Lietuvoje.",
    url: "https://manoveikla.lt/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Blogas</h1>
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b border-gray-200 pb-8">
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                {post.title}
              </h2>
              <time className="mt-1 block text-sm text-gray-500">
                {post.date}
              </time>
              <p className="mt-2 text-gray-600">{post.description}</p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
