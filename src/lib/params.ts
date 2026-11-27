import { z } from "zod";
export const cardSchema = z
  .object({
    user: z
      .string()
      .min(1)
      .max(39)
      .regex(
        /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i,
        "Enter a valid GitHub username",
      ),
    theme: z
      .enum([
        "light",
        "dark",
        "dark_dimmed",
        "light_high_contrast",
        "dark_high_contrast",
      ])
      .default("light"),
    hide: z
      .string()
      .default("")
      .refine(
        (v) =>
          v === "" ||
          v.split(",").every((x) => ["bio", "languages"].includes(x)),
        "hide accepts bio,languages",
      ),
    border: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    radius: z.coerce.number().int().min(0).max(32).default(8),
    demo: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  })
  .strict();
export type CardOptions = z.infer<typeof cardSchema>;
