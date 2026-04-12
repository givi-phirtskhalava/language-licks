import { SignJWT, jwtVerify } from "jose";

const accessKey = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const refreshKey = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export interface IAccessTokenPayload {
  userId: number;
  tokenVersion: number;
}

export interface IRefreshTokenPayload {
  userId: number;
  tokenVersion: number;
}

export async function signAccessToken(
  payload: IAccessTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessKey);
}

export async function signRefreshToken(
  payload: IRefreshTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(refreshKey);
}

export async function verifyAccessToken(
  token: string
): Promise<IAccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as IAccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<IRefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as IRefreshTokenPayload;
  } catch {
    return null;
  }
}
