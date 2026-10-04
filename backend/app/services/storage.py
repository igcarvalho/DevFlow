import boto3
from botocore.client import Config

from app.core.config import settings


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        region_name="us-east-1",
    )


def ensure_bucket_exists():
    client = get_s3_client()
    buckets = client.list_buckets()
    bucket_names = [b["Name"] for b in buckets.get("Buckets", [])]
    if settings.MINIO_BUCKET_NAME not in bucket_names:
        client.create_bucket(Bucket=settings.MINIO_BUCKET_NAME)


def upload_file(file_key: str, file_data: bytes, content_type: str) -> None:
    ensure_bucket_exists()
    client = get_s3_client()
    client.put_object(
        Bucket=settings.MINIO_BUCKET_NAME,
        Key=file_key,
        Body=file_data,
        ContentType=content_type,
    )


def download_file(file_key: str) -> bytes:
    client = get_s3_client()
    response = client.get_object(Bucket=settings.MINIO_BUCKET_NAME, Key=file_key)
    return response["Body"].read()


def generate_presigned_url(file_key: str, expiration: int = 3600) -> str:
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET_NAME, "Key": file_key},
        ExpiresIn=expiration,
    )


def delete_file(file_key: str) -> None:
    client = get_s3_client()
    client.delete_object(Bucket=settings.MINIO_BUCKET_NAME, Key=file_key)
