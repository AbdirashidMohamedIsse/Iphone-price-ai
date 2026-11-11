import { NextRequest } from "next/server";
import { runRecommendationAgent } from "@/agents/recommendation-agent";
import { agentRoute } from "@/lib/api";
import { RecommendationInputSchema } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return agentRoute(req, RecommendationInputSchema, (input) => runRecommendationAgent(input));
}
