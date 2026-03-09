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
    reviewerName: 'Bora S.',
    reviewerInitial: 'B',
    rating: 5,
    date: 'August 17, 2025',
    text: 'This place is super clean, the dog shampoo smells great, and the grooming was done perfectly. Highly recommend!',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [{ src: '/images/reviews-dog/review-1.jpg', alt: 'Groomed dog from Bora S. review' }],
  },
  {
    id: 'review-2',
    reviewerName: 'Andrew U.',
    reviewerInitial: 'A',
    rating: 5,
    date: 'September 3, 2025',
    text: '12/10 service. The owner here really goes out of his way to make you and your pup feel welcomed. I will be coming here from now on for all my grooming needs.',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [{ src: '/images/reviews-dog/review-2.jpg', alt: 'Groomed dog from Andrew U. review' }],
  },
  {
    id: 'review-3',
    reviewerName: 'Kayde C.',
    reviewerInitial: 'K',
    rating: 5,
    date: 'October 13, 2025',
    text: "We seriously love Puppy Day Spa. They have been so good with takin my dogs same day when I call, they take their time, are attentive to al the dogs needs and the place is always clean. They truly treat our dogs like their own. I'm very thankful they moved in so close to us! The shampoo they use always smells great and I love that they have a play area for the pups to play. I would recommend them over and over again.",
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-3.jpg', alt: 'First groomed dog from Kayde C. review' },
      { src: '/images/reviews-dog/review-3-1.jpg', alt: 'Second groomed dog from Kayde C. review' },
    ],
  },
  {
    id: 'review-4',
    reviewerName: 'Deborah A.',
    reviewerInitial: 'D',
    rating: 5,
    date: 'September 24, 2025',
    text: 'Very nice service! They took really good care of my pup! He looked so handsome after. They are very good at answering requests!',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-4-1.jpg', alt: 'First groomed dog from Deborah A. review' },
      { src: '/images/reviews-dog/review-4-2.jpg', alt: 'Second groomed dog from Deborah A. review' },
    ],
  },
  {
    id: 'review-5',
    reviewerName: 'Wendy A.',
    reviewerInitial: 'W',
    rating: 5,
    date: 'November 25, 2025',
    text: 'First time bringing my fur babies here. I have a Senior Yorkie &. Shih-Poo. Owner "Jay" was super nice & showed me around the shop, to see where they would be while they awaited their turn. Was able to book an appointment for both my dogs quick. I asked for short haircut, & that\'s what he did. Thank you!. Thus far, very good experience. Will definitely be bringing my fur babies back again.',
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-5-1.jpg', alt: 'First groomed dog from Wendy A. review' },
      { src: '/images/reviews-dog/review-5-2.jpg', alt: 'Second groomed dog from Wendy A. review' },
    ],
  },
  {
    id: 'review-6',
    reviewerName: 'Yvonne R.',
    reviewerInitial: 'Y',
    rating: 5,
    date: 'September 12, 2025',
    text: "Loved how clean this place was. I have two dogs that require monthly maintenance as they model for different companies and always need to be camera ready. I had a very specific request on their hair cuts and they did a fabulous job! My smallest pup is very anxious and takes time for him to warm up to groomers. They were very sweet and took their time with him. When I picked him up, he was all smiles and wanting to roam around Luna, my Cavapoo is typically my wiggle monster. They informed me that she did really good and almost fell asleep during her hair cut lol . I believe them because she got real comfy on their couch and wanted to go back to their play area! Will be coming back and recommend to anyone looking to try a new place. Prices are reasonable too.",
    yelpUrl: 'https://www.yelp.com/biz/puppy-day-la-mirada',
    images: [
      { src: '/images/reviews-dog/review-6.jpg', alt: 'First groomed dog from Yvonne R. review' }
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
            className="text-[#434E54]/60 hover:text-[#434E54] ml-1 font-medium transition-colors cursor-pointer"
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
            className="relative w-20 h-20 rounded-xl overflow-hidden hover:ring-2 hover:ring-[#434E54]/30 transition-all flex-shrink-0 cursor-pointer"
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


  return (
    <section id="testimonials" className="relative py-20 md:py-28 bg-[#FFFBF7]">
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

        {/* 6 reviews: 1 col mobile → 2 col tablet → 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={i}
              onImageClick={openLightbox}
              lightboxStartIndex={lightboxStartIndices[i]}
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
