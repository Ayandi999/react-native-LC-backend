import crypto from "crypto";
import { redis, REDIS_TTL, redisKeys } from "../lib/redis.js";

export type SessionStatus =
  "in_progress" | "completed" | "timed_out" | "abandoned";

export interface SessionMeta {
  id: string;
  userId: string;
  problemId: string;
  status: SessionStatus;
  startedAt: number;
  durationSec: number;
  expiresAt: number;
  isProcessing: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface InitSessionOptions {
  durationSec?: number;
  starterCode?: string;
}

export class SessionService {
  /**
   * Initialize a new interview session in Redis or resume an existing active one
   */
  async initSession(
    userId: string,
    problemId: string,
    options?: InitSessionOptions
  ): Promise<{ sessionId: string; meta: SessionMeta; isNew: boolean }> {
    // 1. Check for existing active session for this user
    const existing = await this.getActiveSessionForUser(userId);
    if (existing && existing.meta.problemId === problemId) {
      return {
        sessionId: existing.sessionId,
        meta: existing.meta,
        isNew: false,
      };
    }

    // 2. Setup timing
    const sessionId = crypto.randomUUID();
    const durationSec = options?.durationSec || 1800; // default 30 minutes
    const startedAt = Date.now();
    const expiresAt = startedAt + durationSec * 1000;

    const meta: SessionMeta = {
      id: sessionId,
      userId,
      problemId,
      status: "in_progress",
      startedAt,
      durationSec,
      expiresAt,
      isProcessing: false,
    };

    const metaKey = redisKeys.sessionMeta(sessionId);
    const userActiveKey = redisKeys.userActiveSession(userId);
    const codeKey = redisKeys.sessionCode(sessionId);

    // 3. Multi/Pipeline write to Redis
    const pipeline = redis.pipeline();

    pipeline.hset(metaKey, {
      id: meta.id,
      userId: meta.userId,
      problemId: meta.problemId,
      status: meta.status,
      startedAt: meta.startedAt.toString(),
      durationSec: meta.durationSec.toString(),
      expiresAt: meta.expiresAt.toString(),
      isProcessing: meta.isProcessing ? "true" : "false",
    });
    pipeline.expire(metaKey, REDIS_TTL.SESSION_META);

    pipeline.set(userActiveKey, sessionId, "EX", REDIS_TTL.USER_ACTIVE_SESSION);

    const initialCode = options?.starterCode || "";
    pipeline.set(codeKey, initialCode, "EX", REDIS_TTL.SESSION_CODE);

    await pipeline.exec();

    return { sessionId, meta, isNew: true };
  }

  /**
   * Fetch session metadata from Redis
   */
  async getSessionMeta(sessionId: string): Promise<SessionMeta | null> {
    const raw = await redis.hgetall(redisKeys.sessionMeta(sessionId));
    if (!raw || Object.keys(raw).length === 0) {
      return null;
    }

    return {
      id: raw.id,
      userId: raw.userId,
      problemId: raw.problemId,
      status: (raw.status as SessionStatus) || "in_progress",
      startedAt: parseInt(raw.startedAt, 10) || 0,
      durationSec: parseInt(raw.durationSec, 10) || 0,
      expiresAt: parseInt(raw.expiresAt, 10) || 0,
      isProcessing: raw.isProcessing === "true",
    };
  }

  /**
   * Get active unexpired session for a user
   */
  async getActiveSessionForUser(
    userId: string
  ): Promise<{ sessionId: string; meta: SessionMeta } | null> {
    const activeSessionId = await redis.get(
      redisKeys.userActiveSession(userId)
    );
    if (!activeSessionId) {
      return null;
    }

    const meta = await this.getSessionMeta(activeSessionId);
    if (!meta) {
      // Clean up orphaned pointer
      await redis.del(redisKeys.userActiveSession(userId));
      return null;
    }

    // Check expiration or finished status
    const isExpired = Date.now() >= meta.expiresAt;
    if (meta.status !== "in_progress" || isExpired) {
      await redis.del(redisKeys.userActiveSession(userId));
      return null;
    }

    return { sessionId: activeSessionId, meta };
  }

  /**
   * Append a chat message to session chat list
   */
  async appendMessage(
    sessionId: string,
    message: {
      role: "user" | "assistant" | "system";
      content: string;
      id?: string;
      timestamp?: number;
    }
  ): Promise<ChatMessage> {
    const chatKey = redisKeys.sessionChat(sessionId);
    const chatMessage: ChatMessage = {
      id: message.id || crypto.randomUUID(),
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || Date.now(),
    };

    const pipeline = redis.pipeline();
    pipeline.rpush(chatKey, JSON.stringify(chatMessage));
    pipeline.expire(chatKey, REDIS_TTL.SESSION_CHAT);
    await pipeline.exec();

    return chatMessage;
  }

  /**
   * Retrieve chat history from Redis
   */
  async getHistory(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    const chatKey = redisKeys.sessionChat(sessionId);
    const range =
      limit && limit > 0
        ? await redis.lrange(chatKey, -limit, -1)
        : await redis.lrange(chatKey, 0, -1);

    return range.map((item) => JSON.parse(item) as ChatMessage);
  }

  /**
   * Update the candidate's active code snapshot
   */
  async updateCode(sessionId: string, code: string): Promise<void> {
    const codeKey = redisKeys.sessionCode(sessionId);
    await redis.set(codeKey, code, "EX", REDIS_TTL.SESSION_CODE);
  }

  /**
   * Get the candidate's latest code snapshot
   */
  async getCode(sessionId: string): Promise<string> {
    const codeKey = redisKeys.sessionCode(sessionId);
    const code = await redis.get(codeKey);
    return code || "";
  }

  /**
   * Lock/Unlock session while AI is generating response
   */
  async setProcessing(sessionId: string, isProcessing: boolean): Promise<void> {
    const metaKey = redisKeys.sessionMeta(sessionId);
    await redis.hset(metaKey, "isProcessing", isProcessing ? "true" : "false");
  }

  /**
   * Associate socketId to sessionId (for quick lookup on disconnect/reconnect)
   */
  async associateSocket(socketId: string, sessionId: string): Promise<void> {
    const socketKey = redisKeys.socketSession(socketId);
    await redis.set(socketKey, sessionId, "EX", REDIS_TTL.SOCKET_SESSION);
  }

  /**
   * Retrieve sessionId by socketId
   */
  async getSessionBySocket(socketId: string): Promise<string | null> {
    const socketKey = redisKeys.socketSession(socketId);
    return await redis.get(socketKey);
  }

  /**
   * Remove socketId mapping on disconnect
   */
  async removeSocket(socketId: string): Promise<void> {
    const socketKey = redisKeys.socketSession(socketId);
    await redis.del(socketKey);
  }

  /**
   * Conclude / Close session in Redis and return full transcript and snapshot
   */
  async closeSession(
    sessionId: string,
    finalStatus: SessionStatus = "completed"
  ): Promise<{
    meta: SessionMeta | null;
    messages: ChatMessage[];
    code: string;
  }> {
    const metaKey = redisKeys.sessionMeta(sessionId);
    await redis.hset(metaKey, "status", finalStatus);

    const meta = await this.getSessionMeta(sessionId);
    if (meta?.userId) {
      await redis.del(redisKeys.userActiveSession(meta.userId));
    }

    const messages = await this.getHistory(sessionId);
    const code = await this.getCode(sessionId);

    return {
      meta,
      messages,
      code,
    };
  }
}

export const sessionService = new SessionService();
