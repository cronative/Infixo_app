import { z } from "zod";

export const collabEnquirySchema = z.object({
  creatorId: z.string().min(1, "Creator is required"),
  brandName: z.string().trim().min(1, "Brand or company name is required"),
  contactName: z.string().trim().min(1, "Your name is required"),
  workEmail: z.string().trim().email("Please enter a valid work email"),
  phone: z.string().trim().optional().or(z.literal("")),
  packageId: z.string().optional().nullable(),
  packageName: z.string().trim().optional().nullable(),
  budget: z.string().trim().optional().nullable(),
  message: z.string().trim().min(20, "Message must be at least 20 characters"),
  websiteOrSocial: z.string().trim().optional().nullable(),
  hp: z.string().optional(), // Honeypot field for bot detection
});

export type CollabEnquiryInput = z.infer<typeof collabEnquirySchema>;
