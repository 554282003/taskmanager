const express = require('express');
const userRoutes = require('./User.route.js')
const taskRoutes = require('./Task.route.js')

const router = express.Router();

router.use("/user", userRoutes);
router.use("/task", taskRoutes);

module.exports = router;