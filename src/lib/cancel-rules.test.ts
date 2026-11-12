import { describe, it, expect } from "vitest";
import { canCancelRequest } from "./cancel-rules";
describe("canCancelRequest", () => {
  it("allows pending upcoming", () => expect(canCancelRequest("Pending", "2026-11-20", "2026-11-13")).toBe(true));
  it("allows approved starting today", () => expect(canCancelRequest("Approved", "2026-11-13", "2026-11-13")).toBe(true));
  it("blocks past events", () => expect(canCancelRequest("Approved", "2026-11-12", "2026-11-13")).toBe(false));
  it("blocks rejected", () => expect(canCancelRequest("Rejected", "2026-11-20", "2026-11-13")).toBe(false));
});
