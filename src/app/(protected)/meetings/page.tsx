import React from "react"
import MeetingView from "@/components/meetings/meeting-view"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const MeetingsPage = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }
    return (
        <MeetingView />
    )
}


export default MeetingsPage