import { describe, it, expect } from "vitest";

describe("chat-queries module exports", () => {
  it("exports getUserConversations function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getUserConversations).toBe("function");
  });

  it("exports getConversation function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getConversation).toBe("function");
  });

  it("exports getConversationMembers function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getConversationMembers).toBe("function");
  });

  it("exports findExistingDM function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.findExistingDM).toBe("function");
  });

  it("exports createConversation function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.createConversation).toBe("function");
  });

  it("exports addMembersToConversation function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.addMembersToConversation).toBe("function");
  });

  it("exports getMemberRole function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getMemberRole).toBe("function");
  });

  it("exports getMessages function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getMessages).toBe("function");
  });

  it("exports createMessage function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.createMessage).toBe("function");
  });

  it("exports getLatestMessageTimestamp function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getLatestMessageTimestamp).toBe("function");
  });

  it("exports addReaction function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.addReaction).toBe("function");
  });

  it("exports removeReaction function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.removeReaction).toBe("function");
  });

  it("exports getReactionOwner function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getReactionOwner).toBe("function");
  });

  it("exports setTyping function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.setTyping).toBe("function");
  });

  it("exports getActiveTypers function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.getActiveTypers).toBe("function");
  });

  it("exports updateReadReceipt function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.updateReadReceipt).toBe("function");
  });

  it("exports searchUsers function", async () => {
    const mod = await import("../../src/lib/db/chat-queries");
    expect(typeof mod.searchUsers).toBe("function");
  });
});
