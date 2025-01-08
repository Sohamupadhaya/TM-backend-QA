import express from 'express';
const router = express.Router();
import {catchAsync} from '../utils/catchAsync.js';
import {isAuthenticatedCompany} from '../middlewares/isAuthenticatedCompany.js';

import {isAuthenticatedEmployee} from '../middlewares/isAuthenticatedEmployee.js';
// import { , getUsersForSideBar, sendMessage,markMessagesAsRead } from "../controllers/message.controller.js";
import {
  displayUsersToAddInGroupForCompany,
  getAllRoomForCompany,
  displayUsersToAddInGroup,
  getAllRoomForEmployee,
  sendMessageToRoom,
  markCompanyMessagesAsRead,
  getEmployeeForSideBarDown,
  markEmployeeMessagesAsRead,
  getCompanyForSideBarDown,
  getCompanyMessage,
  getEmployeeMessage,
  getUsersForSideBar,
  markMessagesAsRead,
  sendMessage,
  getMessage,
  sentMessageToCompany,
  sentMessageToEmployee,
  getGroupMessages,
  createGroup,
} from '../controllers/message.controller.js';

import {message} from '../lib/multer.js';
router.get('/conversations', isAuthenticatedEmployee, getUsersForSideBar);
router.get('/conversations-employee', isAuthenticatedEmployee, getCompanyForSideBarDown);
router.get('/:id', isAuthenticatedEmployee, getMessage);
router.post('/send', isAuthenticatedEmployee, message.array('message', 10), sendMessage);
router.get('/getUsers/display', catchAsync(isAuthenticatedEmployee), displayUsersToAddInGroup);
router.post('/employee-sent-message', catchAsync(isAuthenticatedEmployee), message.array('message', 10), catchAsync(sentMessageToCompany),);
router.get( '/employee-sent-message/:id', catchAsync(isAuthenticatedEmployee), catchAsync(getEmployeeMessage),);
router.patch('/read/:id', isAuthenticatedEmployee, markMessagesAsRead);
router.patch('/read-employee/:id', isAuthenticatedEmployee, markEmployeeMessagesAsRead);


router.get('/group-chat/:id', catchAsync(getGroupMessages));
router.post('/group-chat/send/:id', message.array('message', 10), catchAsync(sendMessageToRoom));
router.post('/group-chat/create', catchAsync(createGroup));
router.get('/get-groups/employee', catchAsync(isAuthenticatedEmployee), catchAsync(getAllRoomForEmployee),);

router.get('/conversations-company', isAuthenticatedCompany, getEmployeeForSideBarDown);
router.post('/company-sent-message', catchAsync(isAuthenticatedCompany), message.array('message', 10), catchAsync(sentMessageToEmployee),);
router.get( '/company-sent-message/:id', catchAsync(isAuthenticatedCompany), catchAsync(getCompanyMessage),);
router.patch('/read-company/:id', isAuthenticatedCompany, markCompanyMessagesAsRead);
router.get('/get-groups/company', catchAsync(isAuthenticatedCompany), catchAsync(getAllRoomForCompany),);
router.get('/getUsers/display-company', catchAsync(isAuthenticatedCompany), displayUsersToAddInGroupForCompany);

export default router;
