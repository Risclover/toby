from flask import request, g
from flask_wtf.csrf import generate_csrf
from sqlalchemy import event
from sqlalchemy.engine import Engine
import os
import time
import csv
from datetime import datetime, timezone

REQUEST_LOG_PATH = os.path.join(os.path.dirname(__file__), 'logs', 'request_times.csv')
QUERY_LOG_PATH = os.path.join(os.path.dirname(__file__), 'logs', 'queries.csv')

def _ensure_log_files():
    os.makedirs(os.path.dirname(REQUEST_LOG_PATH), exist_ok=True)

    if not os.path.exists(REQUEST_LOG_PATH):
        with open(REQUEST_LOG_PATH, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'method', 'endpoint', 'status_code', 'duration_ms'])

    if not os.path.exists(QUERY_LOG_PATH):
        with open(QUERY_LOG_PATH, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'duration_ms', 'statement_preview'])


def register_middlewares(app, db):
    _ensure_log_files()

    @event.listens_for(Engine, "before_cursor_execute")
    def before_execute(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault('query_start_time', []).append(time.perf_counter())

    @event.listens_for(Engine, "after_cursor_execute")
    def after_execute(conn, cursor, statement, parameters, context, executemany):
        total_ms = round((time.perf_counter() - conn.info['query_start_time'].pop()) * 1000, 2)
        if total_ms > 10:
            preview = ' '.join(statement.split())[:120]
            with open(QUERY_LOG_PATH, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.now(timezone.utc).isoformat(),
                    total_ms,
                    preview,
                ])

    @app.before_request
    def start_timer():
        g.start_time = time.perf_counter()

    @app.after_request
    def inject_csrf_cookie(response):
        secure = os.getenv("FLASK_ENV") == "production"
        response.set_cookie(
            "csrf_token",
            generate_csrf(),
            secure=secure,
            samesite="Strict" if secure else None,
            httponly=True,
        )
        return response

    @app.after_request
    def log_request_time(response):
        if hasattr(g, 'start_time'):
            duration_ms = round((time.perf_counter() - g.start_time) * 1000, 2)
            with open(REQUEST_LOG_PATH, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.now(timezone.utc).isoformat(),
                    request.method,
                    request.path,
                    response.status_code,
                    duration_ms,
                ])
        return response