import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { getDb } from "./db/client";

const dialect = new LibsqlDialect({ client: getDb() });
const kyselyDb = new Kysely({ dialect });

export const auth = betterAuth({
  database: {
    db: kyselyDb,
    type: "sqlite",
  },
  secret: import.meta.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});

export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}
