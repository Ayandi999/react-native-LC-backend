import { Redis, type RedisOptions } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true; // Reconnect on READONLY error
    }
    return false;
  },
};

export const redis = new Redis(REDIS_URL, redisOptions);

redis.on("connect", () => {
  console.log("Redis client connected");
});

redis.on("ready", () => {
  console.log("Redis client ready to accept commands");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

redis.on("close", () => {
  console.warn("Redis connection closed");
});

// TTL constants (in seconds)
export const REDIS_TTL = {
  SESSION_META: 2 * 60 * 60, // 2 hours
  SESSION_CHAT: 2 * 60 * 60, // 2 hours
  SESSION_CODE: 2 * 60 * 60, // 2 hours
  USER_ACTIVE_SESSION: 2 * 60 * 60, // 2 hours
  SOCKET_SESSION: 60 * 60, // 1 hour
} as const;

// Key builders
export const redisKeys = {
  sessionMeta: (sessionId: string) => `session:${sessionId}:meta`,
  sessionChat: (sessionId: string) => `session:${sessionId}:chat`,
  sessionCode: (sessionId: string) => `session:${sessionId}:code`,
  userActiveSession: (userId: string) => `user:${userId}:active_session`,
  socketSession: (socketId: string) => `socket:${socketId}`,
};
