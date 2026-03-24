import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = import.meta.env.R2_BUCKET_NAME || 'plantgotchi-media';
const PUBLIC_URL_BASE = import.meta.env.R2_PUBLIC_URL || 'https://media.plantgotchi.com';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: 'auto',
    endpoint: import.meta.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  maxSizeBytes = 50 * 1024 * 1024
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSizeBytes,
  });
  return getSignedUrl(getClient(), command, { expiresIn: 600 });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await getClient().send(command);
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL_BASE}/${key}`;
}

export function generateKey(creatorId: string, filename: string): string {
  const timestamp = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `creators/${creatorId}/${timestamp}-${safe}`;
}
