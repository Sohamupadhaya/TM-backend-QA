import express from "express";
const router = express.Router();
import { CompanyPhoto } from "../lib/multer.js";

import {
  actualTimeOfCompany,
  getAllEmployeeOfCompany,
  getAllEmployeeOfDepartment,
  getAllEmployeeOfTeams,
  loginCompany,
  registerCompany,
  updateActualCompanyTime,
  verifyCompanyRegistrationOTP,
  forgetPassword,
  verifyForgetPwOTP,
  resetPw,
  changePassword,
  getActualTimeOfCompany,
  companyProfile,
  getEmployeeProfileDetails,
  googleLoginCompany,
  uploadCompanyPhoto,
  removeCompanyPhoto,
  getLoginAllUserHistory

} from "../controllers/company.controller.js";
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { checkPermission } from "../middlewares/rolePermission.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js";
import { authentication } from "../middlewares/authentication.js";

router.post("/register", catchAsync(registerCompany));
router.post("/login", catchAsync(loginCompany));
router.post("/google-login", catchAsync(googleLoginCompany));
router.post(
  "/verify-company-registration-otp",
  catchAsync(verifyCompanyRegistrationOTP)
);
router.post("/forget-password", catchAsync(forgetPassword));
router.post("/verify-forget-pw-otp", catchAsync(verifyForgetPwOTP));
router.patch("/reset-password", catchAsync(resetPw));

router.get(
  "/employee-profile/:employeeId",
  isAuthenticated,
  catchAsync(getEmployeeProfileDetails)
);

router.post("/actual-company-time", catchAsync(isAuthenticated), checkPermission('postActualTime','company'), catchAsync(actualTimeOfCompany));
router.patch("/update-company-time/:actualTimeId", catchAsync(isAuthenticated), checkPermission('editActualTime','company'), catchAsync(updateActualCompanyTime));
router.get("/company-actual-time", isAuthenticated, checkPermission('getActualTime','company'),catchAsync(getActualTimeOfCompany))
router.patch("/change-password", isAuthenticated, checkPermission('editPassowrd','company'), catchAsync(changePassword))
router.get("/all-employees", isAuthenticated, checkPermission('getAllEmployee','company'),catchAsync(getAllEmployeeOfCompany))
router.get("/all-employees-department/:departmentId",isAuthenticated, checkPermission('getDepartmentEmployee','company'),catchAsync(getAllEmployeeOfDepartment))
router.get("/all-employees-team/:teamId",isAuthenticated, checkPermission('getTeamEmployee','company'),catchAsync(getAllEmployeeOfTeams))
router.get("/profile",isAuthenticated, checkPermission('getProfile','company'),catchAsync(companyProfile))
router.post("/upload-photo/:companyId", CompanyPhoto.single("photo"), isAuthenticated, checkPermission('uploadCompanyProfile','company'), catchAsync(uploadCompanyPhoto))
router.patch("/remove-company-photo", isAuthenticated, checkPermission('removeCompanyProfile','company'), catchAsync(removeCompanyPhoto))
router.get("/get-login-all-user-history", authentication, checkPermission('getLoginAllUserHistory','company'),catchAsync(getLoginAllUserHistory))

router.patch(
  "/change-password",
  isAuthenticated,
  checkPermission("editPassowrd", "company"),
  catchAsync(changePassword)
);
router.get(
  "/all-employees",
  isAuthenticated,
  checkPermission("getAllEmployee", "company"),
  catchAsync(getAllEmployeeOfCompany)
);
router.get(
  "/all-employees-department/:departmentId",
  isAuthenticated,
  checkPermission("getDepartmentEmployee", "company"),
  catchAsync(getAllEmployeeOfDepartment)
);
router.get(
  "/all-employees-team/:teamId",
  isAuthenticated,
  checkPermission("getTeamEmployee", "company"),
  catchAsync(getAllEmployeeOfTeams)
);
router.get(
  "/profile",
  isAuthenticated,
  checkPermission("getProfile", "company"),
  catchAsync(companyProfile)
);
router.post(
  "/upload-photo/:companyId",
  CompanyPhoto.single("photo"),
  isAuthenticated,
  checkPermission("uploadCompanyProfile", "company"),
  catchAsync(uploadCompanyPhoto)
);
router.patch(
  "/remove-company-photo",
  isAuthenticated,
  checkPermission("removeCompanyProfile", "company"),
  catchAsync(removeCompanyPhoto)
);

export default router;
