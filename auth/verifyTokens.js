const jwt = require ("jsonwebtoken")

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
    if (token) {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      } else {
        throw new Error("Token no proporcionado");
      }
}

module.exports = {verifyAccessToken, verifyRefreshToken};