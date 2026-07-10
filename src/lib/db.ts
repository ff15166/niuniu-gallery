import { createClient, type Client } from "@libsql/client";

let db: Client;

function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (url && url !== "undefined") {
      db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    } else {
      // Local development: use file-based SQLite
      db = createClient({ url: "file:./data/niuniu.db" });
    }
  }
  return db;
}

// Lazy proxy — defers connection until first query
const dbProxy: Client = new Proxy({} as Client, {
  get(_, prop) {
    const client = getDb();
    const val = client[prop as keyof Client];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

export default dbProxy;
