"use server"
import { redirect } from "next/navigation"
import Stripe from "stripe"

// stripe webhook for demo payments to work
// C:\Users\khans\Downloads\stripe_1.28.0_windows_x86_64\stripe.exe listen --forward-to localhost:3000/api/webhook/stripe

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-06-30.basil",
})

export async function createCheckoutSession(credits: number, userId: string) {
    if (!userId) {
        throw new Error('Headers are required for session retrieval');
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `${credits} Raptor Credits`
                    },
                    unit_amount: Math.round((credits / 50) * 100)
                },
                quantity: 1
            }
        ],
        customer_creation: `always`,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        client_reference_id: userId.toString(),
        metadata: {
            credits
        }

    })

    return redirect(session.url!)

}





