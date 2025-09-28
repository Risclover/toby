import os
import uuid
import mimetypes
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# ---- Config ----
BUCKET_NAME = os.environ.get("S3_BUCKET")
S3_KEY = os.environ.get("S3_KEY")
S3_SECRET = os.environ.get("S3_SECRET")

# Public URL base (virtual-hosted–style)
S3_LOCATION = f"https://{BUCKET_NAME}.s3.amazonaws.com/"

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}

# ---- Client ----
_s3_client_kwargs = {
    "aws_access_key_id": S3_KEY,
    "aws_secret_access_key": S3_SECRET,
}

s3 = boto3.client("s3", **_s3_client_kwargs)


# ---- Helpers ----
def allowed_file(filename: str) -> bool:
    """Return True if filename has an allowed extension."""
    return bool(filename) and "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_unique_filename(filename: str) -> str:
    """Return a UUID-based filename preserving the original extension."""
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    unique = uuid.uuid4().hex
    return f"{unique}.{ext}" if ext else unique


def _safe_content_type(filename: str, provided: str | None) -> str | None:
    """
    Choose a safe ContentType:
    - Prefer provided if truthy.
    - Fallback to mimetypes.guess_type(filename)[0].
    - If both fail, return None (omit ContentType entirely).
    """
    return provided or mimetypes.guess_type(filename)[0]


def upload_file_to_s3(file, acl: str = "public-read") -> dict:
    """
    Upload a FileStorage-like object to S3.
    Returns {"url": "..."} on success or {"errors": "..."} on failure.
    """
    if not BUCKET_NAME:
        return {"errors": "S3_BUCKET is not configured"}
    if not getattr(file, "filename", None):
        return {"errors": "No filename provided"}

    # Build ExtraArgs safely
    extra_args = {"ACL": acl}
    ctype = _safe_content_type(file.filename, getattr(file, "content_type", None))
    if ctype:
        extra_args["ContentType"] = ctype  # only include when it's a real string

    try:
        s3.upload_fileobj(
            Fileobj=file,
            Bucket=BUCKET_NAME,
            Key=file.filename,  # ensure you've already set a unique name before calling this
            ExtraArgs=extra_args,
        )
    except (BotoCoreError, ClientError, Exception) as e:
        return {"errors": str(e)}

    return {"url": f"{S3_LOCATION}{file.filename}"}
