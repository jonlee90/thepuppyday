'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { BlogPostMeta } from '@/data/blog-posts';

interface RelatedPostsProps {
  posts: BlogPostMeta[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) {
    return null;
  }

  return (
    <section className="py-10">
      <h2 className="text-2xl font-semibold text-[#434E54] mb-6">You Might Also Like</h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {posts.map((post) => (
          <motion.div key={post.slug} variants={cardVariants}>
            <Link
              href={`/blog/${post.slug}`}
              className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-transparent hover:border-[#C67C4E] p-6 h-full"
            >
              <h3 className="font-semibold text-[#434E54] mb-2 leading-snug">{post.title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              <span className="text-xs text-[#C67C4E] font-medium">{post.readTime}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
