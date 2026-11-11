import { NextRequest } from "next/server";
import { runDiscoveryAgent } from "@/agents/discovery-agent";
import { agentRoute } from "@/lib/api";
import { DiscoveryInputSchema } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return agentRoute(req, DiscoveryInputSchema, (input) => runDiscoveryAgent(input));
}
