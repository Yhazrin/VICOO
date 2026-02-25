"""
SDC - Sentient Desktop Companion
Main Entry Point
"""

import sys
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt

from .mascot import MascotWindow


def main():
    """Main entry point"""
    # Create application
    app = QApplication(sys.argv)
    app.setApplicationName("Sentient Desktop Companion")

    # Enable high DPI scaling
    app.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    # Create and show mascot window
    window = MascotWindow()
    window.show()

    # Handle quit signal
    window.quit_requested.connect(app.quit)

    # Run application
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
