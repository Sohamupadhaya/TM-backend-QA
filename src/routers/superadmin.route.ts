// import express from "express"
// const router = express.Router()
// import { catchAsync } from "../utils/catchAsync.js"
// import { approveOrDenyCompany, displayAllCompanies, displayAllVerifiedAndApprovedCompanies, displayAllVerifiedCompanies, displayAllVerifiedNotApprovedCompanies, loginSuperAdmin } from "../controllers/superadmin.controller.js"
// import { isAuthenticatedSuperAdmin } from "../middlewares/isAuthenticatedSuperAdmin.js"


// router.patch("/company-approve-status", catchAsync(isAuthenticatedSuperAdmin), catchAsync(approveOrDenyCompany))
// router.post("/login",catchAsync(loginSuperAdmin))
// router.get("/all-companies", catchAsync(isAuthenticatedSuperAdmin), catchAsync(displayAllCompanies))
// router.get("/all-verified-companies", catchAsync(isAuthenticatedSuperAdmin), catchAsync(displayAllVerifiedCompanies))
// router.get("/all-verified-not-approved-companies", catchAsync(isAuthenticatedSuperAdmin), catchAsync(displayAllVerifiedNotApprovedCompanies))
// router.get("/all-verified-and-approved-companies", catchAsync(isAuthenticatedSuperAdmin), catchAsync(displayAllVerifiedAndApprovedCompanies))

// export default router