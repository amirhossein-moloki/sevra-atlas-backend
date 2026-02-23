import { AccountStatus } from '@prisma/client';

export const initialArtists = [
  {
    "fullName": "Sahar Beauty",
    "slug": "sahar-beauty",
    "summary": "Specialist in bridal makeup and skin care.",
    "status": AccountStatus.ACTIVE,
    "avgRating": 4.8,
    "reviewCount": 12
  },
  {
    "fullName": "Nail Art Studio",
    "slug": "nail-art-studio",
    "summary": "Professional nail design and manicure services.",
    "status": AccountStatus.ACTIVE,
    "avgRating": 4.5,
    "reviewCount": 8
  },
  {
    "fullName": "Hair Master Ali",
    "slug": "hair-master-ali",
    "summary": "Expert in modern hair styles and coloring.",
    "status": AccountStatus.ACTIVE,
    "avgRating": 4.9,
    "reviewCount": 25
  }
];
