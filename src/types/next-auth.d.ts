import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    issuer?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    roles?: string[];
  }
}
