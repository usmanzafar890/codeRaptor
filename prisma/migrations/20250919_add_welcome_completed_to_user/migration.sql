-- Add welcomeCompleted field to User model
ALTER TABLE "user" ADD COLUMN "welcomeCompleted" BOOLEAN NOT NULL DEFAULT false;
