// @/lib/cache/index.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// ========== INTERFACES ==========

export interface MLA {
  id: string;
  name: string;
  party: string;
  email: string;
  phone: string | null;
  constituency: string;
  rating: number | null;
}

export interface Organization {
  id: string;
  name: string;
  category: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaUrl: string | null;
  location: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  updatedAt: string;
  mlaId: string | null;
  organizationId: string | null;
  mla: MLA | null;
  organization: Organization | null;
}

export interface Citizen {
  aqi: number;
  emergencies: never[];
  id: string;
  name: string;
  email: string;
  constituency: string;
  mlaId: string;
  currentMLA: MLA;
  linked_Organizations: Organization[];
  issues: Issue[];
}

interface UserResponse {
  citizen: Citizen;
}

// ========== API FUNCTIONS ==========

export const fetchUserDetails = async (email: string): Promise<Citizen> => {
  const res = await axios.get<UserResponse>(
    `https://civiciobackend.vercel.app/api/v1/citizen/details?email=${email}`
  );
  return res.data.citizen;
};

// ========== REACT QUERY HOOKS ==========

export const useUserDetails = (email: string) => {
  return useQuery<Citizen, Error>({
    queryKey: ["user", email],
    queryFn: () => fetchUserDetails(email),
    staleTime: 1000 * 60 * 5,       
    gcTime: 1000 * 60 * 60,        
    refetchOnWindowFocus: false,
    enabled: !!email,
  });
};