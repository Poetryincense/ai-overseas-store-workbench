import { describe, expect, it } from "vitest";
import { describeLoginFailure, validateLoginForm } from "./auth-form.js";

describe("validateLoginForm", () => {
  it("requires a well-formed email and a non-empty password", () => {
    expect(validateLoginForm({ email: "", password: "" })).toEqual({
      email: "请输入邮箱。",
      password: "请输入密码。"
    });
    expect(validateLoginForm({ email: "not-an-email", password: "x" })).toEqual({
      email: "请输入有效的邮箱地址。"
    });
  });

  it("accepts a trimmed valid email with a password", () => {
    expect(validateLoginForm({ email: "  owner@example.test ", password: "secret" })).toEqual({});
  });

  it("rejects overly long input before it reaches the API", () => {
    const longEmail = `${"a".repeat(310)}@example.test`;
    expect(validateLoginForm({ email: longEmail, password: "x" }).email).toBe(
      "请输入有效的邮箱地址。"
    );
    expect(validateLoginForm({ email: "owner@example.test", password: "x".repeat(1025) })).toEqual({
      password: "密码长度超出限制。"
    });
  });
});

describe("describeLoginFailure", () => {
  it("maps credential failures to one generic message", () => {
    expect(describeLoginFailure(401)).toBe("邮箱或密码不正确。");
  });

  it("maps rate limiting, CSRF and availability failures to distinct messages", () => {
    expect(describeLoginFailure(429)).toBe("尝试次数过多，请 15 分钟后再试。");
    expect(describeLoginFailure(403)).toBe("安全校验未通过，请刷新页面后重试。");
    expect(describeLoginFailure(503)).toBe("认证服务暂不可用，请稍后重试。");
    expect(describeLoginFailure(0)).toBe("登录失败，请稍后重试。");
  });
});
