const path = require("path");
const multer = require("multer");

//* Photo Storage
const photoStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../images"));
  },
  filename: function (req, file, callback) {
    if (file) {
      callback(
        null,
        new Date().toISOString().replace(/:/g, "-") + file.originalname
      );
    } else {
      callback(null, false);
    }
  },
});

//& Photo Upload Middleware
const photoUpload = multer({
  storage: photoStorage,
  fileFilter: function (req, file, callback) {
    if (file.mimetype.startsWith("image")) {
      callback(null, true);
    } else {
      callback({ message: "unsupported file format" }, false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 3, //^ 1 MegaBytes
  },
});

module.exports = photoUpload;
