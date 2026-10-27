import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict

SENSITIVE_KEYS = {
    "password", "password_hash", "hashed_password", 
    "access_token", "refresh_token", "authorization", 
    "secret", "cookie", "token"
}

def redact_sensitive_data(data: Any) -> Any:
    """Recursively redacts sensitive keys from dictionaries or lists."""
    if isinstance(data, dict):
        clean = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                clean[k] = "[REDACTED]"
            else:
                clean[k] = redact_sensitive_data(v)
        return clean
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data

class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as structured JSON without leaking secrets."""
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno,
        }
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_obj["context"] = redact_sensitive_data(record.extra)
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("habitflow")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger

logger = setup_logging()
