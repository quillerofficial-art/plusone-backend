import { Request, Response } from 'express'
import Razorpay from 'razorpay'
import { supabase } from '../config/supabase'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Create subscription order with plan
export const createSubscription = async (req: Request, res: Response) => {
  const { planId } = req.body
  if (!planId) {
    return res.status(400).json({ message: 'Plan ID required' })
  }

  try {
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return res.status(400).json({ message: 'Invalid plan' })
    }

    const options = {
      amount: plan.amount, // already in paise
      currency: 'INR',
      receipt: `receipt_${req.user!.id}_${Date.now()}`,
      payment_capture: 1,
    }

    const order = await razorpay.orders.create(options)

    // Save order with plan info
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: req.user!.id,
        razorpay_order_id: order.id,
        amount: Number (order.amount) / 100,
        status: 'created',
        subscription_start: null, // will set on verification
        subscription_end: null,
        plan_id: plan.id, // we need to add this column first
      })

    if (error) throw error

    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error creating order' })
  }
}

// Verify payment (webhook)
export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (expectedSignature === razorpay_signature) {
    try {
      // Get transaction and plan details
      const { data: transaction, error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: 'paid',
        })
        .eq('razorpay_order_id', razorpay_order_id)
        .select()
        .single()

      if (updateError || !transaction) throw updateError

      // Get plan
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('duration_months')
        .eq('id', transaction.plan_id)
        .single()

      const startDate = new Date()
      const endDate = new Date()
      if (plan) {
        endDate.setMonth(endDate.getMonth() + plan.duration_months)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1) // fallback 1 year
      }

      // Update user subscription
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_status: true,
          subscription_expiry: endDate.toISOString(),
        })
        .eq('id', transaction.user_id)

      if (userError) throw userError

      // Update transaction with dates
      await supabase
        .from('payment_transactions')
        .update({
          subscription_start: startDate.toISOString(),
          subscription_end: endDate.toISOString(),
        })
        .eq('id', transaction.id)

      res.json({ status: 'ok', message: 'Payment verified and subscription activated' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Error updating subscription' })
    }
  } else {
    res.status(400).json({ message: 'Invalid signature' })
  }
}