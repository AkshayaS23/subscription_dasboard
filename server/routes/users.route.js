// server/routes/users.routes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/user.controller');

// NOTE: you should protect this route with an admin auth middleware.
// For now this is open (use only for testing) — see below about adding auth.
router.get('/users', usersController.getAllUsers);

module.exports = router;
