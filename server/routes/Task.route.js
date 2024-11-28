const express = require('express');
const { verifyJWT, isAdmin } = require('../middleware/auth.middleware');
const { createTask, duplicateTask, getTask,createSubTask, updateTask, trashTask, getTasks ,postTaskActivity, dashboardStatistics, deleteRestoreTask} = require('../controllers/task.controller');
const router = express.Router();

router.route('/test/create').post(verifyJWT,isAdmin,createTask);
router.route('/duplicate/:id').post(verifyJWT,isAdmin,duplicateTask);
router.route('/activity/:id').post(verifyJWT,isAdmin,postTaskActivity);

router.route("/dashboard").get(verifyJWT,dashboardStatistics);
router.route("/").get(verifyJWT,getTasks);
router.route("/:id").get(verifyJWT,getTask);

router.route('/create-subtask/:id').put(verifyJWT, isAdmin, createSubTask);
router.route('/update/:id').put(verifyJWT, isAdmin, updateTask);
router.route('/:id').put(verifyJWT, isAdmin, trashTask);
router.route('/restore/:id').post(verifyJWT, isAdmin, deleteRestoreTask);

module.exports = router;