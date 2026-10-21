"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitProjectMutation } from "@/features/project/project-api";
import { formatCountdown, useCountdown } from "@/hooks/use-countdown";
import { getErrorMessage, getFieldErrors, isApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { projectSchema, type ProjectValues } from "@/lib/validations";

const FIELDS = ["name", "repoUrl", "liveUrl", "description"] as const;
const DESCRIPTION_MAX = 1000;
const EMPTY: ProjectValues = { name: "", repoUrl: "", liveUrl: "", description: "" };

export function ProjectForm() {
  const [submitProject, { isLoading }] = useSubmitProjectMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const waitToRetry = useCountdown();

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    control,
    formState: { errors },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  const descriptionLength = useWatch({ control, name: "description" }).length;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await submitProject(values).unwrap();
      toast.success("Project submitted. A mentor will review it soon.");
      // Start over for the next project. (The list next to this form refreshes by itself:
      // submitting marks the student's own projects as stale.)
      reset(EMPTY);
      // reset() unregisters the fields until the next render, so focusing right now finds
      // nothing. Wait one tick, then put the cursor back on the first field.
      setTimeout(() => setFocus("name"), 0);
    } catch (error) {
      // The server says which field is wrong, e.g. a duplicate puts the message under
      // "Repo URL" or "Live link". The user's text is kept so they only fix that one field.
      const fieldErrors = getFieldErrors(error);
      for (const field of FIELDS) {
        if (fieldErrors[field]) setError(field, { message: fieldErrors[field] });
      }
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error));

      // Submitting too fast: keep the button off for as long as the server asked.
      if (isApiError(error) && error.status === 429 && error.retryAfter) {
        waitToRetry.start(error.retryAfter);
      }
    }
  });

  const isWaiting = waitToRetry.seconds > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Submit a project</CardTitle>
        <CardDescription>
          Each repository and live link can be submitted only once.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent>
          <FieldGroup>
            {formError && <FormAlert message={formError} />}

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Project name</FieldLabel>
              <Input
                id="name"
                autoComplete="off"
                placeholder="My portfolio website"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.repoUrl}>
              <FieldLabel htmlFor="repoUrl">Repo URL</FieldLabel>
              <Input
                id="repoUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://github.com/owner/repo"
                aria-invalid={!!errors.repoUrl}
                {...register("repoUrl")}
              />
              {errors.repoUrl ? (
                <FieldError errors={[errors.repoUrl]} />
              ) : (
                <FieldDescription>GitHub, GitLab or Bitbucket.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.liveUrl}>
              <FieldLabel htmlFor="liveUrl">Live link</FieldLabel>
              <Input
                id="liveUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://my-project.vercel.app"
                aria-invalid={!!errors.liveUrl}
                {...register("liveUrl")}
              />
              {errors.liveUrl ? (
                <FieldError errors={[errors.liveUrl]} />
              ) : (
                <FieldDescription>Where the project is deployed.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                rows={5}
                placeholder="What does it do, and what did you build it with?"
                aria-invalid={!!errors.description}
                {...register("description")}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldError errors={[errors.description]} />
                {/* Counts what the user has typed. Turns red past the limit. */}
                <span
                  aria-live="polite"
                  className={cn(
                    "ml-auto text-xs tabular-nums text-muted-foreground",
                    descriptionLength > DESCRIPTION_MAX && "text-destructive"
                  )}
                >
                  {descriptionLength} / {DESCRIPTION_MAX}
                </span>
              </div>
            </Field>

            <Button type="submit" disabled={isLoading || isWaiting}>
              {isLoading && <Loader2 className="animate-spin" />}
              {isWaiting ? `Try again in ${formatCountdown(waitToRetry.seconds)}` : "Submit project"}
            </Button>
          </FieldGroup>
        </CardContent>
      </form>
    </Card>
  );
}
