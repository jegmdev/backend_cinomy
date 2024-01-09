const jwt = require("jsonwebtoken");
require('dotenv').config();

function sign(payload, isAccessToken) {
    const secret = isAccessToken
        ? process.env.ACCESS_TOKEN_SECRET 
        : process.env.REFRESH_TOKEN_SECRET;

    return jwt.sign(
        payload, 
        secret,
        {
            algorithm: "HS256",
            expiresIn: 3600,
        }
    );
}

function generateAccessToken(user){
    return sign({user}, true);
}

function generateRefreshToken(user){
    return sign({user}, false);
}

module.exports = {generateAccessToken, generateRefreshToken};
