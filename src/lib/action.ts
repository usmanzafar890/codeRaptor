"use server";

import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { APIError } from "better-auth/api";

interface State {
  errorMessage?: string | null;
  successMessage?: string | null;
}

export async function signIn(prevState: State, formData: FormData) {
  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { email, password } = rawFormData;

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    return { successMessage: "Sign-in successful! Redirecting..." };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNAUTHORIZED":
          return { errorMessage: "User Not Found." };
        case "BAD_REQUEST":
          return { errorMessage: "Invalid email." };
        default:
          return { errorMessage: "Something went wrong." };
      }
    }
    console.error("sign in with email has not worked", error);
    throw error;
  }
}

export async function signUp(prevState: State, formData: FormData) {
  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    firstName: formData.get("firstName") as string,
  };

  const { email, password, firstName } = rawFormData;

  try {
    await auth.api.signUpEmail({
      body: {
        name: `${firstName}`,
        email,
        password,
      },
    });
    return { successMessage: "Sign-up successful! Redirecting..." };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNPROCESSABLE_ENTITY":
          return { errorMessage: "User already exists." };
        case "BAD_REQUEST":
          return { errorMessage: "Invalid email." };
        default:
          return { errorMessage: "Something went wrong." };
      }
    }
    console.error("sign up with email and password has not worked", error);
  }
  redirect("/dashboard");
}

export async function searchAccount(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return !!user;
}