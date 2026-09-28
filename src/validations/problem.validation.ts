import { z } from "zod";

export const ProblemParamSchema = z.object({
  id: z.string().min(1, "Problem ID or slug is required"),
});

export type ProblemParamInput = z.infer<typeof ProblemParamSchema>;
