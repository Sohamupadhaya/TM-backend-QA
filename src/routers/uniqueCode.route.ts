import express from "express"
const router=express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { getUniqueCode, setCompanyCode } from "../controllers/uniqueCode.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";


router.patch('/update',isAuthenticated,catchAsync(setCompanyCode))
router.get('/get',isAuthenticated,catchAsync(getUniqueCode))
export default router