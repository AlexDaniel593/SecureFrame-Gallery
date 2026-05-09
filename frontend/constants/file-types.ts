export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const TYPE_TO_EXTENSION: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
};

export const isValidFileType = (file: File): boolean => {
    return ALLOWED_TYPES.includes(file.type);
};

export const isValidFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
};