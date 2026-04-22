export function validateRequest(schema) {
  return (req, res, next) => {
    console.log(`[ValidateRequest] path=${req.method} ${req.originalUrl} bodyKeys=${Object.keys(req.body || {}).join(",")}`);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      console.warn("[ValidateRequest] failed", {
        path: `${req.method} ${req.originalUrl}`,
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          received: i.received,
        })),
      });
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    console.log(`[ValidateRequest] passed path=${req.method} ${req.originalUrl}`);
    req.body = parsed.data;
    return next();
  };
}
