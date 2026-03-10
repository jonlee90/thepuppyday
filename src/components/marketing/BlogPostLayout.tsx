'use client';

import { motion } from 'framer-motion';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { FAQAccordion } from '@/components/marketing/FAQAccordion';
import { RelatedPosts } from '@/components/marketing/RelatedPosts';
import type { BlogPostMeta } from '@/data/blog-posts';

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogPostLayoutProps {
  post: BlogPostMeta;
  children: React.ReactNode;
  faqItems?: FAQItem[];
  relatedPosts?: BlogPostMeta[];
  phone: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function BlogPostLayout({
  post,
  children,
  faqItems,
  relatedPosts,
  phone,
}: BlogPostLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]}
        />

        {/* Post Header */}
        <motion.header
          className="mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-[#434E54] mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
            <time dateTime={post.publishDate}>{formatDate(post.publishDate)}</time>
            <span aria-hidden="true" className="select-none">
              &middot;
            </span>
            <span>{post.author}</span>
            <span aria-hidden="true" className="select-none">
              &middot;
            </span>
            <span>{post.readTime}</span>
          </div>
        </motion.header>

        {/* Article Body */}
        <motion.article
          className="
            text-[#434E54] leading-relaxed space-y-4
            [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#434E54] [&_h2]:mt-8 [&_h2]:mb-4
            [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-[#434E54] [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:text-[#434E54] [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2
            [&_li]:text-[#434E54]
            [&_a]:text-[#C67C4E] [&_a]:underline-offset-2 [&_a:hover]:underline
            [&_strong]:font-semibold [&_strong]:text-[#434E54]
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#C67C4E] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#6B7280]
          "
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {children}
        </motion.article>

        {/* FAQ Section */}
        {faqItems && faqItems.length > 0 && (
          <motion.section
            className="mt-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            <h2 className="text-2xl font-semibold text-[#434E54] mb-6">
              Frequently Asked Questions
            </h2>
            <FAQAccordion items={faqItems} />
          </motion.section>
        )}
      </div>

      {/* CTA Section */}
      <CTABooking phone={phone} />

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <RelatedPosts posts={relatedPosts} />
        </div>
      )}
    </div>
  );
}
