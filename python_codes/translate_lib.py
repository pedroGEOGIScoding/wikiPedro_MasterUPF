#!/usr/bin/env python3
"""
Translation library for .qmd files
Provides reusable functions with translator caching, rate limiting, and error handling
"""

import re
import time
import shutil
from pathlib import Path
from typing import Optional, Tuple
from deep_translator import GoogleTranslator


class TranslationCache:
    """Cache translator instances to avoid recreation overhead"""
    _translators = {}
    
    @classmethod
    def get_translator(cls, source: str, target: str) -> GoogleTranslator:
        """Get or create a cached translator instance"""
        key = f"{source}->{target}"
        if key not in cls._translators:
            cls._translators[key] = GoogleTranslator(source=source, target=target)
        return cls._translators[key]


class RateLimiter:
    """Simple rate limiter to avoid overwhelming the API"""
    def __init__(self, min_delay: float = 0.1, max_retries: int = 3):
        self.min_delay = min_delay
        self.max_retries = max_retries
        self.last_call = 0
    
    def wait(self):
        """Enforce minimum delay between calls"""
        now = time.time()
        elapsed = now - self.last_call
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_call = time.time()
    
    def translate_with_retry(self, translator: GoogleTranslator, text: str) -> str:
        """Translate with exponential backoff retry"""
        for attempt in range(self.max_retries):
            try:
                self.wait()
                return translator.translate(text)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                wait_time = (2 ** attempt) * self.min_delay
                print(f"Translation error (attempt {attempt + 1}/{self.max_retries}): {e}")
                print(f"Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
        return text  # Fallback


def create_backup(file_path: Path) -> Optional[Path]:
    """Create a backup of the file before modification"""
    try:
        backup_path = file_path.with_suffix(file_path.suffix + '.bak')
        shutil.copy2(file_path, backup_path)
        return backup_path
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")
        return None


def restore_backup(file_path: Path, backup_path: Path) -> bool:
    """Restore file from backup"""
    try:
        if backup_path and backup_path.exists():
            shutil.copy2(backup_path, file_path)
            return True
    except Exception as e:
        print(f"Error restoring backup: {e}")
    return False


def extract_yaml_and_content(file_path: Path) -> Tuple[str, str]:
    """Extract YAML frontmatter and content separately"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split YAML frontmatter and content
    parts = content.split('---', 2)
    if len(parts) >= 3:
        yaml_front = parts[1]
        main_content = parts[2]
        return yaml_front, main_content
    return "", content


def should_translate_line(line: str) -> bool:
    """Check if a line should be translated (skip code blocks, image syntax, etc.)"""
    line_stripped = line.strip()
    
    # Skip empty lines
    if not line_stripped:
        return False
    
    # Skip code blocks (including with language specification)
    if line_stripped.startswith('```'):
        return False
    
    # Skip raw content blocks (```{=html}, ```{=latex}, etc.)
    if re.match(r'^```\{=\w+\}', line_stripped):
        return False
    
    # Skip HTML tags and raw HTML
    if line_stripped.startswith('<') and line_stripped.endswith('>'):
        return False
    
    # Skip horizontal rules and page breaks
    if line_stripped in ['---', '***', '___', '{{< pagebreak >}}']:
        return False
    
    # Skip table separator lines (| --- | --- |)
    if re.match(r'^\|\s*-+\s*\|\s*-+\s*\|', line_stripped):
        return False
    
    # Skip Quarto div syntax (:::, ::::, :::::, etc.)
    if re.match(r'^:{3,}', line_stripped):
        return False
    
    # Skip Quarto shortcodes {{< ... >}}
    if re.match(r'^\{\{<.*>\}\}', line_stripped):
        return False
    
    # Skip line blocks (| syntax) - but not tables
    if line_stripped.startswith('|') and not line_stripped.startswith('|--'):
        if not re.match(r'^\|.*\|.*\|', line_stripped):
            return False
    
    # Skip LaTeX equations
    if line_stripped.startswith('$$') or (line_stripped.startswith('$') and line_stripped.endswith('$') and len(line_stripped) > 2):
        return False
    
    # Skip spans with only attributes [text]{.class}
    if re.match(r'^\[.*\]\{[.#].*\}$', line_stripped):
        return False
    
    return True


def translate_text(text: str, source: str, target: str, rate_limiter: Optional[RateLimiter] = None) -> str:
    """Translate text while preserving markdown structure"""
    if source == target:
        print(f"Warning: Source and target languages are the same ({source})")
        return text
    
    translator = TranslationCache.get_translator(source, target)
    if rate_limiter is None:
        rate_limiter = RateLimiter()
    
    lines = text.split('\n')
    translated_lines = []
    in_code_block = False
    
    for line in lines:
        # Track code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            translated_lines.append(line)
            continue
        
        # Don't translate inside code blocks
        if in_code_block:
            translated_lines.append(line)
            continue
        
        # Don't translate special markdown syntax
        if not should_translate_line(line):
            translated_lines.append(line)
            continue
        
        # Preserve markdown formatting (headers, lists, bold, etc.)
        stripped = line.lstrip()
        indent = line[:len(line) - len(stripped)]
        
        # Extract markdown prefix (##, *, -, etc.)
        prefix = ''
        content = stripped
        
        # Headers
        if stripped.startswith('#'):
            match = re.match(r'^(#+\s*)', stripped)
            if match:
                prefix = match.group(1)
                content = stripped[len(prefix):]
        
        # Lists
        elif re.match(r'^\*\s+', stripped) or re.match(r'^-\s+', stripped):
            match = re.match(r'^([*-]\s+)', stripped)
            if match:
                prefix = match.group(1)
                content = stripped[len(prefix):]
        
        # Numbered lists
        elif re.match(r'^\d+\.\s+', stripped):
            match = re.match(r'^(\d+\.\s+)', stripped)
            if match:
                prefix = match.group(1)
                content = stripped[len(prefix):]
        
        # Blockquotes
        elif stripped.startswith('>'):
            match = re.match(r'^(>+\s*)', stripped)
            if match:
                prefix = match.group(1)
                content = stripped[len(prefix):]
        
        # Special handling for images
        if stripped.startswith('!['):
            # Extract alt text and rest of image syntax
            match = re.match(r'^!\[(.*?)\](.*)$', stripped)
            if match:
                alt_text = match.group(1)
                rest = match.group(2)
                try:
                    translated_alt = rate_limiter.translate_with_retry(translator, alt_text) if alt_text else alt_text
                    translated_lines.append(f"{indent}![{translated_alt}]{rest}")
                except Exception as e:
                    print(f"Error translating image alt text: {e}")
                    translated_lines.append(line)
            else:
                translated_lines.append(line)
        # Translate only the content
        elif content.strip():
            try:
                translated_content = rate_limiter.translate_with_retry(translator, content)
                translated_lines.append(f"{indent}{prefix}{translated_content}")
            except Exception as e:
                print(f"Error translating line: {e}")
                translated_lines.append(line)
        else:
            translated_lines.append(line)
    
    return '\n'.join(translated_lines)


def translate_yaml_fields(yaml_content: str, source: str, target: str, rate_limiter: Optional[RateLimiter] = None) -> str:
    """Translate specific YAML fields"""
    if source == target:
        return yaml_content
    
    lines = yaml_content.split('\n')
    translated_lines = []
    translator = TranslationCache.get_translator(source, target)
    if rate_limiter is None:
        rate_limiter = RateLimiter()
    
    fields_to_translate = ['title', 'subtitle', 'description']
    
    for line in lines:
        translated_line = line
        
        # Handle title, subtitle, description (with or without quotes)
        for field in fields_to_translate:
            # Match: field: "value" or field: 'value' or field: value
            pattern = f'^({field}:\\s*)(["\']?)(.+?)(["\']?)\\s*$'
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                prefix = match.group(1)
                open_quote = match.group(2)
                value = match.group(3)
                close_quote = match.group(4) if match.group(4) else open_quote
                
                try:
                    translated_value = rate_limiter.translate_with_retry(translator, value)
                    translated_line = f"{prefix}{open_quote}{translated_value}{close_quote}"
                    break
                except Exception as e:
                    print(f"Error translating YAML field '{field}': {e}")
        
        # Handle categories array: [item1, item2, ...]
        if line.strip().startswith('categories:'):
            # Match: categories: [item1, item2, ...]
            match = re.match(r'^(categories:\s*\[)(.+?)(\])\s*$', line)
            if match:
                prefix = match.group(1)
                items = match.group(2)
                suffix = match.group(3)
                
                # Split items and translate each
                category_list = [item.strip() for item in items.split(',')]
                translated_categories = []
                
                for cat in category_list:
                    try:
                        translated_cat = rate_limiter.translate_with_retry(translator, cat)
                        translated_categories.append(translated_cat)
                    except Exception as e:
                        print(f"Error translating category '{cat}': {e}")
                        translated_categories.append(cat)
                
                translated_line = f"{prefix}{', '.join(translated_categories)}{suffix}"
        
        translated_lines.append(translated_line)
    
    return '\n'.join(translated_lines)


def translate_qmd_file(file_path: Path, source: str, target: str, dry_run: bool = False, create_backup_file: bool = True) -> bool:
    """
    Translate a .qmd file in place
    
    Args:
        file_path: Path to the .qmd file
        source: Source language code (e.g., 'es', 'ca', 'en')
        target: Target language code
        dry_run: If True, don't write changes, just simulate
        create_backup_file: If True, create a .bak backup before modifying
    
    Returns:
        True if successful, False otherwise
    """
    if not file_path.exists():
        print(f"Error: File {file_path} does not exist!")
        return False
    
    if source == target:
        print(f"Skipping {file_path}: Source and target languages are the same ({source})")
        return False
    
    print(f"{'[DRY RUN] ' if dry_run else ''}Translating: {file_path}")
    
    # Create backup if requested
    backup_path = None
    if create_backup_file and not dry_run:
        backup_path = create_backup(file_path)
    
    try:
        yaml_front, main_content = extract_yaml_and_content(file_path)
        rate_limiter = RateLimiter()
        
        # Translate YAML fields
        if yaml_front:
            translated_yaml = translate_yaml_fields(yaml_front, source, target, rate_limiter)
        else:
            translated_yaml = yaml_front
        
        # Translate main content
        translated_content = translate_text(main_content, source, target, rate_limiter)
        
        # Reconstruct file
        if yaml_front:
            final_content = f"---{translated_yaml}---{translated_content}"
        else:
            final_content = translated_content
        
        # Write back to the same file (unless dry run)
        if not dry_run:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(final_content)
            
            # Clean up backup if successful
            if backup_path and backup_path.exists():
                backup_path.unlink()
        
        print(f"✓ {'[DRY RUN] ' if dry_run else ''}Translated: {file_path}")
        return True
        
    except Exception as e:
        print(f"✗ Error translating {file_path}: {e}")
        # Restore from backup if translation failed
        if backup_path and not dry_run:
            if restore_backup(file_path, backup_path):
                print(f"Restored from backup: {backup_path}")
        return False


def find_qmd_files(directory: Path, exclude_underscore: bool = True) -> list[Path]:
    """
    Find all .qmd files in a directory and subdirectories
    
    Args:
        directory: Directory to search
        exclude_underscore: If True, skip files starting with '_'
    
    Returns:
        List of .qmd file paths
    """
    qmd_files = list(directory.rglob('*.qmd'))
    
    if exclude_underscore:
        qmd_files = [f for f in qmd_files if not f.name.startswith('_')]
    
    return qmd_files
