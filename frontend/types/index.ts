export type Role = "USER" | "SUPERVISOR" | "ADMIN";
export type Status = "PENDING" | "APPROVED" | "REJECTED";
export type ImageStatus = "ANALYZING" | "CLEAN" | "SUSPICIOUS" | "QUARANTINED" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt?: Date;
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  status: Status;
  userId: string;
  user?: User;
  images?: Image[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Image {
  id: string;
  filename: string;
  minioPath: string;
  status: ImageStatus;
  stegoResult?: StegoResult;
  albumId: string;
  album?: Album;
  createdAt?: Date;
}

export interface StegoResult {
  stego_score: number;
  confidence: number;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS";
  details: {
    lsb_score: number;
    histogram_score: number;
    eof_score: number;
    entropy_score: number;
  };
}