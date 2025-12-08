const jwt = require("jsonwebtoken");
const { jwtSecret, cookieName, cookieSecure } = require("./config");
const { getAccount } = require("./db");

function signSession(accountId) {
  return jwt.sign({ aid: accountId }, jwtSecret, { expiresIn: "12h" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    return null;
  }
}

async function verifySession(token) {
  const payload = verifyToken(token);
  if (!payload?.aid) {
    return null;
  }
  try {
    const account = await getAccount(payload.aid);
    return account;
  } catch (err) {
    return null;
  }
}

function setSessionCookie(res, token) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure,
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(cookieName, { httpOnly: true, sameSite: "lax", secure: cookieSecure, path: "/" });
}

async function authMiddleware(req, res, next) {
  console.log("authMiddleware - checking cookie:", cookieName);
  const token = req.cookies?.[cookieName];
  if (!token) {
    console.log("authMiddleware - no token found");
    return res.status(401).json({ error: "unauthorized" });
  }
  console.log("authMiddleware - verifying token...");
  const payload = verifyToken(token);
  console.log("authMiddleware - payload:", payload);
  if (!payload?.aid) {
    console.log("authMiddleware - no aid in payload");
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    console.log("authMiddleware - loading account ID:", payload.aid);
    const account = await getAccount(payload.aid);
    console.log("authMiddleware - account loaded:", account ? "yes" : "no");
    if (!account) {
      return res.status(401).json({ error: "session not found" });
    }
    req.account = account;
    req.session = payload;
    console.log("authMiddleware - auth success");
    next();
  } catch (err) {
    console.error("authMiddleware - error:", err);
    next(err);
  }
}

module.exports = {
  signSession,
  verifyToken,
  verifySession,
  setSessionCookie,
  clearSessionCookie,
  authMiddleware,
};

