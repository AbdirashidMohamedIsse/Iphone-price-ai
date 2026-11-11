import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { priceSearchWorkflow } from "@/inngest/functions";

export const maxDuration = 300; // each step is its own invocation; lower this on Vercel Hobby (60s)

export const { GET, POST, PUT } = serve({ client: inngest, functions: [priceSearchWorkflow] });
