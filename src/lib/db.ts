import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

declare global {
  var _mongoClient: MongoClient | undefined;
}

function isClosed(client: MongoClient | undefined) {
  const topology = (
    client as unknown as {
      topology?: { isDestroyed?: () => boolean; s?: { state?: string } };
    } | undefined
  )?.topology;

  return (
    topology?.isDestroyed?.() ??
    ["closed", "closing", "destroyed"].includes(topology?.s?.state ?? "")
  );
}

function createClient() {
  return new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient || isClosed(global._mongoClient)) {
    global._mongoClient = createClient();
  }
} else {
  global._mongoClient = createClient();
}

export const mongoClient = global._mongoClient;
