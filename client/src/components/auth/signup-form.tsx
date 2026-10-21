"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { PasswordRules } from "@/components/auth/password-rules";
import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSignupMutation } from "@/features/auth/auth-api";
import { formatCountdown, useCountdown } from "@/hooks/use-countdown";
import { getErrorMessage, getFieldErrors, isApiError } from "@/lib/api-error";
import { HOME_BY_ROLE } from "@/lib/routes";
import { PASSWORD_RULES, signupSchema, type SignupValues } from "@/lib/validations";

const FIELDS = ["name", "email", "password"] as const;

export function SignupForm() {
  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();
  const [formError, setFormError] = useState<string | null>(null);
  // Set only after a successful signup, until the next page has loaded.
  const [redirecting, setRedirecting] = useState(false);
  const waitToRetry = useCountdown();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  // The live value of the password field, for the checklist under it.
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null);

    try {
      // confirmPassword is only for the browser; the API never sees it.
      const user = await signup({ name, email, password }).unwrap();
      toast.success("Account created. Welcome!");
      setRedirecting(true);
      router.replace(HOME_BY_ROLE[user.role]);
    } catch (error) {
      // e.g. a 409 "email already registered" comes with the field name, so it lands under Email.
      const fieldErrors = getFieldErrors(error);
      for (const field of FIELDS) {
        if (fieldErrors[field]) setError(field, { message: fieldErrors[field] });
      }
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error));

      if (isApiError(error) && error.status === 429 && error.retryAfter) {
        waitToRetry.start(error.retryAfter);
      }
    }
  });

  // A broken password rule is already shown (in red) by the checklist, so only say it in words
  // when it is something the checklist doesn't list (too long, or a message from the server).
  const passwordError = PASSWORD_RULES.some((rule) => rule.message === errors.password?.message)
    ? undefined
    : errors.password;

  const isWaiting = waitToRetry.seconds > 0;
  const isBusy = isLoading || redirecting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Sign up as a student to submit your project.</CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent>
          <FieldGroup>
            {formError && <FormAlert message={formError} />}

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <PasswordRules value={password} invalid={!!errors.password} />
              <FieldError errors={[passwordError]} />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>

            <Button type="submit" disabled={isBusy || isWaiting}>
              {isBusy && <Loader2 className="animate-spin" />}
              {isWaiting ? `Try again in ${formatCountdown(waitToRetry.seconds)}` : "Sign up"}
            </Button>
          </FieldGroup>
        </CardContent>
      </form>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/login" className="font-medium text-link hover:underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
