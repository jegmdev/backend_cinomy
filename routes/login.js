const express = require("express");
const User = require("../schema/user");
const { jsonResponse } = require("../lib/jsonResponse");
const getUserInfo = require("../lib/getUserInfo");
const router = express.Router();

router.post("/", async function (req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (user) {
      const passwordCorrect = await user.comparePassword(password);

      if (passwordCorrect) {
        const accessToken = user.createAccessToken();
        const refreshToken = await user.createRefreshToken();

        return res.json(
          jsonResponse(200, {
            accessToken,
            refreshToken,
            user: getUserInfo(user),
          })
        );
      } else {
        return res.status(400).json(
          jsonResponse(400, {
            error: "Username and/or password incorrect",
          })
        );
      }
    } else {
      return res.status(404).json(
        jsonResponse(404, {
          error: "Username does not exist",
        })
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(jsonResponse(500, { error: "Internal server error" }));
  }
});

module.exports = router;
