import type { FirebaseError } from "firebase/app";

export type AuthMode = "login" | "signup";

export function mapAuthErrorMessage(error: unknown, mode: AuthMode): string {
  const code = (error as FirebaseError | undefined)?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
      return "Incorrect email address or password.";
    case "auth/user-not-found":
      return "No user was found with this email address.";
    case "auth/wrong-password":
      return "The password is incorrect.";
    case "auth/invalid-email":
      return "The email format is invalid.";
    case "auth/email-already-in-use":
      return "This email address is already registered.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Please check your network connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a while and try again.";
    default:
      return mode === "login"
        ? "Login failed. Please check your input."
        : "Account creation failed. Please check your input.";
  }
}
