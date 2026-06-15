import z from "zod";
const systemUsersListSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().array(),
  status: z.boolean(),
  adminButton: z.string(),
});

export type SystemUsersListSchema = z.infer<typeof systemUsersListSchema>;
