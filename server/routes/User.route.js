const express = require("express");
const router = express.Router();
const { verifyJWT, isAdmin } = require("../middleware/auth.middleware");
const {
  userRegister,
  userLogin,
  userLogout,
  getTeamList,
  getNotificationsList,
  updateUserProfile,
  markNotificationRead,
  activateUserProfile,
  deleteUserProfile,
} = require("../controllers/user.controller");

router.route("/register").post(userRegister);
router.route("/login").post(verifyJWT,userLogin);
router.route("/logout").get(userLogout);

router.route("/get-team").get(verifyJWT, isAdmin, getTeamList);
router.route("/notifications").get(verifyJWT, getNotificationsList);

router.route("/profile").put(verifyJWT, updateUserProfile);
router.route("/read-noti").put(verifyJWT, markNotificationRead);

// //   FOR ADMIN ONLY - ADMIN ROUTES
router
  .route("/:id")
  .put(verifyJWT, isAdmin, activateUserProfile)
  .delete(verifyJWT, isAdmin, deleteUserProfile);

module.exports = router;
