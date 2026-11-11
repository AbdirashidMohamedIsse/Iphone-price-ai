import { NextRequest } from "next/server";
import { runIngestionAgent } from "@/agents/ingestion-agent";
import { agentRoute } from "@/lib/api";
import { IngestionInputSchema } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return agentRoute(req, IngestionInputSchema, (input) => runIngestionAgent(input));
}
