const router = require('express').Router();

router.get('/', (req, res) => {
    res.send('Reservas')
});

module.exports = router;