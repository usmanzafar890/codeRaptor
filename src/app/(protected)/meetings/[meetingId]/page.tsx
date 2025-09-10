import IssuesList from "@/components/meetings/issues-list"
import React from "react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

type Props = {
    params: Promise<{ meetingId: string }>
}

const MeetingDetailsPage = async ({ params }: Props) => {
    const { meetingId } = await params
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        redirect("/login");
    }
    return (
        <IssuesList meetingId={meetingId} />
    )
}

export default MeetingDetailsPage