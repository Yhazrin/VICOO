#!/usr/bin/env python
"""
SDC Entry Point Script

Usage:
    python run.py
"""

import sys
import os

# Get the directory containing this script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add the script's directory to path
sys.path.insert(0, script_dir)

# Import main from src package
from src import main

if __name__ == "__main__":
    sys.exit(main())
