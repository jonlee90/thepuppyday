import Link from 'next/link';
import { SchemaOrg } from './SchemaOrg';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const BASE_URL = 'https://thepuppyday.com';

export function Breadcrumb({ items }: BreadcrumbProps) {
  const schemaItems = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems,
  };

  return (
    <>
      <SchemaOrg schema={schema} />
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.label} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-[#6B7280] select-none" aria-hidden="true">
                    &gt;
                  </span>
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-[#434E54] hover:text-[#C67C4E] transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[#6B7280]" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
