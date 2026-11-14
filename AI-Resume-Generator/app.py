import os
from flask import Flask, jsonify
from config import Config


def create_app():
    """Create and configure the Flask application instance."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure required local directories exist at startup
    os.makedirs(app.config["GENERATED_RESUMES_DIR"], exist_ok=True)
    os.makedirs(os.path.dirname(app.config["DATABASE_PATH"]), exist_ok=True)

    @app.route("/")
    def home():
        return (
            "<h1>AI-Powered Resume Generator — Phase 1 Setup Complete!</h1>"
            "<p>Flask is running and configuration is loaded successfully.</p>"
            "<p>Check <a href='/health'>/health</a> to verify environment status.</p>"
        )

    @app.route("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "phase": 1,
                "ai_key_configured": bool(app.config["GEMINI_API_KEY"]),
                "database_path": app.config["DATABASE_PATH"],
            }
        )

    return app


app = create_app()

if __name__ == "__main__":
    # Debug mode is enabled for local development only
    app.run(host="127.0.0.1", port=5000, debug=True)
