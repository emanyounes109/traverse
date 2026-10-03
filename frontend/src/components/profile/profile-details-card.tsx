"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api/client";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { InternProfile } from "@/types/api";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { InfoItem } from "@/components/ui/info-item";

const schema = z.object({
  fullName: z.string().trim().min(2, "At least 2 characters").max(100, "At most 100 characters"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || (v.length >= 6 && v.length <= 20), "Between 6 and 20 characters"),
  contactInfo: z.string().trim().max(500, "At most 500 characters"),
});

type FormValues = z.infer<typeof schema>;

function toValues(profile: InternProfile): FormValues {
  return {
    fullName: profile.fullName,
    phone: profile.phone ?? "",
    contactInfo: profile.contactInfo ?? "",
  };
}

type Props = {
  email: string;
  profile: InternProfile;
  // Name of the current internship, if any
  placementName?: string | null;
};

export function ProfileDetailsCard({ email, profile, placementName }: Props) {
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [serverError, setServerError] = useState<string[] | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(profile) });

  // Refill the form when fresh profile data arrives
  useEffect(() => {
    reset(toValues(profile));
  }, [profile, reset]);

  const onSubmit = async (v: FormValues) => {
    setServerError(null);

    // Send only changed fields. Empty phone / contact info clears them (null).
    const body: Record<string, unknown> = {};
    if (dirtyFields.fullName) body.fullName = v.fullName;
    if (dirtyFields.phone) body.phone = v.phone || null;
    if (dirtyFields.contactInfo) body.contactInfo = v.contactInfo || null;

    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }

    try {
      await updateProfile.mutateAsync(body);
      setEditing(false);
    } catch (e) {
      setServerError(
        e instanceof ApiError
          ? e.details?.length
            ? e.details
            : [e.message]
          : ["Something went wrong. Please try again."]
      );
    }
  };

  const cancel = () => {
    reset(toValues(profile));
    setServerError(null);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader
        title="Your details"
        divider
        meta={
          !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-sans text-sm font-semibold text-ink underline underline-offset-4"
            >
              Edit details
            </button>
          ) : (
            "Your application profile"
          )
        }
      />

      {!editing ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Name">{profile.fullName}</InfoItem>
          <InfoItem label="Email">{email}</InfoItem>
          <InfoItem label="Phone">{profile.phone || "Not added"}</InfoItem>
          <InfoItem label="Current placement">{placementName || "No placement yet"}</InfoItem>
          <div className="sm:col-span-2">
            <InfoItem label="Contact info">{profile.contactInfo || "Not added"}</InfoItem>
          </div>
        </dl>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Input size="sm" label="Full name" error={errors.fullName?.message} {...register("fullName")} />
            <Input
              size="sm"
              type="tel"
              label="Phone"
              hint="(optional)"
              placeholder="+20 100 000 0000"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <Textarea
            label="Contact info"
            rows={2}
            helper="Anything else the team should know about reaching you (optional)."
            error={errors.contactInfo?.message}
            {...register("contactInfo")}
          />

          <div className="flex items-center gap-2 border-t border-line pt-3">
            <Button type="submit" compact variant="accent" loading={isSubmitting}>
              Save details
            </Button>
            <Button compact variant="outline" onClick={cancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}