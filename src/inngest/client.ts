import { EventSchemas, Inngest } from "inngest";

type Events = {
  "price/search.requested": { data: { runId: string; query: string } };
};

export const inngest = new Inngest({
  id: "iphone-price-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
});
