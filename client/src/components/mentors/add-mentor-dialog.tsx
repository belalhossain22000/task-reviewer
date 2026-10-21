"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { PasswordRules } from "@/components/auth/password-rules";
import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateMentorMutation } from "@/features/user/user-api";
import { getErrorMessage, getFieldErrors } from "@/lib/api-error";
import { PASSWORD_RULES, mentorSchema, type MentorValues } from "@/lib/validations";

const FIELDS = ["name", "email", "password"] as const;

// The form inside the dialog. The dialog's content is removed from the page when it closes, so
// this component starts fresh (empty fields, no old errors) every time it is opened.
function AddMentorForm({ onClose, onBusyChange }: { onClose: () => void; onBusyChange: (busy: boolean) => void }) {
  const [createMentor, { isLoading }] = useCreateMentorMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<MentorValues>({
    resolver: zodResolver(mentorSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    onBusyChange(true);

    try {
      const mentor = await createMentor(values).unwrap();
      toast.success(`${mentor.name} can now log in as a mentor`);
      onClose();
    } catch (error) {
      // e.g. 409 "email already registered" arrives with the field name, so it lands under Email.
      const fieldErrors = getFieldErrors(error);
      for (const field of FIELDS) {
        if (fieldErrors[field]) setError(field, { message: fieldErrors[field] });
      }
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error));
    } finally {
      onBusyChange(false);
    }
  });

  // A broken password rule is shown in red by the checklist; only say it in words when the
  // checklist doesn't list it (too long, or a message from the server).
  const passwordError = PASSWORD_RULES.some((rule) => rule.message === errors.password?.message)
    ? undefined
    : errors.password;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Add a mentor</DialogTitle>
        <DialogDescription>
          Mentors can review projects. You choose the first password, so give it to them yourself.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        {formError && <FormAlert message={formError} />}

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="mentor-name">Full name</FieldLabel>
          <Input
            id="mentor-name"
            autoComplete="off"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="mentor-email">Email</FieldLabel>
          <Input
            id="mentor-email"
            type="email"
            autoComplete="off"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="mentor-password">Initial password</FieldLabel>
          <PasswordInput
            id="mentor-password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <PasswordRules value={password} invalid={!!errors.password} />
          <FieldError errors={[passwordError]} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isLoading} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Add mentor
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddMentorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  return (
    // While the request runs the dialog can't be dismissed (Escape, outside click, the X).
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent showCloseButton={!busy}>
        <AddMentorForm onClose={onClose} onBusyChange={setBusy} />
      </DialogContent>
    </Dialog>
  );
}
