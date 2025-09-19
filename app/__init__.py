from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_talisman import Talisman

from .config      import Config
from .extensions  import (
    db,
    migrate,
    cors,
    login_manager,
    configure_logging,
)
from .blueprints  import register_blueprints
from .middlewares import register_middlewares
from .errors      import register_error_handlers
# from .seeds       import seed_commands
from app.models      import User
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time, logging
from dotenv import load_dotenv 

load_dotenv()

import os
print("FLASK_ENV =", os.getenv("FLASK_ENV"))

# --------------------------------------------------------------------------- #
#  Application factory
# --------------------------------------------------------------------------- #
def create_app(config_class=None) -> Flask:
    """
    Create and configure a new Flask application instance.
    """
    app = Flask(
        __name__,
        static_folder=str(Path(__file__).resolve().parents[1] / "frontend" / "build"),
    )

    app.config.update(
        SQLALCHEMY_RECORD_QUERIES=True,   # built-in
        SQLALCHEMY_ECHO=False,            # turn ON if you want raw SQL too
        SLOW_QUERY_THRESHOLD=0.05,        # 50 ms
    )
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, stmt, params, context, executemany):
        context._query_start_time = time.perf_counter()

    @event.listens_for(Engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, stmt, params, context, executemany):
        total = time.perf_counter() - context._query_start_time
        logging.debug(f"[{total:.3f}s] {stmt.splitlines()[0][:120]} …")

    Talisman(
        app,
        force_https=(os.getenv("FLASK_ENV") == "production"),
        frame_options="SAMEORIGIN",
        content_security_policy={
            "default-src": ["'self'"],
            "frame-ancestors": ["'self'"],
        },
    )
    # --------------------------------------------------------------------- #
    # Configuration & secrets
    # --------------------------------------------------------------------- #
    configure_logging(app)
    app.config.from_object(config_class or Config)
    SECRET_KEY = os.urandom(32)
    app.config['SECRET_KEY'] = SECRET_KEY
    # --------------------------------------------------------------------- #
    # Initialise extensions
    # --------------------------------------------------------------------- #
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, supports_credentials=True)
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id: str):
        """Return the User instance given a unicode ID."""
        return User.query.get(int(user_id))

    # --------------------------------------------------------------------- #
    # Blueprints, CLI commands, middlewares, error handlers
    # --------------------------------------------------------------------- #
    register_blueprints(app)
    register_middlewares(app)
    register_error_handlers(app)
    # app.cli.add_command(seed_commands)

    # --------------------------------------------------------------------- #
    # Single-Page App fallback
    # --------------------------------------------------------------------- #
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def spa_fallback(path):
        # Block only API and auth endpoints from falling through to React
        if path.startswith("api/") or path.startswith("auth/"):
            return jsonify({"error": "Not found"}), 404

        static_dir = Path(app.static_folder)
        requested = static_dir / path

        # Serve real static files if requested (like main.js, logo.png, etc.)
        if path and requested.exists():
            return send_from_directory(static_dir, path)

        # Otherwise, serve React’s entry point
        return send_from_directory(static_dir, "index.html"), 200

    return app


app = create_app()
