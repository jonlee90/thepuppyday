/**
 * Focus Management Utilities
 * Task 0264: Create focus management utilities
 *
 * Helpers for keyboard navigation and focus trapping
 */

export type FocusableElement = HTMLElement & {
  focus: () => void;
};

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): FocusableElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<FocusableElement>(focusableSelectors));

  return elements.filter((el) => {
    // Filter out hidden elements
    return (
      el.offsetParent !== null &&
      !el.hasAttribute('hidden') &&
      window.getComputedStyle(el).display !== 'none' &&
      window.getComputedStyle(el).visibility !== 'hidden'
    );
  });
}

/**
 * Create a focus trap for modals and dialogs
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  let firstFocusableElement: FocusableElement | null = null;
  let lastFocusableElement: FocusableElement | null = null;
  let previouslyFocusedElement: HTMLElement | null = null;

  function updateFocusableElements() {
    const focusableElements = getFocusableElements(container);
    firstFocusableElement = focusableElements[0] || null;
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    updateFocusableElements();

    if (!firstFocusableElement) return;

    // Shift + Tab: Move to last element when on first
    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement?.focus();
      return;
    }

    // Tab: Move to first element when on last
    if (!event.shiftKey && document.activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement?.focus();
      return;
    }
  }

  function activate() {
    // Store currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus first element in container
    updateFocusableElements();
    firstFocusableElement?.focus();

    // Add keyboard listener
    container.addEventListener('keydown', handleKeyDown);
  }

  function deactivate() {
    // Remove keyboard listener
    container.removeEventListener('keydown', handleKeyDown);

    // Restore focus to previously focused element
    previouslyFocusedElement?.focus();
    previouslyFocusedElement = null;
  }

  return { activate, deactivate };
}

/**
 * Setup skip-to-content link functionality
 */
export function setupSkipToContent(skipLinkId: string, mainContentId: string) {
  const skipLink = document.getElementById(skipLinkId);
  const mainContent = document.getElementById(mainContentId);

  if (!skipLink || !mainContent) {
    console.warn('Skip link or main content not found');
    return;
  }

  skipLink.addEventListener('click', (event) => {
    event.preventDefault();

    // Make main content focusable temporarily
    mainContent.setAttribute('tabindex', '-1');

    // Focus main content
    mainContent.focus();

    // Remove tabindex after focus
    mainContent.addEventListener(
      'blur',
      () => {
        mainContent.removeAttribute('tabindex');
      },
      { once: true }
    );
  });
}

/**
 * Manage focus for wizard/stepper components
 */
export class StepperFocusManager {
  private container: HTMLElement;
  private currentStepIndex: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  focusStep(stepIndex: number) {
    const steps = this.container.querySelectorAll('[role="tabpanel"]');
    const step = steps[stepIndex] as HTMLElement;

    if (!step) return;

    this.currentStepIndex = stepIndex;

    // Find first focusable element in step
    const focusableElements = getFocusableElements(step);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      // If no focusable elements, focus the step itself
      step.setAttribute('tabindex', '-1');
      step.focus();
    }
  }

  nextStep() {
    this.focusStep(this.currentStepIndex + 1);
  }

  previousStep() {
    this.focusStep(Math.max(0, this.currentStepIndex - 1));
  }
}

/**
 * Announce content to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const liveRegion = document.querySelector(`[aria-live="${priority}"]`) as HTMLElement;

  if (liveRegion) {
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  } else {
    console.warn('Live region not found for announcements');
  }
}
