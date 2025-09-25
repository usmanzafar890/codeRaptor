"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import useProject from "@/hooks/use-project";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import React from "react";
import Image from "next/image";
import { askQuestion } from "./actions";
import { readStreamableValue } from "ai/rsc";
import { DialogTitle } from "@radix-ui/react-dialog";
import MDEditor from "@uiw/react-md-editor";
import CodeReferences from "./code-references";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer(""); // Reset answer when asking a new question
    setFilesReferences([]);
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);

    try {
      const { output, filesReferences } = await askQuestion(
        question,
        project.id,
      );
      setOpen(true);
      setFilesReferences(filesReferences || []);

      // Process the stream
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAnswer((ans) => ans + delta);
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      setAnswer("An error occurred while processing your question.");
    } finally {
      setLoading(false);
    }
  };
  const refetch = useRefetch();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[90vh] flex-col sm:max-w-[80vw]"
          data-color-mode="light"
        >
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle>
                <Image src="/logo.svg" alt="logo" width={40} height={40} />
              </DialogTitle>
              <Button
                disabled={saveAnswer.isPending}
                variant={"outline"}
                onClick={() => {
                  saveAnswer.mutate(
                    {
                      projectId: project!.id,
                      question,
                      filesReferences,
                      answer,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Answer saved successfully");
                        refetch();
                      },
                      onError: () => {
                        toast.error("Failed to save answer");
                      },
                    },
                  );
                }}
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-scroll">
            <MDEditor.Markdown source={answer} className="w-full" />
            <CodeReferences filesReferences={filesReferences} />
          </div>

          <div className="flex-shrink-0 pt-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h4"></div>
            <Button type="submit" disabled={loading}>
              Ask Raptor
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
