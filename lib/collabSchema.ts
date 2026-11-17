import { z } from "zod";

export const collabEnquirySchema = z.object({
  creatorId: z.string().min(1, "Creator is required"),
  brandName: z.string().trim().min(1, "Brand or company name is required").max(150),
  contactName: z.string().trim().min(1, "Your name is required").max(150),
  workEmail: z.string().trim().email("Please enter a valid work email").max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  packageId: z.string({ message: "Please select a package" }).trim().min(1, "Please select a package").max(100),
  packageName: z.string().trim().min(1, "Please select a package").max(255),
  budget: z.string().trim().max(50).optional().nullable(),
  timeline: z.string().trim().max(60).optional().nullable(),
  campaignLocation: z.string().trim().max(150).optional().nullable(),
  message: z.string().trim().min(20, "Campaign brief must be at least 20 characters").max(3000),
  websiteOrSocial: z.string().trim().max(255).optional().nullable(),
  hp: z.string().optional(), // Honeypot field for bot detection
});

export type CollabEnquiryInput = z.infer<typeof collabEnquirySchema>;
