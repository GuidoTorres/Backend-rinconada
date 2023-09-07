const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

const uploadFile = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: "./upload/images",

    filename: function (req, res, cb) {
      //poner nombres diferentes a cada imagen
      cb(null, Date.now() + path.extname(res.originalname));
    },
  });
  const upload = multer({ storage: storage }).single("image");

  return upload;
};

// const helperImage = (filePath, fileName, size = 100) => {
//   return sharp(filePath).resize(size).toFile(`./optimizeImage/${fileName}`);
// };
module.exports = uploadFile;
