export const runtime = "edge";

const GUTENDEX_URL = "https://gutendex.com/books/";

const pickTextUrl = (formats: Record<string, string>) => {
  return (
    formats["text/plain; charset=utf-8"] ||
    formats["text/plain; charset=us-ascii"] ||
    formats["text/plain"] ||
    ""
  );
};

const sliceGutenbergText = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n");
  const startMatch = normalized.match(/\*\*\* START OF[\s\S]*?\*\*\*/i);
  const endMatch = normalized.match(/\*\*\* END OF[\s\S]*?\*\*\*/i);

  const startIndex = startMatch ? startMatch.index + startMatch[0].length : 0;
  const endIndex = endMatch ? endMatch.index : normalized.length;

  return normalized.slice(startIndex, endIndex).trim();
};

const buildSnippets = (text: string) => {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((para) => para.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const paragraph = paragraphs[0] ?? "";
  const sentence = paragraph
    ? paragraph.split(/(?<=[.!?])\s+/)[0]
    : "";
  const section = paragraphs.slice(0, 3).join("\n\n");

  return { sentence, paragraph, section };
};

const randomIndex = (length: number) =>
  Math.floor(Math.random() * Math.max(length, 1));

export async function GET() {
  const baseResponse = await fetch(GUTENDEX_URL, { cache: "no-store" });
  if (!baseResponse.ok) {
    return new Response("Failed to fetch book list.", { status: 500 });
  }
  const baseData = await baseResponse.json();
  const count = baseData.count ?? 0;
  const pageSize = baseData.results?.length ?? 32;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const page = randomIndex(totalPages) + 1;

  const pageResponse = await fetch(`${GUTENDEX_URL}?page=${page}`, {
    cache: "no-store"
  });
  if (!pageResponse.ok) {
    return new Response("Failed to fetch book list page.", { status: 500 });
  }
  const pageData = await pageResponse.json();
  const results = pageData.results ?? [];
  if (!results.length) {
    return new Response("No books found.", { status: 500 });
  }

  const book = results[randomIndex(results.length)];
  const textUrl = pickTextUrl(book.formats || {});
  if (!textUrl) {
    return new Response("No text available for this book.", { status: 500 });
  }

  const textResponse = await fetch(textUrl, { cache: "no-store" });
  if (!textResponse.ok) {
    return new Response("Failed to fetch book text.", { status: 500 });
  }
  const rawText = await textResponse.text();
  const strippedText = sliceGutenbergText(rawText);
  const { sentence, paragraph, section } = buildSnippets(strippedText);

  const author = book.authors?.[0]?.name || "Unknown";

  return Response.json({
    id: book.id,
    title: book.title,
    author,
    subjects: book.subjects ?? [],
    bookshelves: book.bookshelves ?? [],
    language: book.languages?.[0] ?? "Unknown",
    downloadCount: book.download_count ?? 0,
    sentence: sentence || paragraph || section || "",
    paragraph: paragraph || section || sentence || "",
    section: section || paragraph || sentence || ""
  });
}
