"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getFieldErrors } from "@/lib/api-error";
import { rejectSchema, type RejectValues } from "@/lib/validations";
import type { ReviewableProject } from "@/types/api";

type RejectFn = (project: ReviewableProject, note: string) => Promise<void>;

// The form inside the dialog. Radix removes a dialog's content from the page when it closes,
// so this component is created fresh every time the dialog opens: the note starts empty and
// old errors are gone, with no code to "reset" anything.
function RejectForm({
  project,
  onClose,
  onReject,
  onBusyChange,
}: {
  project: ReviewableProject;
  onClose: () => void;
  onReject: RejectFn;
  onBusyChange: (busy: boolean) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { note: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async ({ note }) => {
    setFormError(null);
    onBusyChange(true);

    try {
      await onReject(project, note);
      onClose();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.note) setError("note", { message: fieldErrors.note });
      else setFormError(getErrorMessage(error));
    } finally {
      onBusyChange(false);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Reject project</DialogTitle>
        <DialogDescription>
          Tell {project.student.name} what to fix in &quot;{project.name}&quot;. They will see this note next
          to the project.
        </DialogDescription>
      </DialogHeader>

      {formError && <FormAlert message={formError} />}

      <Field data-invalid={!!errors.note}>
        <FieldLabel htmlFor="reject-note">Reason</FieldLabel>
        <Textarea
          id="reject-note"
          rows={4}
          placeholder="For example: the live link shows a 404 page."
          aria-invalid={!!errors.note}
          {...register("note")}
        />
        <FieldError errors={[errors.note]} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Reject project
        </Button>
      </DialogFooter>
    </form>
  );
}

// Rejecting needs a reason, because the student reads it to know what to fix. Approving needs
// no form, so there is no matching dialog for it.
// The dialog is open whenever `project` is set; closing it sets `project` back to null.
export function RejectDialog({
  project,
  onClose,
  onReject,
}: {
  project: ReviewableProject | null;
  onClose: () => void;
  onReject: RejectFn;
}) {
  const [busy, setBusy] = useState(false);

  return (
    // While the request is running the dialog can't be dismissed (Escape, outside click, the X),
    // so a decision is never abandoned half-way and then looks as if it didn't happen.
    <Dialog open={!!project} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent showCloseButton={!busy}>
        {project && (
          <RejectForm project={project} onClose={onClose} onReject={onReject} onBusyChange={setBusy} />
        )}
      </DialogContent>
    </Dialog>
  );
}
