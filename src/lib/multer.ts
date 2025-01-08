import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const storageScreenShot = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/screenshot/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const storageTimelapseVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/timelapsevideo/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const storageAppLogo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/appLogo/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const storageAppLogoByCompany = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/appLogoByCompany/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const storageCompanyPhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/CompanyPhoto/");
  },
  filename: function (req, file, cb) {
    console.log("🚀 ~ file:", file);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define a folder to store video chunks
const VIDEO_DIR = path.join(__dirname, "videos");

// Ensure the directory exists
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR);
}

const storageChunkVideo = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination for video chunks
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    // Set the filename for each uploaded chunk
    const chunkFilename = `video-chunk-${Date.now()}.webm`;
    cb(null, chunkFilename);
  },
});

const storageMessage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/message/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const storageUserPhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/UserPhoto/";

    // Check if the directory exists; if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    console.log("🚀 ~ file:", file);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, filename + "-" + uniqueSuffix + "." + fileExtension);
  },
});

// const storageCompanyPhoto = multer.diskStorage({
//       destination: function (req, file, cb) {
//           cb(null, "uploads/CompanyPhoto/");
//       },
//       filename: function (req, file, cb) {
//               console.log("🚀 ~ file:", file)

//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       const filename = file.originalname.split(".")[0];
//       const fileExtension = file.originalname.split(".").pop();
//       cb (null, filename + "-" + uniqueSuffix + "." + fileExtension);
//       },
//   });

export const screenshot = multer({
  storage: storageScreenShot,
});

export const timelapse = multer({
  storage: storageTimelapseVideo,
});

export const appLogo = multer({
  storage: storageAppLogo,
});

export const appLogoByCompany = multer({
  storage: storageAppLogoByCompany,
});

export const chunkVideoUpload = multer({
  storage: storageChunkVideo,
});
export const message = multer({
  storage: storageMessage,
});

export const CompanyPhoto = multer({
  storage: storageCompanyPhoto,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/profile_pictures/");
  },
  filename: (req, file, cb) => {
    const employeeId = (req as any).user.employeeId;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${employeeId}${ext}`);
  },
});

export const userPhoto = multer({
  storage: storageUserPhoto,
});

export const upload = multer({ storage });
