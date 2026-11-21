import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createPrismaClient } from "@workspace/database";
import { hashPassword } from "@workspace/shared";

const suffix = randomUUID();
const email = `e2e-${suffix}@example.test`;
const password = `e2e-correct-password-${suffix}`;
const displayName = "E2E Owner";
const databaseUrl = process.env.DATABASE_URL ?? "";
const prisma = createPrismaClient(databaseUrl);

let userId = "";
let workspaceId = "";

test.beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), displayName }
  });
  userId = user.id;
  const workspace = await prisma.workspace.create({
    data: { name: `E2E Workspace ${suffix}`, slug: `e2e-${suffix}` }
  });
  workspaceId = workspace.id;
  await prisma.workspaceMember.create({ data: { userId, workspaceId, role: "OWNER" } });
});

test.afterAll(async () => {
  if (userId !== "") {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.workspaceMember.deleteMany({ where: { userId } });
  }
  if (workspaceId !== "") {
    await prisma.workspace.delete({ where: { id: workspaceId } });
  }
  if (userId !== "") {
    await prisma.user.delete({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

async function fillLogin(page: import("@playwright/test").Page, user: string, pass: string) {
  await page.getByLabel("邮箱").fill(user);
  await page.getByLabel("密码").fill(pass);
}

test("unauthenticated access to /dashboard redirects to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
});

test("client-side validation blocks empty submission without calling the API", async ({ page }) => {
  let loginRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v1/auth/login")) {
      loginRequests += 1;
    }
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByText("请输入邮箱。")).toBeVisible();
  await expect(page.getByText("请输入密码。")).toBeVisible();
  expect(loginRequests).toBe(0);
});

test("wrong password and unknown email show the same generic error", async ({ page }) => {
  await page.goto("/login");

  const formError = page.locator("#login-form-error");

  await fillLogin(page, email, "wrong-password-value");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(formError).toHaveText("邮箱或密码不正确。");

  await fillLogin(page, `missing-${suffix}@example.test`, "wrong-password-value");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(formError).toHaveText("邮箱或密码不正确。");
  await expect(page).toHaveURL(/\/login$/);
});

test("valid login reaches the dashboard, survives refresh and is shared across tabs", async ({
  browser
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await fillLogin(page, email, password);
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "工作台概览" })).toBeVisible();
  await expect(page.getByText(displayName)).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "工作台概览" })).toBeVisible();

  const secondTab = await context.newPage();
  await secondTab.goto("/dashboard");
  await expect(secondTab.getByRole("heading", { name: "工作台概览" })).toBeVisible();
  await context.close();
});

test("session token is not readable from JavaScript or browser storage", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await fillLogin(page, email, password);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const readable = await page.evaluate(() => ({
    cookie: document.cookie,
    local: JSON.stringify(window.localStorage),
    session: JSON.stringify(window.sessionStorage)
  }));
  expect(readable.cookie).not.toContain("workbench_session");
  expect(readable.local).not.toContain("workbench_session");
  expect(readable.session).not.toContain("workbench_session");

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === "workbench_session");
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");
  await context.close();
});

test("rapid repeated submission sends only one login request", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let loginRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v1/auth/login")) {
      loginRequests += 1;
    }
  });

  await page.goto("/login");
  await fillLogin(page, email, password);
  const passwordInput = page.getByLabel("密码");
  await passwordInput.press("Enter");
  await passwordInput.press("Enter");

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(loginRequests).toBe(1);
  await context.close();
});

test("logout revokes the session and protected pages are no longer shown", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await fillLogin(page, email, password);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("heading", { name: "工作台概览" })).toBeVisible();

  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/login$/);

  const meAfterLogout = await page.request.get("/api/v1/auth/me");
  expect(meAfterLogout.status()).toBe(401);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.goBack().catch(() => undefined);
  await expect(page.getByRole("heading", { name: "工作台概览" })).toHaveCount(0);
  await context.close();
});
