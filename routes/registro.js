const router = require("express").Router();
const { jsonResponse } = require("../lib/jsonResponse");

router.post("/", (req, res) => {
  res.send('Registro')
});

module.exports = router;
