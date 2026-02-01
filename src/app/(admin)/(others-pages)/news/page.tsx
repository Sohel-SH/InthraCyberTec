// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
"use client";
import React from "react";
import NewsCard from "@/components/news/NewsCard";
import { newsArticles } from "@/app/data/news";
import { useLanguage } from "@/context/LanguageContext";

export default function News() {
  const { t } = useLanguage();
  return (
    <div>
      {/* <PageBreadcrumb pageTitle="News" /> */}
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Page Title */}
        <h1 className="mb-8 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">{t("news.title")}</h1>

        {/* News Grid - Responsive 3 columns */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article) => (
            <NewsCard
              key={article.id}
              id={article.id}
              image={article.image}
              category={article.category}
              title={article.title}
              date={article.date}
              readTime={article.readTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

