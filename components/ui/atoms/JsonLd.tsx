interface JsonLdProps {
  data: Record<string, unknown>;
}

/** Renders a <script type="application/ld+json"> tag for structured data */
export function JsonLd({ data }: JsonLdProps) {
  // JSON-LD may contain upstream model descriptions. Escaping HTML-significant
  // characters keeps them from terminating the script element.
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
