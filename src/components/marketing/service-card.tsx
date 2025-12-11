'use client';

/**
 * Service card component - Clean & Elegant Professional style
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Service } from '@/types/database';

interface ServiceCardProps {
  service: Service;
  onLearnMore?: () => void;
}

// Simple line icons mapping (using SVG instead of emojis)
const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();

  // Scissors for basic/cutting services
  if (name.includes('basic') || name.includes('premium')) {
    return (
      <svg className="w-8 h-8 text-[#434E54]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    );
  }

  // Sparkles for spa
  if (name.includes('spa')) {
    return (
      <svg className="w-8 h-8 text-[#434E54]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  }

  // Heart for puppy
  if (name.includes('puppy')) {
    return (
      <svg className="w-8 h-8 text-[#434E54]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }

  // Default paw icon
  return (
    <svg className="w-8 h-8 text-[#434E54]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );
};

export function ServiceCard({ service, onLearnMore }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Display price range based on service type
  const priceDisplay = () => {
    const serviceName = service.name.toLowerCase();

    if (serviceName.includes('basic')) return '$40 - $85';
    else if (serviceName.includes('premium')) return '$70 - $150';
    else if (serviceName.includes('day') || serviceName.includes('daycare')) return 'Call for pricing';
    else if (serviceName.includes('long hair') || serviceName.includes('sporting')) return '$10';
    else if (serviceName.includes('teeth')) return '$10';
    else if (serviceName.includes('pawdicure')) return '$15';
    else if (serviceName.includes('flea')) return '$25';
    else if (serviceName.includes('tangle')) return '$5 - $30';

    return '$40 - $85';
  };

  const handleClick = () => {
    if (onLearnMore) {
      onLearnMore();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="bg-white rounded-xl p-6 cursor-pointer h-full flex flex-col shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
        onClick={handleClick}
      >
        {/* Service Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center">
            {getServiceIcon(service.name)}
          </div>
        </div>

        {/* Service Name */}
        <h3 className="text-xl font-semibold text-[#434E54] text-center mb-3">
          {service.name}
        </h3>

        {/* Service Description */}
        <p className="text-[#6B7280] text-center text-sm mb-4 flex-grow">
          {service.description}
        </p>

        {/* Duration Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-[#F8EEE5] px-4 py-2 rounded-full">
            <svg
              className="w-4 h-4 text-[#434E54]"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium text-[#434E54] text-sm">{service.duration_minutes} min</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-4">
          <div className="inline-block bg-[#F8EEE5] rounded-lg px-6 py-3">
            <div className="text-2xl font-semibold text-[#434E54]">{priceDisplay()}</div>
            <div className="text-xs text-[#6B7280] mt-1">
              {priceDisplay().includes('-') && !priceDisplay().includes('Call') ? 'Varies by size' : priceDisplay().includes('Call') ? 'Contact us' : 'Fixed price'}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <h4 className="font-semibold text-[#434E54] text-sm mb-3">What&apos;s Included:</h4>
            <ul className="text-sm text-[#6B7280] space-y-2">
              {service.name.toLowerCase().includes('basic') && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Bath with premium shampoo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Brush out and de-shedding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Nail trim</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Ear cleaning</span>
                  </li>
                </>
              )}
              {service.name.toLowerCase().includes('premium') && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Everything in Basic Groom</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Full haircut and styling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Paw pad trim</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Teeth brushing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Cologne spritz</span>
                  </li>
                </>
              )}
              {service.name.toLowerCase().includes('spa') && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Premium grooming package</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Blueberry facial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Aromatherapy treatment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Pawdicure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Luxury bandana</span>
                  </li>
                </>
              )}
              {service.name.toLowerCase().includes('puppy') && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Gentle introduction to grooming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Light bath and dry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Nail tip trim</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#434E54] mt-0.5">•</span>
                    <span>Treats and positive reinforcement</span>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        )}

        {/* CTA Button */}
        <div className="mt-4">
          {isExpanded ? (
            <button
              className="w-full px-6 py-3 text-base font-medium text-white bg-[#434E54] rounded-lg shadow-md hover:bg-[#363F44] hover:shadow-lg transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/book?service=${service.id}`);
              }}
            >
              Book This Service
            </button>
          ) : (
            <button
              className="w-full px-6 py-3 text-base font-medium text-[#434E54] bg-[#F8EEE5] rounded-lg hover:bg-[#EAE0D5] transition-all duration-200"
            >
              Learn More
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
