import { NextRequest } from "next/server";
import { runSearchAgent } from "@/agents/search-agent";
import { agentRoute } from "@/lib/api";
import { SearchAgentInputSchema } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return agentRoute(req, SearchAgentInputSchema, (input) => runSearchAgent(input));
}
