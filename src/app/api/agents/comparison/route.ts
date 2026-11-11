import { NextRequest } from "next/server";
import { runComparisonAgent } from "@/agents/comparison-agent";
import { agentRoute } from "@/lib/api";
import { ComparisonInputSchema } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return agentRoute(req, ComparisonInputSchema, (input) => runComparisonAgent(input));
}
