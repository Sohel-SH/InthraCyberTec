import Image from "next/image";
import Link from "next/link";
import React from "react";

interface NewsCardProps {
    id?: number;
    image: string;
    category: string;
    title: string;
    date: string;
    readTime: string;
}

const NewsCard: React.FC<NewsCardProps> = ({
    id,
    image,
    category,
    title,
    date,
    readTime,
}) => {
    const href = id ? `/news/${id}` : undefined;
    const CardInner = (
        <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden sm:h-56">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category Tag */}
                <div className="mb-3 inline-block rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white dark:bg-gray-800">
                    {category}
                </div>

                {/* Title */}
                <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-6 text-gray-800 transition-colors duration-300 group-hover:text-brand-500 dark:text-white/90 dark:group-hover:text-brand-400">
                    {title}
                </h3>

                {/* Metadata */}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {date} · {readTime}
                </p>
            </div>
        </div>
    );

    return href ? (
        <Link href={href} className="block cursor-pointer">
            {CardInner}
        </Link>
    ) : (
        CardInner
    );
};

export default NewsCard;

