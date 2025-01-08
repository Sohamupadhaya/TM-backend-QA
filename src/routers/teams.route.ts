import express from "express"
const router = express.Router()
import { createTeam, deleteTeam, getAllTeamOfTheCompany, getAllTeamOfTheDepartment, getTeam, updateTeam} from "../controllers/teams.controller.js"
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"


router.post("/create-team", isAuthenticated,checkPermission('create','team'), catchAsync(createTeam))
router.get("/get-all-team-of-company",isAuthenticated,checkPermission('get','team'), catchAsync(getAllTeamOfTheCompany))
router.get("/get-all-team-of-department/:departmentId",isAuthenticated,checkPermission('get', 'team'), catchAsync(getAllTeamOfTheDepartment))
router.get("/get-team",isAuthenticated,checkPermission('get', 'team'), catchAsync(getTeam))
router.patch("/update-team",  isAuthenticated,checkPermission('edit', 'team'), catchAsync(updateTeam))
router.delete("/delete-team/:teamId/:departmentId",isAuthenticated,checkPermission('delete', 'team'), catchAsync(deleteTeam))



export default router