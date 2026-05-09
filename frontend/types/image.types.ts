export interface ImageFile {
    id: string;
    file: File;
    preview: string;
    status: "pending" | "uploading" | "success" | "error";
    error?: string;
    result?: unknown;
}

export interface UploadConfig {
    albumId: string;
    apiEndpoint: string;
}