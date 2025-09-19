# manage.py
from app import create_app, db
from flask_migrate import Migrate

# create the app instance
app = create_app()

# initialize Flask-Migrate
migrate = Migrate(app, db)

if __name__ == "__main__":
    app.run()
