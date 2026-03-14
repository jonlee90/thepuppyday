/**
 * Phase 8: Email Base Template Wrapper
 * Professional, responsive HTML email base template wrapper for Puppy Day
 *
 * Design System: Clean & Elegant Professional
 * Colors: Background #F8EEE5, Primary #434E54, Cards #FFFFFF
 *
 * SECURITY: All user-provided data must be escaped before passing to these functions
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailContent {
  html: string;
  text: string;
}

/**
 * Email mood types that control visual appearance of the mood banner.
 * Each mood maps to a background color, text color, emoji, and default title.
 */
export type EmailMood = 'celebration' | 'reminder' | 'urgent' | 'info' | 'warning' | 'success';

export interface MoodConfig {
  backgroundColor: string;
  textColor: string;
  emoji: string;
  defaultTitle: string;
}

export const MOOD_CONFIGS: Record<EmailMood, MoodConfig> = {
  celebration: {
    backgroundColor: '#FFF8F0',
    textColor: '#92400E',
    emoji: '🎉',
    defaultTitle: 'Woohoo!',
  },
  reminder: {
    backgroundColor: '#F0F7FF',
    textColor: '#1E40AF',
    emoji: '🔔',
    defaultTitle: 'Don\'t Forget',
  },
  urgent: {
    backgroundColor: '#FFF4E6',
    textColor: '#92400E',
    emoji: '⏰',
    defaultTitle: 'Act Fast',
  },
  info: {
    backgroundColor: '#F8FAFB',
    textColor: '#374151',
    emoji: 'ℹ️',
    defaultTitle: 'Just So You Know',
  },
  warning: {
    backgroundColor: '#FEF2F2',
    textColor: '#991B1B',
    emoji: '⚠️',
    defaultTitle: 'Heads Up',
  },
  success: {
    backgroundColor: '#F0FDF4',
    textColor: '#166534',
    emoji: '✅',
    defaultTitle: 'All Done',
  },
};

export interface EmailBaseOptions {
  unsubscribeLink?: string;
  mood?: EmailMood;
  moodTitle?: string;
}

// ============================================================================
// SECURITY: HTML ESCAPING
// ============================================================================

/**
 * Escape HTML to prevent XSS attacks
 * Converts special characters to HTML entities
 */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return String(text).replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

// ============================================================================
// BASE TEMPLATE LOADER
// ============================================================================

let cachedTemplate: string | null = null;

/**
 * Load the base email template from HTML file
 * Template is cached after first load for performance
 */
function loadBaseTemplate(): string {
  if (cachedTemplate) {
    return cachedTemplate;
  }

  try {
    const templatePath = join(process.cwd(), 'src/lib/notifications/templates/email-base.html');
    cachedTemplate = readFileSync(templatePath, 'utf-8');
    return cachedTemplate;
  } catch (error) {
    // Fallback: Return inline template if file cannot be loaded
    console.error('Failed to load email-base.html, using fallback template', error);
    return getFallbackTemplate();
  }
}

/**
 * Fallback template if file loading fails
 * Simplified version of the base template
 */
function getFallbackTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Puppy Day</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #F8EEE5; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .content { background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(67, 78, 84, 0.08); }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 14px; color: #434E54; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1 style="color: #434E54; text-align: center; font-size: 32px;">Puppy Day</h1>
    <div class="content">
      {{MOOD_BANNER}}
      {{CONTENT}}
    </div>
    <div class="footer">
      <p><strong>Puppy Day</strong><br>14936 Leffingwell Rd, La Mirada, CA 90638<br>(657) 252-2903 | puppyday14936@gmail.com</p>
      <p><a href="{{UNSUBSCRIBE_LINK}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// MOOD BANNER
// ============================================================================

/**
 * Generate a mood banner HTML block.
 * Internal function -- called by wrapEmailContent() when mood is specified.
 *
 * @param mood - The mood type
 * @param title - Optional override for the banner title text
 */
