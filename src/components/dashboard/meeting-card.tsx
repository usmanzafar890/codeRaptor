"use client";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadFile } from "@/lib/firebase";
import { Presentation, Upload } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/trpc/react";
import useProject from "@/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

const MeetingCard = () => {
  const { project } = useProject();
  const processMeeting = useMutation({
    mutationFn: async (data: {
      meetingUrl: string;
      meetingId: string;
      projectId: string;
    }) => {
      const { meetingUrl, meetingId, projectId } = data;
      const response = await axios.post("/api/process-meeting", {
        meetingUrl,
        meetingId,
        projectId,
      });
      return response.data;
    },
  });
  const [isUploading, setIsUploading] = React.useState(false);
  const router = useRouter();

  const [progress, setProgress] = React.useState(0);
  const uploadMeeting = api.project.uploadMeeting.useMutation();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 150_000_000,
    onDrop: async (acceptedFiles) => {
      if (!project) return;

      setIsUploading(true);

      const file = acceptedFiles[0];

      if (!file) {
        throw new Error("File object is undefined or invalid");
      }

      const downloadURL = (await uploadFile(
        file as File,
        setProgress,
      )) as string;
      uploadMeeting.mutate(
        {
          projectId: project.id,
          meetingUrl: downloadURL,
          name: file.name,
        },
        {
          onSuccess: (meeting) => {
            toast.success("Meeting uploaded successfully");
            router.push("/meetings");
            processMeeting.mutateAsync({
              meetingUrl: downloadURL,
              meetingId: meeting.id,
              projectId: project.id,
            });
          },
          onError: () => {
            toast.error("Failed to upload meeting");
          },
        },
      );
      setIsUploading(false);
    },
  });
  return (
    <Card
      className="col-span-2 flex flex-col items-center justify-center p-10"
      {...getRootProps()}
    >
      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce" />
          <h3 className="mt-2 items-center text-center text-sm font-semibold text-gray-900">
            Create a new meeting
          </h3>
          <p className="text-center">
            Analyze your meetings with Code Raptor
            <br />
            Powered by AI.
          </p>
          <div className="mt-6">
            <Button disabled={isUploading}>
              <Upload className="mr-1.5 ml-0.5 h-5 w-5" aria-hidden="true" />
              Upload Meeting
              <input className="hidden" {...getInputProps()} />
            </Button>
          </div>
        </>
      )}
      {isUploading && (
        <>
          <div className="">
            <CircularProgressbar
              value={progress}
              text={`${progress}%`}
              className="size-20"
              styles={buildStyles({
                pathColor: "#0070f3",
                textColor: "#0070f3",
              })}
            />
            <p className="text-center text-sm text-gray-500">
              Uploading your meeting...
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default MeetingCard;
