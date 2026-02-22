/**
 * Testimonials section - Displays hardcoded Yelp reviews with groomed dog photos
 * Replaces unreliable Yelp widget embed with static review cards
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Lightbox } from '@/components/marketing/lightbox';

// Lightbox-compatible image shape (matches GalleryImage from @/types/database)
interface LightboxImage {
  id: string;
  image_url: string;
  caption: string | null;
  dog_name: string | null;
  breed: string | null;
}

interface ReviewImage {
  src: string;
  alt: string;
  dogName?: string;
}

interface YelpReview {
  id: string;
  reviewerName: string;
  reviewerInitial: string;
  rating: number;
  date: string;
  text: string;
  yelpUrl: string;
  images: ReviewImage[];
}

const reviews: YelpReview[] = [
  {
    id: 'review-1',
    reviewerName: 'Andrew U.',
    reviewerInitial: 'A',
    rating: 5,
    date: 'Jan 2025',
    text: 'Absolutely love The Puppy Day! They always take such great care of our pup and he comes back looking amazing every time. The staff is friendly and truly cares about the dogs.',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada?hrid=SN9TCG1lEH8kHJJJPv_9DA',
    images: [{ src: '/images/reviews-dog/review-1.jpg', alt: 'Groomed dog from Andrew U. review' }],
  },
  {
    id: 'review-2',
    reviewerName: 'Maria L.',
    reviewerInitial: 'M',
    rating: 5,
    date: 'Feb 2025',
    text: 'Best grooming experience in La Mirada! My dog was nervous at first but the groomers were so patient and gentle. The results speak for themselves — just look at how adorable he looks!',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [{ src: '/images/reviews-dog/review-2.jpg', alt: 'Groomed dog from Maria L. review' }],
  },
  {
    id: 'review-3',
    reviewerName: 'Jessica T.',
    reviewerInitial: 'J',
    rating: 5,
    date: 'Mar 2025',
    text: 'We bring both our dogs here and they always come out looking like little celebrities. The attention to detail is incredible and the prices are very fair for the quality of work.',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-3.jpg', alt: 'First groomed dog from Jessica T. review' },
      { src: '/images/reviews-dog/review-3-1.jpg', alt: 'Second groomed dog from Jessica T. review' },
    ],
  },
  {
    id: 'review-4',
    reviewerName: 'David K.',
    reviewerInitial: 'D',
    rating: 5,
    date: 'Apr 2025',
    text: 'Found this gem through a friend and now I won\'t go anywhere else. They really know how to handle different breeds and coat types. My poodle mix has never looked better!',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-4-1.jpg', alt: 'First groomed dog from David K. review' },
      { src: '/images/reviews-dog/review-4-2.jpg', alt: 'Second groomed dog from David K. review' },
    ],
  },
  {
    id: 'review-5',
    reviewerName: 'Sarah P.',
    reviewerInitial: 'S',
    rating: 5,
    date: 'May 2025',
    text: 'The Puppy Day is hands down the best groomer we\'ve ever been to. They treat every dog like their own and the facility is always clean and welcoming. Highly recommend to all pet parents!',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-5-1.jpg', alt: 'First groomed dog from Sarah P. review' },
      { src: '/images/reviews-dog/review-5-2.jpg', alt: 'Second groomed dog from Sarah P. review' },
    ],
  },
];

// Flatten all review images for lightbox navigation
const allLightboxImages: LightboxImage[] = reviews.flatMap((review) =>
  review.images.map((img) => ({
    id: `${review.id}-${img.src}`,
    image_url: img.src,
    caption: `Review by ${review.reviewerName}`,
    dog_name: img.dogName || null,
    breed: null,
  }))
);

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  index,
  onImageClick,
  lightboxStartIndex,
}: {
  review: YelpReview;
  index: number;
  onImageClick: (index: number) => void;
  lightboxStartIndex: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncateLength = 150;
  const needsTruncation = review.text.length > truncateLength;
  const displayText = expanded || !needsTruncation
    ? review.text
    : review.text.slice(0, truncateLength) + '...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F8EEE5] flex items-center justify-center text-[#434E54] font-semibold text-sm">
            {review.reviewerInitial}
          </div>
          <div>
            <p className="font-semibold text-[#434E54] text-sm">{review.reviewerName}</p>
            <p className="text-xs text-[#6B7280]">{review.date}</p>
          </div>
        </div>
        <a
          href={review.yelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D32323] hover:text-[#af1d1d] transition-colors"
          aria-label={`View ${review.reviewerName}'s review on Yelp`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.153 11.2c-.247-.394-.07-.746.395-.746h3.735c.465 0 .605.322.314.717l-1.86 2.527c-.29.395-.768.395-1.06 0l-1.524-2.498zm-1.14 3.547c-.14-.442.106-.743.547-.668l3.604.614c.44.075.56.406.267.737l-1.876 2.12c-.293.33-.744.255-.885-.186l-.657-2.617zm-2.13-.758c.43-.124.743.088.697.539l-.384 3.67c-.046.45-.373.597-.728.328l-2.276-1.724c-.355-.27-.32-.724.073-.848l2.618-.965zm-.467-2.817c.093-.44-.152-.697-.595-.573l-3.54 1c-.443.124-.533.48-.2.79l2.138 1.99c.333.312.746.218.84-.22l.357-2.987zm1.437-1.28c-.323.317-.715.235-.873-.183l-1.278-3.38c-.16-.417.01-.72.378-.678l2.974.345c.368.042.546.367.396.723l-1.597 3.173z" />
          </svg>
        </a>
      </div>

      {/* Stars */}
      <StarRating rating={review.rating} />

      {/* Review text */}
      <p className="text-[#434E54] text-sm leading-relaxed mt-3 flex-1">
        {displayText}
        {needsTruncation && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#434E54]/60 hover:text-[#434E54] ml-1 font-medium transition-colors"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      {/* Dog photos */}
      <div className="flex gap-2 mt-4">
        {review.images.map((img, imgIndex) => (
          <button
            key={img.src}
            onClick={() => onImageClick(lightboxStartIndex + imgIndex)}
            className="relative w-20 h-20 rounded-xl overflow-hidden hover:ring-2 hover:ring-[#434E54]/30 transition-all flex-shrink-0"
          >
            <OptimizedImage
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="80px"
              enableBlur={true}
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  // Calculate the starting lightbox index for each review's images
  const lightboxStartIndices: number[] = [];
  let counter = 0;
  for (const review of reviews) {
    lightboxStartIndices.push(counter);
    counter += review.images.length;
  }

  // Top 3 and bottom 2 reviews
  const topRow = reviews.slice(0, 3);
  const bottomRow = reviews.slice(3);

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#F8EEE5] to-[#FFFBF7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
            What Our Customers Say
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            Real reviews from happy pet parents on Yelp
          </p>
        </motion.div>

        {/* Top row: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {topRow.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={i}
              onImageClick={openLightbox}
              lightboxStartIndex={lightboxStartIndices[i]}
            />
          ))}
        </div>

        {/* Bottom row: 2 cards centered */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {bottomRow.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={i + 3}
              onImageClick={openLightbox}
              lightboxStartIndex={lightboxStartIndices[i + 3]}
            />
          ))}
        </div>

        {/* Yelp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <a
            href="https://www.yelp.com/biz/puppy-day-la-mirada"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#434E54] hover:text-[#434E54]/70 font-medium transition-colors"
          >
            See all reviews on Yelp
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={allLightboxImages as Parameters<typeof Lightbox>[0]['images']}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={() => setCurrentImageIndex((prev) => (prev + 1) % allLightboxImages.length)}
        onPrevious={() => setCurrentImageIndex((prev) => (prev - 1 + allLightboxImages.length) % allLightboxImages.length)}
      />
    </section>
  );
}
