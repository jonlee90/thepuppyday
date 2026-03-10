interface GoogleMapEmbedProps {
  query: string;
  className?: string;
}

export function GoogleMapEmbed({ query, className = '' }: GoogleMapEmbedProps) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden ${className}`}>
      <iframe
        src={src}
        title={`Google Maps - ${query}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
      />
    </div>
  );
}
