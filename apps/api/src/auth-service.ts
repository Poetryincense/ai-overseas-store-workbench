import { createHash, randomBytes } from "node:crypto";
import type { AuthIdentityDto } from "@workspace/contracts";
import type { PrismaClient } from "@workspace/database";
import { hashPassword, verifyPassword } from "@workspace/shared";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const dummyPasswordHash = hashPassword(randomBytes(32).toString("base64url"));

export type AuthIdentity = AuthIdentityDto;

export interface AuthService {
  login(email: string, password: string): Promise<{ token: string } | null>;
  logout(token: string | undefined): Promise<void>;
  getIdentity(token: string | undefined): Promise<AuthIdentity | null>;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createAuthService(prisma: PrismaClient): AuthService {
  return {
    async login(emailInput, password) {
      const email = emailInput.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });
      const dummyHash = await dummyPasswordHash;
      const passwordHash = user?.passwordHash ?? dummyHash;
      const passwordMatches = await verifyPassword(password, passwordHash);
      if (user === null || user.status !== "ACTIVE" || !passwordMatches) {
        return null;
      }

      const token = randomBytes(32).toString("base64url");
      const now = new Date();
      await prisma.$transaction(async (tx) => {
        // Serialize concurrent logins for this user so each successful login
        // reliably revokes the previous session, even under parallel requests.
        await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${user.id}), 2)) AS session_lock`;
        // A successful login invalidates all previous sessions before issuing
        // the new opaque token. The raw token is never sent to Prisma.
        await tx.session.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: now }
        });
        await tx.session.create({
          data: {
            userId: user.id,
            tokenHash: hashSessionToken(token),
            expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
          }
        });
      });
      return { token };
    },

    async logout(token) {
      if (token === undefined || token === "") return;
      await prisma.session.updateMany({
        where: { tokenHash: hashSessionToken(token), revokedAt: null },
        data: { revokedAt: new Date() }
      });
    },

    async getIdentity(token) {
      if (token === undefined || token === "") return null;
      const session = await prisma.session.findUnique({
        where: { tokenHash: hashSessionToken(token) },
        include: { user: true }
      });
      const now = new Date();
      if (
        session === null ||
        session.revokedAt !== null ||
        session.expiresAt <= now ||
        session.user.status !== "ACTIVE"
      ) {
        return null;
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: { userId: session.userId },
        include: { workspace: true }
      });
      if (membership === null) return null;

      await prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: now }
      });

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName
        },
        workspace: {
          id: membership.workspace.id,
          name: membership.workspace.name,
          slug: membership.workspace.slug
        },
        role: membership.role
      };
    }
  };
}
