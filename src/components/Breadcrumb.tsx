import Link from 'next/link';

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  if (items.length === 0) return null;

  return (
    <nav className="text-sm mb-4 text-gray-600">
      {items.map((item, index) => (
        <span key={index}>
          {item.href ? (
            <Link href={item.href} className="hover:text-blue-600 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-bold text-gray-900">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="mx-2">›</span>}
        </span>
      ))}
    </nav>
  );
}

