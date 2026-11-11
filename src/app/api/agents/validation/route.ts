import { NextRequest } from "next/server";
import { runValidationAgent } from "@/agents/validation-agent";
import { agentRoute } from "@/lib/api";
import { ValidationInputSchema } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return agentRoute(req, ValidationInputSchema, (input) => runValidationAgent(input));
}
