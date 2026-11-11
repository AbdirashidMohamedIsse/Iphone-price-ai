/** Central error hook: every unhandled server error is logged as structured JSON. Forward to Sentry/Datadog here. */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
) {
  const { logger, errMsg } = await import("@/lib/logger");
  logger.error("request_error", {
    path: request.path,
    method: request.method,
    route: context.routePath,
    type: context.routeType,
    message: errMsg(err),
    digest: (err as { digest?: string } | null)?.digest,
  });
}
