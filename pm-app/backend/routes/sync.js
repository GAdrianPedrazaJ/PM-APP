const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/syncController');

router.post('/push', ctrl.push);
router.get('/pull', ctrl.pull);

module.exports = router;
