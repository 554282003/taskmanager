const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // console.log(req.cookies.token,'cookies');
    const token = req.cookies?.token || req.header("Authorization");
    // console.log(token,'token');
    
    if (!token) {
      throw new ApiError(401, "Unauthorized access");
    }
    const decodedtoken = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decodedtoken,'decodedtoken');
    const user = await User.findById(decodedtoken._id).select("isAdmin email");
    req.user = user;
    // console.log(req.user,'user');
    
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  try {
    const admin = req.user && req.user.isAdmin
    // console.log(req.user);
    if (!admin) {
        throw new ApiError(401,"You are not admin,so you don't have access")
    }
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Don't Have Access");
  }
});

module.exports = {verifyJWT,isAdmin};