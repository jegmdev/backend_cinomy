const router = require("express").Router();
const { jsonResponse } = require("../lib/jsonResponse");

router.post("/", (req, res) => {
  const { email, password } = req.body;
  
  if (!!!email || !!!password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  //Autenticar usuario

  const accessToken = "access_token";
  const refreshToken = "refresh_token";
  const user = {
    id:'1',
    name: 'John',
    username: 'XXXXX'
  };   
  res.status(200).json(jsonResponse(200, {user, accessToken, refreshToken}))
});

module.exports = router;
