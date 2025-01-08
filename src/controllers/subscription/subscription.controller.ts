import {NextFunction, Request, Response} from 'express';
import prisma from '../../models/index.js';
import paypal from 'paypal-rest-sdk';

export const addSubscriptionPlans = async (req: Request, res: Response) => {
  const {subscriptionName, price, billingCycle, feature} = req.body;
  if (!subscriptionName || price === undefined || !billingCycle || feature) {
    return res.status(400).json({message: 'All fields are required.'});
  }
  const newPlan = await prisma.subscriptionPlans.create({
    data: {
      price,
      subscriptionName,
      billingCycle,
      feature,
    },
  });
  return res.status(201).json(newPlan);
};
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  const subscriptions = await prisma.subscriptionPlans.findMany();
  return res.status(201).json(subscriptions);
};
// //{
//     "subscriptionName": "Basic Plan",
//     "price": 10,
//     "billingCycle": "2024-01-01T00:00:00.000Z",  // Use the desired date format
//     "feature": {
//         "storage": "10GB",
//         "support": "Email support",
//         "duration": "1 month"
//     }
// }

export const checkSubscriptionStatus = async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId;
  const userSubscription = await prisma.userSubscription.findFirst({
    where: {
      companyId: companyId,
      status: 'ACTIVE',
    },
    include: {
      subscription: true,
    },
  });
  if (!userSubscription) {
    return res.status(404).json({message: 'No active subscription found.'});
  }
  const currentDate = new Date();
  const timeLeft = userSubscription.endDate.getTime() - currentDate.getTime();
  //To calculate days,hours, minutes remaining
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  if (timeLeft <= 0) {
    await prisma.userSubscription.update({
      where: {id: userSubscription.id},
      data: {status: 'EXPIRED'},
    });
    return res.status(200).json({message: 'Subscription has expired.'});
  }
  return res.status(200).json({
    message: 'Active subscription Found.',
    subscriptionPlanId: userSubscription.subscription.id,
    subscriptionPlan: userSubscription.subscription.subscriptionName,
    price: userSubscription.subscription.price,
    startDate: userSubscription.startDate,
    endDate: userSubscription.endDate,
    timeLeft: {
      days: daysLeft,
      hours: hoursLeft,
      minutes: minutesLeft,
    },
  });
};
