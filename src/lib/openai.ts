import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";
import { getEnv } from "./env";

let client: OpenAI | null = null;
export function getOpenAI() {
  return (client ??= new OpenAI({ apiKey: getEnv().OPENAI_API_KEY, maxRetries: 3, timeout: 60_000 }));
}

type Effort = "minimal" | "low" | "medium" | "high";

/** Reasoning controls are only accepted by gpt-5 / o-series models. */
const supportsReasoning = (model: string) => /^(gpt-5|o\d)/.test(model);

/**
 * One Responses-API call that must return JSON matching `schema`
 * (Structured Outputs). Every agent talks to the model through this.
 */
export async function structured<T>(opts: {
  name: string;
  instructions: string;
  input: string;
  schema: ZodType<T>;
  model?: string;
  effort?: Effort;
}): Promise<T> {
  const model = opts.model ?? getEnv().OPENAI_MODEL;
  const response = await getOpenAI().responses.parse({
    model,
    instructions: opts.instructions,
    input: opts.input,
    ...(supportsReasoning(model) ? { reasoning: { effort: opts.effort ?? "minimal" } } : {}),
    text: { format: zodTextFormat(opts.schema, opts.name) },
  });
  if (!response.output_parsed) throw new Error(`${opts.name}: the model returned no structured output`);
  return response.output_parsed as T;
}
