# MyTodo Backend

## Image Storage Policy (Updated)

Images (task photos, Q&A images, and user avatars) are no longer stored as raw base64 strings in MongoDB. All uploads are saved to AWS S3 and only their public URLs are persisted.

### What Changed

- Task creation now accepts either multipart file uploads (`images` field) or base64 data URLs. Base64 images are automatically uploaded to S3.
- Question and Answer image uploads fall back to base64 → S3 conversion when multipart files are not provided.
- User avatar upload no longer converts small files to base64; it uploads the image to S3 and stores the URL.
- Existing logic still generates a UI Avatars URL when no file is provided.

### Endpoints Affected

- `POST /api/v1/tasks` (including `/post-task` alias)
- `POST /api/v1/tasks/:taskId/questions`
- `POST /api/v1/tasks/:taskId/questions/:questionId/answer`
- `POST /api/v1/users/avatar`

### Acceptable Image Input Formats

1. Multipart form-data (recommended)
2. Base64 Data URLs: `data:image/png;base64,<data>` (auto-converted to S3 URL)

### Environment Variables Required

Ensure these are set before running the server:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`

### Utility Added

`utils/imageUpload.js` provides:

- `uploadBuffer(buffer, mimeType, folder)`
- `uploadBase64Array(base64Array, { folder })`

### S3 URL Format

Images are served via:

```
https://<AWS_BUCKET_NAME>.s3.<AWS_REGION>.amazonaws.com/<key>
```

### Notes

- Max avatar file size: 5MB
- Max base64 image size (task/Q&A): 10MB (larger images skipped)
- All S3 objects uploaded with `public-read` ACL.

### Migration of Existing Base64 Data

If older records contain base64 data URLs, consider a one-time migration script:

1. Scan for fields starting with `data:image/`.
2. Upload each to S3 via `uploadBase64Array`.
3. Replace stored value with returned S3 URL.

---

Last updated: Base64 image disabling implementation.
