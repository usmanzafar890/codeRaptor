import React from "react";
import QuestionAnswerView from "@/components/question-answer.tsx/question-answer-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const QAPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  return <QuestionAnswerView />;
};
export default QAPage;
