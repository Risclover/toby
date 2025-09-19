from flask import request, redirect
from flask_wtf.csrf import generate_csrf
import os

def register_middlewares(app):
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