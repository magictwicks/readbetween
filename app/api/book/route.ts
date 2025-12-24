export const runtime = "edge";

const GUTENDEX_URL = "https://gutendex.com/books/";
const MIN_DOWNLOADS = 3000;
const POPULAR_PAGES = 10;

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

  const startIndex = startMatch?.index
    ? startMatch.index + startMatch[0].length
    : 0;
  const endIndex = endMatch?.index ?? normalized.length;

  return normalized.slice(startIndex, endIndex).trim();
};

const stripFrontMatter = (text: string) => {
  const boilerplatePatterns = [
    /project gutenberg/i,
    /produced by/i,
    /transcrib/i,
    /proofread/i,
    /release date/i,
    /language:/i,
    /character set encoding/i,
    /ebook/i,
    /gutenberg-tm/i,
    /copyright/i,
    /public domain/i
  ];

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((para) => para.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const findStart = paragraphs.findIndex((para) => {
    if (para.length < 120) {
      return false;
    }
    if (boilerplatePatterns.some((pattern) => pattern.test(para))) {
      return false;
    }
    const letterCount = para.replace(/[^A-Za-z]/g, "").length;
    return letterCount > 80;
  });

  if (findStart === -1) {
    return text.trim();
  }

  return paragraphs.slice(findStart).join("\n\n").trim();
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
  let results: any[] = [];

  for (let attempt = 0; attempt < POPULAR_PAGES; attempt += 1) {
    const page = randomIndex(POPULAR_PAGES) + 1;
    const pageResponse = await fetch(
      `${GUTENDEX_URL}?languages=en&sort=popular&page=${page}`,
      {
        cache: "no-store"
      }
    );
    if (!pageResponse.ok) {
      continue;
    }
    const pageData = await pageResponse.json();
    results = (pageData.results ?? []).filter(
      (book: any) => (book.download_count ?? 0) >= MIN_DOWNLOADS
    );
    if (results.length) {
      break;
    }
  }

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
  const bookText = stripFrontMatter(strippedText);
  const { sentence, paragraph, section } = buildSnippets(bookText);

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
