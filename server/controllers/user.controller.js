const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const User = require("../models/User.model");
const Notice = require("../models/notification.model");

const createaccesstoken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesstoken = await user.generateAccessToken();
    console.log(accesstoken
    );
    return { accesstoken };
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
};

const userRegister = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin, role, title } = req.body;
  console.log(req.body);

  const userExist = await User.findOne({ email });
  if (userExist) {
    throw new ApiError(401, "User Already Exist");
  }

  const user = await User.create({
    name,
    email,
    password,
    isAdmin,
    role,
    title,
  });

  if (user) {
    user.isAdmin ? createaccesstoken(user._id) : null;
    // console.log(user.isAdmin ? true : null);
    user.password = undefined;
    return res
      .status(201)
      .json(new ApiResponse(201, { user }, "User Created Successfully"));
  } else {
    throw new ApiError(400, "Invalid User Data!! User didn't created");
  }

});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  console.log(user);
  if (!user) {
    throw new ApiError(401, "Invalid Email or Password");
  }
  if (!user?.isActive) {
    throw new ApiError(401, "Account has been deactived, Contact the admin");
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid Email or Password");
  }
  const { accesstoken } = await createaccesstoken(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -email -isActive"
  );
  const option = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  };
  return res
    .status(200)
    .cookie("token", accesstoken, option)
    .json(new ApiResponse(200, { user: loggedInUser }, "User LoggedIn"));
});

const userLogout = asyncHandler(async (req, res) => {
  const option = {
    httpOnly: true,
    secute: true,
  };
  return res
    .clearCookie("token")
    .json(new ApiResponse(200, {}, "User LoggedOut"));
});

const getTeamList = asyncHandler(async (req, res) => {
  const team = await User.find().select("name email role isActive title");
  res.status(200).json(new ApiResponse(200, { team }, "Team List"));
});

const getNotificationsList = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notification = await Notice.findOne({
    team: userId,
    isRead: { $nin: [userId] },
  }).populate("task", "title");
  res
    .status(200)
    .json(new ApiResponse(200, { notification }, "Notification List"));
});

// const updateUserProfile = asyncHandler(async (req, res) => {
//   const updateUserProfile = asyncHandler(async (req, res) => {
//     const { userId, isAdmin } = req.user;
//     const { _id } = req.body;

//     // Determine the ID to be used based on the user's admin status and the IDs provided.
//     const id = isAdmin ? _id || userId : userId;

//     try {
//       const user = await User.findById(id);
//       if (user) {
//         // Update user fields
//         user.name = req.body.name || user.name;
//         user.role = req.body.role || user.role;
//         user.title = req.body.title || user.title;
//         // Uncomment if these fields should be updated
//         // user.email = req.body.email || user.email;
//         // user.isActive = req.body.isActive || user.isActive;

//         const updatedUser = await user.save();
//         res
//           .status(200)
//           .json(
//             new ApiResponse(200, { user: updatedUser }, "User Profile Updated")
//           );
//       } else {
//         res.status(404).json(new ApiResponse(404, {}, "User Not Found"));
//       }
//     } catch (error) {
//       res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
//     }
//   });
//   const { userId, isAdmin } = req.user;
//   const { _id } = req.body;
//   /**
//    * Determines the ID to be used based on the user's admin status and the IDs provided.
//    * - Line 102: If the user is an admin and is updating their own account, use `userId`.
//    * - Line 103: If the user is an admin but is updating someone else's account, use `_id`.
//    * - Line 104: Otherwise, use `userId`.
//    */
//   const id =
//     isAdmin && userId === _id
//       ? userId
//       : isAdmin && userId !== _id
//       ? _id
//       : userId;
//   const user = await User.findById(id);
//   if (user) {
//     // user.email = req.body.email || user.email
//     // user.isActive = req.body.isActive || user.isActive
//     user.name = req.body.name || user.name;
//     user.role = req.body.role || user.role;
//     user.title = req.body.title || user.title;
//     const updatedUser = await user.save();
//     res
//       .status(200)
//       .json(
//         new ApiResponse(200, { user: updatedUser }, "User Profile Updated")
//       );
//   } else {
//     res.status(404).json(new ApiResponse(404, {}, "User Not Found"));
//   }
// });

const updateUserProfile = asyncHandler(async (req, res) => {
  const { _id, isAdmin } = req.user;
  const { userId } = req.body;

  // Determine the ID to be used based on the user's admin status and the IDs provided.
  const id =
    isAdmin && _id === userId ? _id : isAdmin && _id !== userId ? userId : _id;

  try {
    const user = await User.findById(id).select("-password");
    if (user) {
      // Update user fields
      user.name = req.body.name || user.name;
      user.role = req.body.role || user.role;
      user.title = req.body.title || user.title;
      // Uncomment if these fields should be updated
      // user.email = req.body.email || user.email;
      // user.isActive = req.body.isActive || user.isActive;

      const updatedUser = await user.save();
      res
        .status(200)
        .json(
          new ApiResponse(200, { user: updatedUser }, "User Profile Updated")
        );
    } else {
      res.status(404).json(new ApiError(404, "User Not Found"));
    }
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, error?.message || "Internal Server Error"));
  }
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { isReadType, id } = req.query;

  if (isReadType === "all") {
    await Notice.updateMany(
      { team: _id, isRead: { $nin: [_id] } },
      { $push: { isRead: _id } },
      { new: true }
    );
  } else {
    await Notice.findByIdAndUpdate(
      { _id: id },
      { $push: { isRead: _id } },
      { new: true }
    );
  }
  return res.status(200).json(new ApiResponse(200, {}, "Notification Read"));
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { newPassword } = req.body;
  if (!newPassword)
    return res
      .status(500)
      .json(new ApiError(500, {}, "newpassword field can't be empty"));
  const user = await User.findById(_id);

  if (user) {
    user.password = newPassword;
    await user.save({ validationBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"));
  } else {
    return res.status(404).json(new ApiError(404,"User Not Found"));
  }
});

const activateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (user) {
    user.isActive = req.body.isActive; //!user.isActive

    await user.save();

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {},
          `User account has been ${user?.isActive ? "activated" : "disabled"}`
        )
      );
  } else {
    res.status(404).json(new ApiError(404, "User Not Found"));
  }
})

const deleteUserProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    return res
      .status(400)
      .json(new ApiError(400, error?.message || "Failed to delete user"));
  }
});

module.exports = {
  userRegister,
  userLogin,
  userLogout,
  getTeamList,
  getNotificationsList,
  updateUserProfile,
  markNotificationRead,
  changeUserPassword,
  activateUserProfile,
  deleteUserProfile,
};