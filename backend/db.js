require("dotenv").config();

module.exports = {
  mongoUrl: process.env.MONGO_URL,
  jwt_secret: process.env.JWT_SECRET,

  // cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
