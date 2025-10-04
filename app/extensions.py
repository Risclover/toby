import logging
import sys

from sqlalchemy       import MetaData
from flask_sqlalchemy import SQLAlchemy
from flask_migrate    import Migrate
from flask_cors       import CORS
from flask_login      import LoginManager

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata      = MetaData(naming_convention=naming_convention)
db            = SQLAlchemy(metadata=metadata)
migrate       = Migrate()
cors          = CORS(resources={r"/api/*": {"origins": ["http://127.0.0.1:5173", "http://localhost:5173"]}}, supports_credentials=True)
login_manager = LoginManager()

def configure_logging(app):
    """Attach a sane logger to `app.logger` and your blueprints."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
    ))

    root = logging.getLogger()               # root logger
    env = app.config.get("ENV", "development")  # default to development
    
    root.setLevel(logging.INFO if env == "production" else logging.DEBUG)
    root.addHandler(handler)