function generateMoodBanner(mood: EmailMood, title?: string): string {
  const config = MOOD_CONFIGS[mood];
  const bannerTitle = title || config.defaultTitle;

  return `
    <tr>
      <td style="padding: 0;">
        <div style="background-color: ${config.backgroundColor}; border-radius: 8px; padding: 14px 20px; margin: 0 0 16px 0; text-align: center;">
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: ${config.textColor};">
            ${config.emoji} ${escapeHtml(bannerTitle)}
          </p>
        </div>
      </td>
    </tr>
  `;
}

// ============================================================================
// WRAPPER FUNCTION
// ============================================================================

/**
 * Wrap content HTML in the base email template
 * Generates both HTML and plain text versions
 * Optionally injects a mood banner between header and content.
 *
 * @param contentHtml - The HTML content to wrap (should already be escaped)
 * @param options - Optional configuration (unsubscribe link, mood, moodTitle)
 * @returns EmailContent with both HTML and text versions
 */
export function wrapEmailContent(
  contentHtml: string,
  options: EmailBaseOptions = {}
): EmailContent {
  const baseTemplate = loadBaseTemplate();
  const unsubscribeLink = options.unsubscribeLink || '{{UNSUBSCRIBE_LINK}}';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  // Generate mood banner HTML (or empty string if no mood or invalid mood)
  const moodBannerHtml = options.mood && MOOD_CONFIGS[options.mood]
    ? generateMoodBanner(options.mood, options.moodTitle)
    : '';

  // Replace placeholders in base template
  const html = baseTemplate
    .replace('{{BASE_URL}}', baseUrl)
    .replace('{{MOOD_BANNER}}', moodBannerHtml)
    .replace('{{CONTENT}}', contentHtml)
    .replace('{{UNSUBSCRIBE_LINK}}', unsubscribeLink);

  // Generate plain text version from HTML
  const text = htmlToPlainText(contentHtml);

  return { html, text };
}

// ============================================================================
// HTML TO PLAIN TEXT CONVERSION
// ============================================================================

/**
 * Convert HTML content to plain text for email clients that don't support HTML
 * Preserves basic formatting: bold, italic, links, lists
 *
 * @param html - HTML content to convert
 * @returns Plain text version
 */
export function htmlToPlainText(html: string): string {
  let text = html;

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert headings to uppercase with spacing
  text = text.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, (_, content) => {
    return `\n\n${content.toUpperCase()}\n${'='.repeat(50)}\n`;
  });

  // Convert paragraphs to newlines
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert links to text with URL
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)');

  // Convert bold/strong to uppercase
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, (_, __, content) => content.toUpperCase());

  // Convert lists (using [\s\S] instead of 's' flag for compatibility)
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return items.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  });

  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let counter = 1;
    return items.replace(/<li[^>]*>(.*?)<\/li>/gi, (_match: string, content: string) => {
      return `${counter++}. ${content}\n`;
    });
  });

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.trim();

  return text;
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMON EMAIL PATTERNS
// ============================================================================

/**
 * Create a card container for content
 * @param content - HTML content for the card
 */
export function createCard(content: string): string {
  return `<div class="card">${content}</div>`;
}

/**
 * Create a primary button (updated to gold pill style)
 * @param text - Button text (will be automatically escaped)
 * @param url - Button URL (will be automatically escaped)
 */
