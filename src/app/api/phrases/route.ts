import { getPhraseRepository } from "@/lib/phrases";
import { validatePhraseConfig } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const config = validatePhraseConfig(await getPhraseRepository().get());
    return Response.json(config, { headers });
  } catch {
    return Response.json(
      { error: "Phrases are unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
