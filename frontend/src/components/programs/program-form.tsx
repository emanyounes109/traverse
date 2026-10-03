"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { dateInputToIso, toDateInput } from "@/lib/format";
import { useCreateProgram, useUpdateProgram } from "@/hooks/use-programs";
import type { Program, ProgramInput } from "@/types/api";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";

// Fields editable in every status vs. only while the program is a draft
const ALL_KEYS = [
  "name",
  "description",
  "requirements",
  "applicationOpenDate",
  "applicationCloseDate",
  "internshipStartDate",
  "internshipEndDate",
  "capacity",
] as const;
const PUBLISHED_KEYS = ["description", "requirements", "capacity"] as const;
type FieldKey = (typeof ALL_KEYS)[number];

function buildSchema(checkDates: boolean) {
  return z
    .object({
      name: z.string().trim().min(3, "At least 3 characters").max(150, "At most 150 characters"),
      description: z
        .string()
        .trim()
        .min(1, "Description is required")
        .max(5000, "At most 5000 characters"),
      requirements: z
        .string()
        .trim()
        .min(1, "Requirements are required")
        .max(5000, "At most 5000 characters"),
      applicationOpenDate: z.string().min(1, "Required"),
      applicationCloseDate: z.string().min(1, "Required"),
      internshipStartDate: z.string().min(1, "Required"),
      internshipEndDate: z.string().min(1, "Required"),
      capacity: z
        .string()
        .regex(/^\d+$/, "Enter a whole number")
        .refine((v) => Number(v) >= 1 && Number(v) <= 100000, "Between 1 and 100000"),
    })
    .superRefine((v, ctx) => {
      // Locked dates come from the server, so they are not re-validated here
      if (!checkDates) return;

      if (v.applicationOpenDate > v.applicationCloseDate) {
        ctx.addIssue({
          code: "custom",
          path: ["applicationCloseDate"],
          message: "Must be on or after the open date",
        });
      }
      if (v.applicationCloseDate >= v.internshipStartDate) {
        ctx.addIssue({
          code: "custom",
          path: ["internshipStartDate"],
          message: "Must be after applications close",
        });
      }
      if (v.internshipStartDate > v.internshipEndDate) {
        ctx.addIssue({
          code: "custom",
          path: ["internshipEndDate"],
          message: "Must be on or after the start date",
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function toFormValues(program?: Program): FormValues {
  return {
    name: program?.name ?? "",
    description: program?.description ?? "",
    requirements: program?.requirements ?? "",
    applicationOpenDate: program ? toDateInput(program.applicationOpenDate) : "",
    applicationCloseDate: program ? toDateInput(program.applicationCloseDate) : "",
    internshipStartDate: program ? toDateInput(program.internshipStartDate) : "",
    internshipEndDate: program ? toDateInput(program.internshipEndDate) : "",
    capacity: program ? String(program.capacity) : "",
  };
}

type Props = {
  mode: "create" | "edit";
  // Required in edit mode
  program?: Program;
};

export function ProgramForm({ mode, program }: Props) {
  const router = useRouter();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram(program?.id ?? "");

  const [serverError, setServerError] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEdit = mode === "edit";
  const archived = isEdit && program?.status === "ARCHIVED";
  // Name and dates can only change while the program is a draft
  const publishedLock = isEdit && program?.status !== "DRAFT";

  const schema = useMemo(() => buildSchema(!publishedLock), [publishedLock]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(program),
  });

  // Refill the form whenever fresh data arrives from the server
  useEffect(() => {
    reset(toFormValues(program));
  }, [program, reset]);

  const onSubmit = async (v: FormValues) => {
    setServerError(null);
    setNotice(null);

    const payload: ProgramInput = {
      name: v.name,
      description: v.description,
      requirements: v.requirements,
      applicationOpenDate: dateInputToIso(v.applicationOpenDate, "start"),
      applicationCloseDate: dateInputToIso(v.applicationCloseDate, "end"),
      internshipStartDate: dateInputToIso(v.internshipStartDate, "start"),
      internshipEndDate: dateInputToIso(v.internshipEndDate, "end"),
      capacity: Number(v.capacity),
    };

    try {
      if (!isEdit) {
        const created = await createProgram.mutateAsync(payload);
        router.push(`/staff/programs/${created.id}`);
        return;
      }

      // Send only changed fields, and only the ones this status allows
      const keys: readonly FieldKey[] = publishedLock ? PUBLISHED_KEYS : ALL_KEYS;
      const body: Record<string, unknown> = {};
      for (const key of keys) {
        if (dirtyFields[key]) body[key] = payload[key];
      }

      if (Object.keys(body).length === 0) {
        setNotice("No changes to save.");
        return;
      }

      await updateProgram.mutateAsync(body);
      setNotice("Program details saved.");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "CAPACITY_BELOW_ACCEPTED") {
          setError("capacity", { message: e.message });
        } else {
          setServerError(e.details?.length ? e.details : [e.message]);
        }
      } else {
        setServerError(["Something went wrong. Please try again."]);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {archived && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" />
          This program is archived and read-only.
        </p>
      )}
      {publishedLock && !archived && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" />
          Name and dates are locked once a program is published. You can still update the
          description, requirements and capacity.
        </p>
      )}

      {serverError && (
        <Alert>
          {serverError.length === 1 ? (
            serverError[0]
          ) : (
            <ul className="list-disc pl-4">
              {serverError.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      {notice && <Alert variant="success">{notice}</Alert>}

      <Input
        size="sm"
        label="Program name"
        placeholder="e.g. Product Design Internship"
        locked={publishedLock}
        error={errors.name?.message}
        {...register("name")}
      />

      <Textarea
        label="Description"
        rows={3}
        helper="Tell applicants what they will do and learn."
        locked={archived}
        error={errors.description?.message}
        {...register("description")}
      />

      <Textarea
        label="Requirements"
        rows={3}
        helper="Put each requirement on a new line."
        locked={archived}
        error={errors.requirements?.message}
        {...register("requirements")}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          size="sm"
          type="date"
          label="Applications open"
          locked={publishedLock}
          error={errors.applicationOpenDate?.message}
          {...register("applicationOpenDate")}
        />
        <Input
          size="sm"
          type="date"
          label="Applications close"
          locked={publishedLock}
          error={errors.applicationCloseDate?.message}
          {...register("applicationCloseDate")}
        />
        <Input
          size="sm"
          type="date"
          label="Placement starts"
          locked={publishedLock}
          error={errors.internshipStartDate?.message}
          {...register("internshipStartDate")}
        />
        <Input
          size="sm"
          type="date"
          label="Placement ends"
          locked={publishedLock}
          error={errors.internshipEndDate?.message}
          {...register("internshipEndDate")}
        />
      </div>

      <div className="sm:w-1/2">
        <Input
          size="sm"
          type="number"
          min={1}
          label="Placement capacity"
          hint={isEdit && program ? `(min ${program.acceptedCount})` : undefined}
          locked={archived}
          error={errors.capacity?.message}
          {...register("capacity")}
        />
      </div>

      {!archived && (
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <Button type="submit" compact variant="accent" loading={isSubmitting}>
            {isEdit ? "Save program details" : "Create program"}
          </Button>
          {!isEdit && (
            <Link href="/staff/programs" className={buttonStyles("outline", true)}>
              Cancel
            </Link>
          )}
        </div>
      )}
    </form>
  );
}