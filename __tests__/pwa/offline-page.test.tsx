import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfflinePage from '@/app/~offline/page';

// Mock next/link since we're in a test environment
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Offline Fallback Page', () => {
  beforeEach(() => {
    // Reset location mock before each test
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  it('renders the "You\'re Offline" heading', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("You're Offline");
  });

  it('renders the "Try Again" button', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders a link back to the homepage', () => {
    render(<OfflinePage />);
    const homeLink = screen.getByRole('link', { name: /back to homepage/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders the contact email', () => {
    render(<OfflinePage />);
    expect(screen.getByText('puppyday14936@gmail.com')).toBeInTheDocument();
  });

  it('calls window.location.reload() when "Try Again" is clicked', async () => {
    const user = userEvent.setup();
    render(<OfflinePage />);
    const button = screen.getByRole('button', { name: /try again/i });
    await user.click(button);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
