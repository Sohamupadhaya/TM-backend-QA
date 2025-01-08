import express from 'express';
const router = express.Router();
import {catchAsync} from '../utils/catchAsync.js';
import {
  updateKeyword,
  deleteKeyword,
  addKeyWords,
  getAllKeywords,
  getAllKeywordsForEmployee,
  foundKeyword,
  // captureAndExtractText,
} from '../controllers/keyword.controller.js';
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"
import {isAuthenticatedCompany} from '../middlewares/isAuthenticatedCompany.js';
import {isAuthenticatedEmployee} from '../middlewares/isAuthenticatedEmployee.js';

router.post('/keyword-found',catchAsync(isAuthenticatedEmployee),foundKeyword);

router.post('/add-keyword', isAuthenticated, checkPermission('add', 'keyword'), addKeyWords);
router.get('/get', isAuthenticated, checkPermission('add', 'keyword'), getAllKeywords);
router.get('/by-employee', catchAsync(isAuthenticatedEmployee),getAllKeywordsForEmployee)
router.delete('/delete', isAuthenticated, checkPermission('add', 'keyword'), catchAsync(deleteKeyword));
router.patch('/update-keyword', isAuthenticated, checkPermission('add', 'keyword'), catchAsync(updateKeyword));
export default router;