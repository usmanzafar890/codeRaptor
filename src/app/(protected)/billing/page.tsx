import React from "react"
import BillingView from "@/components/billing/billing-view"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const BillingPage = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    return (
        <BillingView />
    )
}

export default BillingPage
