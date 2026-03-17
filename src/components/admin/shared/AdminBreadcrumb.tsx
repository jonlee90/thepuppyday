import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[#434E54]/60 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-[#434E54] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-[#434E54] font-medium' : ''}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
