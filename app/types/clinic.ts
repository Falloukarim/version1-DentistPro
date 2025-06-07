export interface Clinic {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  }
  
  export interface User {
    id: string;
    clerkUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }