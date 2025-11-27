#!/usr/bin/env python3
"""Translate a single file from Catalan to Spanish in place"""
import sys
from pathlib import Path
from translate_to_spanish import translate_qmd_file

if len(sys.argv) < 2:
    print("Usage: python3 translate_single_file_ca_to_es.py <file.qmd>")
    print("Example (from es/ folder): python3 ../python_codes/translate_single_file_ca_to_es.py competencias-ciencias.qmd")
    print("Example (with path): python3 ../python_codes/translate_single_file_ca_to_es.py master-upf/intro-master-upf.qmd")
    print("\nThis will translate the file in place (Catalan -> Spanish)")
    sys.exit(1)

# Resolve path relative to current working directory
file_path = Path(sys.argv[1]).resolve()

if not file_path.exists():
    print(f"Error: File {file_path} does not exist!")
    print(f"Current directory: {Path.cwd()}")
    sys.exit(1)

print(f"Working directory: {Path.cwd()}")
print(f"Translating (Catalan -> Spanish): {file_path}\n")

translate_qmd_file(file_path)
