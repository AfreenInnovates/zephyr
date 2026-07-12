import {
  Opportunity,
  ScholarshipInputs,
  buildPrompt,
  categorize,
  detectClosed,
  detectDeadline,
  domainOf,
} from "@/lib/scholarships";
import { hasAnakinKey, searchWeb } from "@/lib/anakin";
import { geocodeLocation } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enc = new TextEncoder();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const inputs: ScholarshipInputs = {
    location: (q.get("location") || "Austin, TX").trim(),
    sport: q.get("sport") || "Football",
    age: q.get("age") || "",
    assistance: (q.get("assistance") || "").split(",").filter(Boolean),
    lunch: q.get("lunch") === "1",
  };

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      req.signal.addEventListener("abort", () => (closed = true));

      try {
        if (!hasAnakinKey()) {
          send("error", { message: "Search is not configured (no API key)." });
          return;
        }

        send("status", { text: `Locating ${inputs.location}…` });
        const geo = await geocodeLocation(inputs.location).catch(() => null);
        send("center", { label: geo?.label ?? inputs.location, found: !!geo });
        await sleep(250);

        send("status", { text: "Scanning municipal sites, club pages, and foundations…" });
        const results = await searchWeb(buildPrompt(inputs), 8);

        if (!results.length) {
          send("status", { text: "No programs found for those filters — try widening them." });
          send("done", { count: 0 });
          return;
        }

        send("status", { text: `Found ${results.length} programs — matching to your area…` });
        await sleep(200);

        let i = 0;
        for (const r of results) {
          if (closed) return;
          const text = `${r.title}\n${r.snippet}`;
          const angle = (i / results.length) * Math.PI * 2 + 0.6;
          const radius = 20 + (i % 3) * 8;
          const opp: Opportunity = {
            id: `s${i}`,
            title: r.title,
            url: r.url,
            source: domainOf(r.url),
            snippet: r.snippet.replace(/\s+/g, " ").slice(0, 260),
            category: categorize(text),
            lastUpdated: r.lastUpdated,
            deadline: detectDeadline(text),
            closed: detectClosed(text),
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
          };
          send("result", opp);
          i++;
          await sleep(180);
        }

        send("status", { text: `${results.length} opportunities mapped near ${geo?.label ?? inputs.location}.` });
        send("done", { count: results.length });
      } catch {
        send("error", { message: "Scan failed. Try again." });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
