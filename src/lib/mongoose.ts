import mongoose from "mongoose";

const uri = process.env.MONGODB_URI!;

declare global {
  var _mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectMongoose() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { dbName: "bombatique", bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
