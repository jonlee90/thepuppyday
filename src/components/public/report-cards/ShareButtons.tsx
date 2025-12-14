'use client';

import { motion } from 'framer-motion';
import { Facebook, Instagram, Link2, Download } from 'lucide-react';
import { useState } from 'react';
import { generateReportCardPDF, canGeneratePDF } from '@/lib/utils/pdf-generator';
import type { PublicReportCard } from '@/types/report-card';

interface ShareButtonsProps {
  reportCard: PublicReportCard;
}

/**
 * ShareButtons - Social sharing and PDF download options
 */
export function ShareButtons({ reportCard }: ShareButtonsProps) {
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Get current page URL
  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : '';

  // Share text
  const shareText = `Check out ${reportCard.pet_name}'s grooming report card from The Puppy Day! 🐕✨`;

  /**
   * Share to Facebook
   */
  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  /**
   * Instagram share (copy link + show instructions)
   */
  const handleInstagramShare = () => {
    handleCopyLink();
    alert(
      'Link copied! To share on Instagram:\n\n1. Open Instagram\n2. Create a new post or story\n3. Add your photo\n4. Paste the link in your caption or bio'
    );
  };

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please copy manually: ' + shareUrl);
    }
  };

  /**
   * Download PDF
   */
  const handleDownloadPDF = async () => {
    if (!canGeneratePDF(reportCard)) {
      alert('Report card data is incomplete. Cannot generate PDF.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generateReportCardPDF(reportCard);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#434E54] mb-3">
            Share the Results
          </h2>
          <p className="text-[#6B7280]">
            Show off your pet's transformation!
          </p>
        </div>

        {/* Share Buttons Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Facebook Share */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFacebookShare}
            className="flex flex-col items-center gap-3 p-6 bg-[#F8EEE5] hover:bg-[#EAE0D5] rounded-xl transition-colors duration-200"
          >
            <div className="p-3 bg-[#1877F2] rounded-lg">
              <Facebook className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-sm font-medium text-[#434E54]">
              Facebook
            </span>
          </motion.button>

          {/* Instagram Share */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInstagramShare}
            className="flex flex-col items-center gap-3 p-6 bg-[#F8EEE5] hover:bg-[#EAE0D5] rounded-xl transition-colors duration-200"
          >
            <div className="p-3 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-lg">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-[#434E54]">
              Instagram
            </span>
          </motion.button>

          {/* Copy Link */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-3 p-6 bg-[#F8EEE5] hover:bg-[#EAE0D5] rounded-xl transition-colors duration-200"
          >
            <div className="p-3 bg-[#434E54] rounded-lg">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-[#434E54]">
              Copy Link
            </span>
          </motion.button>

          {/* Download PDF */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex flex-col items-center gap-3 p-6 bg-[#F8EEE5] hover:bg-[#EAE0D5] rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-[#10B981] rounded-lg">
              <Download
                className={`w-6 h-6 text-white ${
                  isGeneratingPDF ? 'animate-bounce' : ''
                }`}
              />
            </div>
            <span className="text-sm font-medium text-[#434E54]">
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </span>
          </motion.button>
        </div>

        {/* Copy Toast Notification */}
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#434E54] text-white rounded-lg shadow-lg z-50"
          >
            <p className="text-sm font-medium">Link copied to clipboard!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
