import { newsArticles } from "@/app/data/news";
import Image from "next/image";
import { Metadata } from "next";
import T from "@/components/i18n/T";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const idNum = Number(id);
  const article = newsArticles.find((a) => a.id === idNum);
  return {
    title: article ? `${article.title} | News` : "News Article",
    description: article ? article.content.slice(0, 140) : "News article details",
  };
}

export default async function NewsDetail({ params }: Props) {
  const { id } = await params;
  const idNum = Number(id);
  const article = newsArticles.find((a) => a.id === idNum);

  if (!article) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90"><T k="news.notFoundTitle" /></h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400"><T k="news.notFoundMessage" /></p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      {/* Hero Image */}
      <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl sm:h-72 lg:h-80">
        <Image src={article.image} alt={article.title} fill className="object-cover" />
      </div>

      {/* Article Header */}
      <div className="mb-4">
        <span className="mb-2 inline-block rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white dark:bg-gray-800">
          {article.category}
        </span>
        <h1 className="mt-3 text-2xl font-semibold leading-7 text-gray-800 dark:text-white/90 sm:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {article.date} · {article.readTime}
        </p>
      </div>

      {/* Article Content */}
      <div className="prose max-w-none dark:prose-invert dark:text-white/90">
        <p>{article.content}</p>
      </div>
    </div>
  );
}
