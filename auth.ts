import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import sql from "./lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "public_profile,email",
        },
      },
    }),
    // Credentials for shop admin and super admin login
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "И-мэйл", type: "email" },
        password: { label: "Нууц үг", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const users = await sql`
            SELECT * FROM users 
            WHERE email = ${credentials.email as string}
            AND role IN ('shop_admin', 'super_admin')
          `;

          if (users.length === 0) {
            return null;
          }

          const user = users[0];
          
          // Check if user has a password set
          if (!user.password) {
            return null;
          }
          
          // Compare password using bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (isValidPassword) {
            return {
              id: String(user.id),
              name: user.name,
              email: user.email,
              role: user.role,
              shop_id: user.shop_id,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "facebook") {
        try {
          // Check if user exists
          const existingUsers = await sql`
            SELECT * FROM users WHERE facebook_id = ${account.providerAccountId}
          `;

          if (existingUsers.length === 0) {
            // Create new user
            await sql`
              INSERT INTO users (facebook_id, name, email, role)
              VALUES (${account.providerAccountId}, ${user.name || ''}, ${user.email || ''}, 'customer')
            `;
          }
        } catch (error) {
          console.error("Error saving user:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "facebook") {
        try {
          const users = await sql`
            SELECT * FROM users WHERE facebook_id = ${account.providerAccountId}
          `;
          if (users.length > 0) {
            token.userId = users[0].id;
            token.role = users[0].role;
            token.shopId = users[0].shop_id;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      } else if (user) {
        token.userId = user.id;
        token.role = (user as { role?: string }).role;
        token.shopId = (user as { shop_id?: number }).shop_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string | number }).id = token.userId as string | number;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { shopId?: number }).shopId = token.shopId as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
