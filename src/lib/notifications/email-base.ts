/**
 * Phase 8: Email Base Template Wrapper
 * Professional, responsive HTML email base template wrapper for The Puppy Day
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

export interface EmailBaseOptions {
  unsubscribeLink?: string;
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
  <title>The Puppy Day</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #F8EEE5; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .content { background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(67, 78, 84, 0.08); }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 14px; color: #434E54; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1 style="color: #434E54; text-align: center; font-size: 32px;">The Puppy Day</h1>
    <div class="content">{{CONTENT}}</div>
    <div class="footer">
      <p><strong>Puppy Day</strong><br>14936 Leffingwell Rd, La Mirada, CA 90638<br>(657) 252-2903 | puppyday14936@gmail.com</p>
      <p><a href="{{UNSUBSCRIBE_LINK}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// WRAPPER FUNCTION
// ============================================================================

/**
 * Wrap content HTML in the base email template
 * Generates both HTML and plain text versions
 *
 * @param contentHtml - The HTML content to wrap (should already be escaped)
 * @param options - Optional configuration (unsubscribe link, etc.)
 * @returns EmailContent with both HTML and text versions
 */
export function wrapEmailContent(
  contentHtml: string,
  options: EmailBaseOptions = {}
): EmailContent {
  const baseTemplate = loadBaseTemplate();
  const unsubscribeLink = options.unsubscribeLink || '{{UNSUBSCRIBE_LINK}}';

  // Replace placeholders in base template
  const html = baseTemplate
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
 * Create a primary button
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
          <a href="${escapedUrl}" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 500;">
            ${escapedText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Create a secondary/outline button
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
          <a href="${escapedUrl}" class="button-secondary" style="background-color: transparent; color: #434E54; text-decoration: none; padding: 14px 28px; border-radius: 8px; border: 1px solid #434E54; display: inline-block; font-weight: 500;">
            ${escapedText}
          </a>
        </td>
      </tr>
    </table>
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
 * Create an info row for appointment details
 * @param label - Label text (will be automatically escaped)
 * @param value - Value text (will be automatically escaped)
 */
export function createInfoRow(label: string, value: string): string {
  const escapedLabel = escapeHtml(label);
  const escapedValue = escapeHtml(value);

  return `
    <tr>
      <td style="padding: 8px 0;">
        <span style="color: #434E54; font-size: 14px;">${escapedLabel}</span><br>
        <strong style="color: #434E54; font-size: 16px;">${escapedValue}</strong>
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
