import {Request, Response} from 'express';
import Stripe from 'stripe';
import prisma from '../../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const payment = async (req: Request, res: Response) => {
  console.log('haha');
  const companyId = (req as any).user.companyId;
  console.log('🚀 ~ payment ~ companyId:', companyId);

  const {stripeEmail, stripeToken, amount, productName, subscriptionId, billingCycle} = req.body;
  console.log('🚀 ~ payment ~ subscriptionId:', subscriptionId);
  console.log('🚀 ~ payment ~ billingCycle:', billingCycle);
  console.log('🚀 ~ payment ~ productName:', productName);
  console.log('🚀 ~ payment ~ amount:', amount);
  console.log('🚀 ~ payment ~ stripeToken:', stripeToken);
  console.log('🚀 ~ payment ~ stripeEmail:', stripeEmail);

  if (!stripeEmail || !stripeToken || !amount || !productName || !companyId || !subscriptionId) {
    return res.status(400).send('Missing required payment information');
  }

  const customer = await stripe.customers.create({
    email: stripeEmail,
    source: stripeToken,
    name: req.body.name,
    address: {
      line1: req.body.address.line1,
      postal_code: req.body.address.postal_code,
      city: req.body.address.city,
      state: req.body.address.state,
      country: req.body.address.country,
    },
  });
  console.log('🚀 ~ payment ~ customer:', customer);
  const charge = await stripe.charges.create({
    amount: amount * 100, //stipe uses cents for amount
    description: `Subscripton payment for ${productName}`,
    currency: 'USD',
    customer: customer.id,
  });
  console.log('🚀 ~ payment ~ charge:', charge);
  //calculate the end date based on the billing cycle
  const startDate = new Date();
  let endDate = new Date();
  if (billingCycle.includes('Days')) {
    const days = parseInt(billingCycle);
    endDate.setDate(startDate.getDate() + days);
  }
  console.log('🚀 ~ payment ~ endDate:', endDate);

  const newSubscription = await prisma.userSubscription.create({
    data: {
      companyId,
      subscriptionPlansId: subscriptionId,
      startDate: new Date(),
      endDate, // assuming 1 month subscription
      status: 'ACTIVE',
      autoRenew: true,
    },
  });
  console.log('🚀 ~ payment ~ newSubscription:', newSubscription);
  const newPayment = await prisma.payments.create({
    data: {
      companyId,
      userSubscriptionId: newSubscription.id,
      transactionId: charge.id,
      amount: amount,
      paymentDate: new Date(),
      paymentMethod: 'Stripe',
      status: 'SUCCESS',
    },
  });
  console.log('🚀 ~ payment ~ newPayment:', newPayment);
  await prisma.invoice.create({
    data: {
      companyId,
      userSubscriptionId: newSubscription.id,
      amount: amount,
      issueDate: new Date(),
      dueDate: endDate, // 1 month subscription
      status: 'PAID',
    },
  });
  return res.status(200).send({
    success: true,
    message: 'Payment successful and subscription details stored',
    payment: newPayment,
    subscription: newSubscription,
  });
};
