'use client';

/**
 * Service card component for displaying grooming services
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Service } from '@/types/database';

interface ServiceCardProps {
  service: Service;
  onLearnMore?: () => void;
}

export function ServiceCard({ service, onLearnMore }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Display price range based on service type (demo pricing)
  const priceDisplay = () => {
    const serviceName = service.name.toLowerCase();

    // Demo price ranges based on service type
    if (serviceName.includes('basic')) {
      return '$45 - $85';
    } else if (serviceName.includes('premium')) {
      return '$65 - $115';
    } else if (serviceName.includes('spa')) {
      return '$85 - $135';
    } else if (serviceName.includes('puppy')) {
      return '$35';
    } else if (serviceName.includes('nail')) {
      return '$15';
    } else if (serviceName.includes('teeth')) {
      return '$20';
    }

    // Default range
    return '$45 - $95';
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
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer h-full"
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={handleClick}
    >
      <div className="card-body">
        {/* Service Icon/Image */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {/* Generic icon - could be customized per service */}
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
            </svg>
          </div>
        </div>

        {/* Service Name */}
        <h3 className="card-title justify-center text-center mb-2">
          {service.name}
        </h3>

        {/* Service Description */}
        <p className="text-base-content/70 text-center text-sm mb-4">
          {service.description}
        </p>

        {/* Duration */}
        <div className="flex items-center justify-center gap-2 text-sm text-base-content/60 mb-2">
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{service.duration_minutes} minutes</span>
        </div>

        {/* Price */}
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{priceDisplay()}</div>
          <div className="text-xs text-base-content/60 mt-1">
            {priceDisplay().includes('-') ? 'Starting price varies by size' : 'Fixed price'}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-base-300"
          >
            <h4 className="font-semibold text-sm mb-2">What's Included:</h4>
            <ul className="text-sm text-base-content/70 space-y-1">
              {service.name.toLowerCase().includes('basic') && (
                <>
                  <li>• Bath with premium shampoo</li>
                  <li>• Brush out and de-shedding</li>
                  <li>• Nail trim</li>
                  <li>• Ear cleaning</li>
                </>
              )}
              {service.name.toLowerCase().includes('premium') && (
                <>
                  <li>• Everything in Basic Groom</li>
                  <li>• Full haircut and styling</li>
                  <li>• Paw pad trim</li>
                  <li>• Teeth brushing</li>
                  <li>• Cologne spritz</li>
                </>
              )}
              {service.name.toLowerCase().includes('spa') && (
                <>
                  <li>• Premium grooming package</li>
                  <li>• Blueberry facial</li>
                  <li>• Aromatherapy treatment</li>
                  <li>• Pawdicure</li>
                  <li>• Luxury bandana</li>
                </>
              )}
              {service.name.toLowerCase().includes('puppy') && (
                <>
                  <li>• Gentle introduction to grooming</li>
                  <li>• Light bath and dry</li>
                  <li>• Nail tip trim</li>
                  <li>• Treats and positive reinforcement</li>
                </>
              )}
            </ul>
          </motion.div>
        )}

        {/* CTA */}
        <div className="card-actions justify-center mt-4">
          {isExpanded ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/book?service=${service.id}`);
              }}
            >
              Book This Service
            </button>
          ) : (
            <button className="btn btn-primary btn-sm">
              Learn More
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
