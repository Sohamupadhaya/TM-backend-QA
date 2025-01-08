import {NextFunction, Request, Response} from 'express';
import prisma from '../../models/index.js';
import paypal from 'paypal-rest-sdk';
// const {PAYPAL_MODE,PAYPAL_CLIENT_KEY,PAYPAL_SECRET_KEY} = process.env
paypal.configure({
  mode: process.env.PAYPAL_MODE!, //sandbox or live
  client_id: process.env.PAYPAL_CLIENT!,
  client_secret: process.env.PAYPAL_SECRET_KEY!,
});

export const payProduct = async (req: Request, res: Response) => {
  const authCompanyId = (req as any).user.companyId;
  console.log('🚀 ~ payProduct ~ authCompanyId:', authCompanyId);
  const {subscriptionId} = req.body;

  const subscriptionPlan = await prisma.subscriptionPlans.findUnique({
    where: {id: subscriptionId},
  });
  if (!subscriptionPlan) {
    return res.status(404).json({message: 'Subscription plan not found'});
  }
  const {price, subscriptionName} = subscriptionPlan;
  const returnUrl = `http://localhost:3000/success?subscriptionId=${subscriptionId}`;

  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: returnUrl,
      cancel_url: returnUrl,
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: subscriptionName,
              price: price.toFixed(2),
              currency: 'USD',
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: 'USD',
          total: price.toFixed(2),
        },
        description: `Subscription for ${subscriptionName}`,
      },
    ],
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error('Paypal Payment creation error:', error);
      return res.status(500).json({message: 'Payment creation failed'});
    } else {
      let approvalUrl = null;
      for (let i = 0; i < payment.links!.length; i++) {
        if (payment.links![i].rel === 'approval_url') 
        {
          approvalUrl = payment.links![i].href;
          break;
        }
      }
      if (approvalUrl) {
        res.json({approvalUrl});
      } else {
        res.status(500).json({message: 'Approval URL not found'});
      }
    }
  });
};

export const successPayment = async (req: Request, res: Response) => {
  const paymentId = req.query.paymentId as string;
  const payerId = {payer_id: req.query.PayerID as string};
  console.log('🚀 ~ successPayment ~ paymentId:', paymentId);
  console.log('🚀 ~ successPayment ~ payerId:', payerId);
  const companyId = (req as any).user.companyId;
  console.log('🚀 ~ successPayment ~ companyId:', companyId);
  const subscriptionPlanId = req.query.subscriptionPlanId as string;
  console.log('🚀 ~ successPayment ~ subscriptionPlanId:', subscriptionPlanId);
  if (!paymentId || !payerId.payer_id || !subscriptionPlanId) {
    return res
      .status(400)
      .json({message: 'Payment ID, Payer ID, or Subscription Plan ID is missing'});
  }
  const subscription = await prisma.subscriptionPlans.findUnique({
    where: {
      id: subscriptionPlanId,
    },
  });
  paypal.payment.execute(paymentId, payerId, async (error, payment) => {
    if (error) {
      console.error('Payment execution error:', error);
      res.status(500).json({message: 'Payment execution failed'});
    } else {
      // Find or create UserSubscription for the company
      let userSubscription = await prisma.userSubscription.findFirst({
        where: {
          companyId: companyId,
          subscriptionPlansId: subscriptionPlanId,
          status: 'ACTIVE',
        },
      });
      console.log('🚀 ~ paypal.payment.execute ~ userSubscription:', userSubscription);
      // If subscription doesn't exist, create one
      const startDate = new Date();
      let endDate = new Date();
      if (subscription?.billingCycle.includes('Days')) {
        const days = parseInt(subscription.billingCycle);
        endDate.setDate(startDate.getDate() + days);
      }
      if (!userSubscription) {
        userSubscription = await prisma.userSubscription.create({
          data: {
            companyId: companyId,
            subscriptionPlansId: subscriptionPlanId,
            startDate: startDate,
            endDate: endDate,
            status: 'ACTIVE',
            autoRenew: true,
          },
        });
      }
      const newPayment = await prisma.payments.create({
        data: {
          companyId: companyId as string,
          userSubscriptionId: userSubscription.id,
          transactionId: payment.id!,
          amount: parseFloat(payment.transactions[0].amount.total),
          paymentDate: new Date(),
          paymentMethod: 'PayPal',
          status: 'SUCCESS',
        },
      });
      const newInvoice = await prisma.invoice.create({
        data: {
          companyId: companyId as string,
          userSubscriptionId: userSubscription.id,
          amount: parseFloat(payment.transactions[0].amount.total),
          issueDate: new Date(),
          dueDate: endDate,
          status: 'PAID',
        },
      });
      res.json({message: 'Payment successful!', payment});
    }
  });
};
