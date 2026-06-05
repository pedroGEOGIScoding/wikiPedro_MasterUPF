#!/usr/bin/env python3
"""
Universal .qmd file translator with flexible language support
Translate Quarto markdown files while preserving syntax and structure
"""

import argparse
import sys
from pathlib import Path
from translate_lib import translate_qmd_file, find_qmd_files

# Supported language codes
SUPPORTED_LANGUAGES = {
    'ca': 'Catalan',
    'es': 'Spanish',
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
}


def validate_language(lang_code: str) -> bool:
    """Check if language code is supported"""
    return lang_code.lower() in SUPPORTED_LANGUAGES


def print_progress(current: int, total: int, file_name: str):
    """Print progress bar"""
    percentage = (current / total) * 100
    bar_length = 40
    filled = int(bar_length * current / total)
    bar = '█' * filled + '░' * (bar_length - filled)
    print(f"\r[{bar}] {percentage:.1f}% ({current}/{total}) {file_name[:40]:<40}", end='', flush=True)


def main():
    parser = argparse.ArgumentParser(
        description='Translate .qmd files while preserving Quarto/Markdown syntax',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Translate single file from Spanish to English
  python translate_qmd.py file.qmd -s es -t en
  
  # Translate all .qmd files in current directory (Catalan -> Spanish)
  python translate_qmd.py . -s ca -t es
  
  # Dry run to preview what would be translated
  python translate_qmd.py . -s es -t en --dry-run
  
  # Translate without creating backups
  python translate_qmd.py file.qmd -s ca -t en --no-backup

  # Tune rate limiting for large batches (slower, fewer API blocks)
  python translate_qmd.py . -s ca -t es --delay 0.5 --retries 5

Supported languages:
  ca (Catalan), es (Spanish), en (English), fr (French),
  de (German), it (Italian), pt (Portuguese)
        """
    )
    
    parser.add_argument(
        'path',
        type=str,
        help='Path to .qmd file or directory containing .qmd files'
    )
    
    parser.add_argument(
        '-s', '--source',
        type=str,
        required=True,
        help='Source language code (e.g., es, ca, en)'
    )
    
    parser.add_argument(
        '-t', '--target',
        type=str,
        required=True,
        help='Target language code (e.g., es, ca, en)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview translations without modifying files'
    )
    
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Do not create .bak backup files before translation'
    )
    
    parser.add_argument(
        '--include-underscore',
        action='store_true',
        help='Include files starting with underscore (e.g., _quarto.yml)'
    )
    
    parser.add_argument(
        '--progress',
        action='store_true',
        help='Show progress bar for batch operations'
    )
    
    parser.add_argument(
        '--delay',
        type=float,
        default=0.1,
        help='Minimum delay (seconds) between translation API calls (default: 0.1)'
    )
    
    parser.add_argument(
        '--retries',
        type=int,
        default=3,
        help='Max retries per translation call with exponential backoff (default: 3)'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Translate even if the file does not have a .qmd extension'
    )
    
    args = parser.parse_args()
    
    # Validate languages
    source = args.source.lower()
    target = args.target.lower()
    
    if not validate_language(source):
        print(f"Error: Unsupported source language '{source}'")
        print(f"Supported: {', '.join(SUPPORTED_LANGUAGES.keys())}")
        sys.exit(1)
    
    if not validate_language(target):
        print(f"Error: Unsupported target language '{target}'")
        print(f"Supported: {', '.join(SUPPORTED_LANGUAGES.keys())}")
        sys.exit(1)
    
    if source == target:
        print(f"Error: Source and target languages must be different")
        sys.exit(1)
    
    # Resolve path
    path = Path(args.path).resolve()
    
    if not path.exists():
        print(f"Error: Path '{path}' does not exist")
        sys.exit(1)
    
    # Determine if single file or batch operation
    if path.is_file():
        # Single file translation
        if path.suffix != '.qmd' and not args.force:
            print(f"Error: File '{path}' is not a .qmd file (use --force to translate anyway)")
            sys.exit(1)
        
        print(f"{'[DRY RUN] ' if args.dry_run else ''}Translation: {SUPPORTED_LANGUAGES[source]} -> {SUPPORTED_LANGUAGES[target]}")
        print(f"File: {path}\n")
        
        success = translate_qmd_file(
            path,
            source,
            target,
            dry_run=args.dry_run,
            create_backup_file=not args.no_backup,
            min_delay=args.delay,
            max_retries=args.retries
        )
        
        sys.exit(0 if success else 1)
    
    elif path.is_dir():
        # Batch translation
        print(f"{'[DRY RUN] ' if args.dry_run else ''}Translation: {SUPPORTED_LANGUAGES[source]} -> {SUPPORTED_LANGUAGES[target]}")
        print(f"Directory: {path}\n")
        
        qmd_files = find_qmd_files(path, exclude_underscore=not args.include_underscore)
        
        if not qmd_files:
            print("No .qmd files found!")
            sys.exit(1)
        
        print(f"Found {len(qmd_files)} .qmd file{'s' if len(qmd_files) != 1 else ''}\n")
        
        success_count = 0
        failed_files = []
        
        for i, file_path in enumerate(qmd_files, 1):
            if args.progress:
                print_progress(i, len(qmd_files), file_path.name)
            else:
                print(f"[{i}/{len(qmd_files)}] ", end='')
            
            success = translate_qmd_file(
                file_path,
                source,
                target,
                dry_run=args.dry_run,
                create_backup_file=not args.no_backup,
                min_delay=args.delay,
                max_retries=args.retries,
                quiet=args.progress
            )
            
            if success:
                success_count += 1
            else:
                failed_files.append(file_path)
        
        if args.progress:
            print()  # End the progress bar line
        
        failed_count = len(failed_files)
        print(f"\n{'=' * 60}")
        print(f"Translation {'simulation' if args.dry_run else 'complete'}!")
        print(f"Success: {success_count} | Failed: {failed_count} | Total: {len(qmd_files)}")
        print(f"{'=' * 60}")
        
        if failed_files:
            print("\nFailed files:")
            for f in failed_files:
                print(f"  - {f}")
        
        sys.exit(0 if failed_count == 0 else 1)
    
    else:
        print(f"Error: '{path}' is neither a file nor a directory")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted by user. Exiting.")
        sys.exit(130)
