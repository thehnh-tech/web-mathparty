import { MongoClient } from "mongodb";

// Fallback URI used only when MONGODB_URI is not set at module load time
// (e.g., `next build` collecting page data). The constructor parses but never
// connects, so this is harmless until something tries to run a real operation,
// at which point Mongo will surface its own clear error.
const BUILD_PLACEHOLDER_URI = "mongodb://placeholder:27017";

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
  const uri = process.env.MONGODB_URI || BUILD_PLACEHOLDER_URI;
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
