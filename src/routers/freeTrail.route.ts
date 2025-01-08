import express from  'express'
const router = express.Router();
import {catchAsync} from '../utils/catchAsync.js';

import {isAuthenticatedCompany} from '../middlewares/isAuthenticatedCompany.js';
import { addCompanyFreeTrail}from '../controllers/freeTrail.controller.js'
router.post('/:id', catchAsync(addCompanyFreeTrail));
export default router;