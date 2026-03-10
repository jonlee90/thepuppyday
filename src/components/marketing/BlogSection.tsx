/**
 * Blog section — displays latest blog posts on the homepage
 * Matches marketing section patterns (SectionHeader, Framer Motion, white-on-cream cards)
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, Scissors, Heart, Sun, Baby, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { IconBox } from '@/components/ui/IconBox';
import { fadeInUp } from '@/components/marketing/animations';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  publishDate: string;
}

interface BlogSectionProps {
  posts: BlogPost[];
}

// Topic icon mapping — module-level constant (rendering-hoist-jsx)
const TOPIC_ICON_RULES: Array<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ['cost', 'pricing'], icon: DollarSign },
  { keywords: ['signs', 'health', 'teeth', 'hypoallergenic'], icon: Heart },
  { keywords: ['spring', 'summer'], icon: Sun },
  { keywords: ['first', 'puppy'], icon: Baby },
  { keywords: ['park', 'friendly'], icon: MapPin },
];

function getTopicIcon(slug: string): LucideIcon {
  for (const rule of TOPIC_ICON_RULES) {
    if (rule.keywords.some((kw) => slug.includes(kw))) {
      return rule.icon;
    }
  }
  return Scissors;
}

export function BlogSection({ posts }: BlogSectionProps) {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Dog Grooming Tips & Guides"
          subtitle="Expert advice from our grooming team to keep your pup looking and feeling their best."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => {
            const TopicIcon = getTopicIcon(post.slug);

            return (
              <motion.div
                key={post.slug}
                {...fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block bg-white rounded-2xl shadow-md p-6 h-full flex flex-col hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-[#C67C4E]/30 transition-all duration-200"
                >
                  {/* Top row: icon + read time */}
                  <div className="flex items-center justify-between mb-4">
                    <IconBox size="sm" rounded="lg">
                      <TopicIcon className="w-4 h-4 text-[#434E54]" />
                    </IconBox>
                    <span className="inline-flex items-center gap-1 bg-[#F8EEE5] text-[#C67C4E] px-2.5 py-1 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-[#434E54] group-hover:text-[#C67C4E] transition-colors duration-200 mb-2 leading-snug">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-[#6B7280] line-clamp-2 flex-1 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F0F0F0]">
                    <span className="text-xs text-[#6B7280]">{post.publishDate}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#C67C4E]">
                      Read more
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Posts link */}
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#434E54] hover:text-[#C67C4E] font-semibold transition-colors duration-200"
          >
            View All Posts
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
