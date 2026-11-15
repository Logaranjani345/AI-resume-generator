import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ObjectId } from 'mongodb';
import { findSessionUser } from '../db/sessions.ts';

export const SESSION_COOKIE_NAME = 'resume_session';

export interface AuthenticatedUser {
  id: ObjectId;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

  return cookie ? cookie.slice(SESSION_COOKIE_NAME.length + 1) || null : null;
}

export function setSessionCookie(response: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure}`
  );
}

export function clearSessionCookie(response: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`
  );
}

async function loadUser(request: Request): Promise<AuthenticatedUser | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const user = await findSessionUser(token);
  return user ? { id: user._id, email: user.email } : null;
}

export const requireAuth: RequestHandler = async (
  request,
  response,
  next: NextFunction
) => {
  try {
    const user = await loadUser(request);
    if (!user) {
      response.status(401).json({ error: 'Please sign in to continue.' });
      return;
    }
    (request as AuthRequest).user = user;
    next();
  } catch (error) {
    console.error('Authentication check failed:', error);
    response.status(500).json({ error: 'Unable to verify your session.' });
  }
};

export const optionalAuth: RequestHandler = async (
  request,
  response,
  next: NextFunction
) => {
  try {
    const token = getSessionToken(request);
    if (!token) {
      next();
      return;
    }

    const user = await loadUser(request);
    if (!user) {
      response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      return;
    }
    (request as AuthRequest).user = user;
    next();
  } catch (error) {
    console.error('Optional authentication check failed:', error);
    response.status(500).json({ error: 'Unable to verify your session.' });
  }
};
