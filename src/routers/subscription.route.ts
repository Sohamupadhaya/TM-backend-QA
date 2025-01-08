import express from 'express';
import {payProduct, successPayment} from '../controllers/subscription/paypal.controller.js';
import {
  addSubscriptionPlans,
  getSubscriptionPlans,
  checkSubscriptionStatus,
} from '../controllers/subscription/subscription.controller.js';
import {catchAsync} from '../utils/catchAsync.js';
import {isAuthenticatedCompany} from '../middlewares/isAuthenticatedCompany.js';
import {payment} from '../controllers/subscription/stripe.controller.js';
const router = express.Router();
//for Paypal
// router.post('/', catchAsync(isAuthenticatedCompany), payProduct);
// router.get('/success', catchAsync(isAuthenticatedCompany), catchAsync(successPayment));
// router.post(
//   '/add-subscription',
//   catchAsync(isAuthenticatedCompany),
//   catchAsync(addSubscriptionPlans),
// );
// router.get(
//   '/get-subscription',
//   catchAsync(isAuthenticatedCompany),
//   catchAsync(getSubscriptionPlans),
// );
// router.get(
//   '/check-status',
//   catchAsync(isAuthenticatedCompany),
//   catchAsync(checkSubscriptionStatus),
// );

// //For Stripe :)
// router.post('/stripe/payment', catchAsync(isAuthenticatedCompany), catchAsync(payment));
export default router;