export function createButton(text: string, url: string): string {
  const escapedText = escapeHtml(text);
  const escapedUrl = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${escapedUrl}" class="button" style="background-color: #D4A574; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; display: inline-block; font-weight: 600; box-shadow: 0 4px 14px rgba(212, 165, 116, 0.4);">
            ${escapedText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a secondary/outline button (updated to gold outlined pill style)
 * @param text - Button text (will be automatically escaped)
 * @param url - Button URL (will be automatically escaped)
 */
export function createSecondaryButton(text: string, url: string): string {
  const escapedText = escapeHtml(text);
  const escapedUrl = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${escapedUrl}" class="button-secondary" style="background-color: transparent; color: #D4A574; text-decoration: none; padding: 16px 36px; border-radius: 50px; border: 2px solid #D4A574; display: inline-block; font-weight: 500;">
            ${escapedText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a warm gold CTA button for review/rebook actions (updated to pill style)
 * @param text - Button text (will be automatically escaped)
 * @param url - Button URL (will be automatically escaped)
 */
export function createWarmButton(text: string, url: string): string {
  const escapedText = escapeHtml(text);
  const escapedUrl = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${escapedUrl}" style="background-color: #D4A574; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
            ${escapedText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create an urgency box for time-limited actions (e.g., waitlist claims)
 * @param content - HTML content (not escaped — caller is responsible)
 * @param expirationText - e.g., "Expires in 2 hours"
 */
export function createUrgencyBox(content: string, expirationText: string): string {
  const escapedExpiration = escapeHtml(expirationText);

  return `
    <div style="background-color: #FFF4E6; border: 2px solid #D4A574; border-radius: 8px; padding: 20px; margin: 0 0 20px 0; text-align: center;">
      ${content}
      <p style="margin: 12px 0 0 0; color: #92400E; font-size: 13px; font-weight: 600;">
        ${escapedExpiration}
      </p>
    </div>
  `;
}

/**
 * Create a content box with cream background
 * @param content - HTML content for the box
 */
export function createContentBox(content: string): string {
  return `<div class="content-box">${content}</div>`;
}

/**
 * Create an info/alert box
 * @param content - HTML content for the alert
 * @param type - Alert type: 'info' | 'warning' | 'error' | 'success'
 */
export function createAlert(content: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): string {
  return `<div class="alert-${type}">${content}</div>`;
}

/**
 * Create an info row for appointment details (two-column layout)
 * @param label - Label text (will be automatically escaped)
 * @param value - Value text (will be automatically escaped)
 */
export function createInfoRow(label: string, value: string): string {
  const escapedLabel = escapeHtml(label);
  const escapedValue = escapeHtml(value);

  return `
    <tr>
      <td style="padding: 8px 0; width: 40%; vertical-align: top;">
        <span style="color: #434E54; font-size: 14px; opacity: 0.7;">${escapedLabel}</span>
      </td>
      <td style="padding: 8px 0; width: 60%; vertical-align: top;">
        <strong style="color: #434E54; font-size: 15px;">${escapedValue}</strong>
      </td>
    </tr>
  `;
}

/**
 * Create a badge/tag
 * @param text - Badge text (should be escaped)
 */
export function createBadge(text: string): string {
  return `<span class="badge">${text}</span>`;
}

/**
 * Create an image with proper email client compatibility
 * @param src - Image URL (will be automatically escaped)
 * @param alt - Alt text (will be automatically escaped)
 * @param width - Optional width
 */
export function createImage(src: string, alt: string, width?: number): string {
  const escapedSrc = escapeHtml(src);
  const escapedAlt = escapeHtml(alt);
  const widthAttr = width ? `width="${width}"` : '';
  return `<img src="${escapedSrc}" alt="${escapedAlt}" ${widthAttr} style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(67, 78, 84, 0.12);">`;
}

// ============================================================================
// NEW COMPONENT FUNCTIONS (Task 0071)
// ============================================================================

/**
 * Create a pet hero section with centered dog emoji, pet name, and context.
 * Used as the emotional anchor at the top of personalized emails.
 *
 * @param petName - Pet's name (will be escaped)
 * @param context - Optional context subtitle, e.g. "Grooming Appointment" (will be escaped)
 */
export function createPetHero(petName: string, context?: string): string {
  const escapedName = escapeHtml(petName);
  const escapedContext = context ? escapeHtml(context) : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0 16px 0;">
          <div style="font-size: 48px; line-height: 1; margin-bottom: 12px;">🐶</div>
          <h2 style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 24px; font-weight: 600; color: #434E54; margin: 0 0 4px 0;">
            ${escapedName}
          </h2>
          ${escapedContext ? `<p style="font-size: 14px; color: #434E54; opacity: 0.7; margin: 0;">${escapedContext}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a gold pill-shaped primary CTA button.
 * Gold (#D4A574) background, white text, 50px border-radius, subtle shadow.
 * Includes VML roundrect fallback for Outlook.
 *
 * @param text - Button label (will be escaped)
 * @param url - Button URL (will be escaped)
 */
export function createPrimaryCTA(text: string, url: string): string {
  const escapedText = escapeHtml(text);
  const escapedUrl = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapedUrl}" style="height:50px;v-text-anchor:middle;width:250px;" arcsize="50%" fillcolor="#D4A574" stroke="f">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">${escapedText}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${escapedUrl}" style="background-color: #D4A574; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(212, 165, 116, 0.4);">
            ${escapedText}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create an outlined pill-shaped secondary CTA button.
 * Transparent background, gold border, gold text.
 *
 * @param text - Button label (will be escaped)
 * @param url - Button URL (will be escaped)
 */
export function createSecondaryCTA(text: string, url: string): string {
  const escapedText = escapeHtml(text);
  const escapedUrl = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0;">
          <a href="${escapedUrl}" style="background-color: transparent; color: #D4A574 !important; text-decoration: none; padding: 12px 36px; border-radius: 50px; border: 2px solid #D4A574; display: inline-block; font-weight: 600; font-size: 16px;">
            ${escapedText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a red pill-shaped danger CTA button.
 * Red (#DC2626) background, white text.
 * Includes VML roundrect fallback for Outlook.
 *
 * @param text - Button label (will be escaped)
 * @param url - Button URL (will be escaped)
 */
export function createDangerCTA(text: string, url: string): string {
  const escapedText = escapeHtml(text);
  const escapedUrl = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapedUrl}" style="height:50px;v-text-anchor:middle;width:250px;" arcsize="50%" fillcolor="#DC2626" stroke="f">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">${escapedText}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${escapedUrl}" style="background-color: #DC2626; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
            ${escapedText}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a vertical time comparison layout for rescheduled appointments.
 * Shows old date/time with strikethrough, arrow, then new date/time highlighted.
 *
 * @param oldDate - Original date string (will be escaped)
 * @param oldTime - Original time string (will be escaped)
 * @param newDate - New date string (will be escaped)
 * @param newTime - New time string (will be escaped)
 */
export function createTimeComparison(
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string
): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">
      <tr>
        <td align="center">
          <div style="background-color: #FFFBF7; border-radius: 12px; padding: 20px; max-width: 320px; margin: 0 auto;">
            <!-- Old time (struck through) -->
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Previous appointment</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #9CA3AF; text-decoration: line-through;">
              ${escapeHtml(oldDate)} at ${escapeHtml(oldTime)}
            </p>
            <!-- Arrow -->
            <div style="font-size: 20px; margin: 0 0 16px 0; color: #D4A574;">→</div>
            <!-- New time (highlighted) -->
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #D4A574; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">New appointment</p>
            <p style="margin: 0; font-size: 18px; color: #434E54; font-weight: 700; font-family: Georgia, 'Times New Roman', Times, serif;">
              ${escapeHtml(newDate)}<br/>at ${escapeHtml(newTime)}
            </p>
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a gold gradient divider line.
 * Uses background-color fallback for clients that don't support gradients.
 */
export function createDivider(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 16px 0;">
          <div style="height: 1px; background-color: #D4A574; background-image: linear-gradient(to right, #D4A574, #E8C9A0, #D4A574);"></div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a subtle tip/info callout box.
 * Light cream background with a paw print icon prefix and gold left border.
 *
 * @param text - Tip text (will be escaped)
 */
export function createTip(text: string): string {
  const escapedText = escapeHtml(text);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 8px 0;">
          <div style="background-color: #FFFBF7; border-radius: 8px; padding: 16px; border-left: 4px solid #D4A574;">
            <p style="margin: 0; font-size: 14px; color: #434E54; line-height: 1.5;">
              <span style="margin-right: 6px;">🐾</span>${escapedText}
            </p>
          </div>
        </td>
      </tr>
    </table>
  `;
}
