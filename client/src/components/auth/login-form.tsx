"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
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
import { useLoginMutation } from "@/features/auth/auth-api";
import { formatCountdown, useCountdown } from "@/hooks/use-countdown";
import { getErrorMessage, getFieldErrors, isApiError } from "@/lib/api-error";
import { HOME_BY_ROLE } from "@/lib/routes";
import { loginSchema, type LoginValues } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  // True only after a successful login, until the next page has loaded. (react-hook-form's own
  // `isSubmitSuccessful` can't be used: we catch errors ourselves, so it would also be true
  // after a failed attempt and lock the button for good.)
  const [redirecting, setRedirecting] = useState(false);
  const waitToRetry = useCountdown();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    // Check a field when the user leaves it, then keep re-checking as they fix it.
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const user = await login(values).unwrap();
      toast.success(`Welcome back, ${user.name}`);
      setRedirecting(true);
      router.replace(HOME_BY_ROLE[user.role]);
    } catch (error) {
      // A message about one field goes under that field...
      const fieldErrors = getFieldErrors(error);
      for (const field of ["email", "password"] as const) {
        if (fieldErrors[field]) setError(field, { message: fieldErrors[field] });
      }

      // ...anything else (wrong password, deactivated account, server down) goes in the alert.
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error));

      // Too many attempts: keep the button off for as long as the server asked.
      if (isApiError(error) && error.status === 429 && error.retryAfter) {
        waitToRetry.start(error.retryAfter);
      }
    }
  });

  const isWaiting = waitToRetry.seconds > 0;
  const isBusy = isLoading || redirecting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Log in to submit or review projects.</CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent>
          <FieldGroup>
            {formError && <FormAlert message={formError} />}

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
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Button type="submit" disabled={isBusy || isWaiting}>
              {isBusy && <Loader2 className="animate-spin" />}
              {isWaiting ? `Try again in ${formatCountdown(waitToRetry.seconds)}` : "Log in"}
            </Button>
          </FieldGroup>
        </CardContent>
      </form>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?&nbsp;
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
