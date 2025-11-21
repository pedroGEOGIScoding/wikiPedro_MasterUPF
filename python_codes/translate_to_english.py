#!/usr/bin/env python3
"""
Batch translate .qmd files from Spanish to English in place using Google Translate (free)
Run this script from within the target directory (e.g., cd en/ && python3 ../python_codes/translate_to_english.py)
Translates all .qmd files in current directory and subfolders while preserving Quarto syntax
"""

import os
import re
from pathlib import Path
from deep_translator import GoogleTranslator

def extract_yaml_and_content(file_path):
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

def should_translate_line(line):
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
    
    # Don't skip images - we'll handle them specially
    # if line_stripped.startswith('!['):
    #     return False
    
    # Skip HTML tags and raw HTML
    if line_stripped.startswith('<') and line_stripped.endswith('>'):
        return False
    
    # Skip horizontal rules and page breaks
    if line_stripped in ['---', '***', '___', '{{< pagebreak >}}']:
        return False
    
    # Skip Quarto div syntax (:::, ::::, :::::, etc.)
    if re.match(r'^:{3,}', line_stripped):
        return False
    
    # Skip Quarto shortcodes {{< ... >}}
    if re.match(r'^\{\{<.*>\}\}', line_stripped):
        return False
    
    # Skip blockquotes (we'll handle them specially)
    # if line_stripped.startswith('>'):
    #     return False
    
    # Skip line blocks (| syntax)
    if line_stripped.startswith('|') and not line_stripped.startswith('|--'):
        # Check if it's a line block, not a table
        if not re.match(r'^\|.*\|.*\|', line_stripped):
            return False
    
    # Skip LaTeX equations
    if line_stripped.startswith('$$') or (line_stripped.startswith('$') and line_stripped.endswith('$') and len(line_stripped) > 2):
        return False
    
    # Skip spans with only attributes [text]{.class}
    if re.match(r'^\[.*\]\{[.#].*\}$', line_stripped):
        return False
    
    # Skip YAML-like lines (key: value) that might be attributes
    if re.match(r'^[a-zA-Z0-9_-]+:\s*[^\s]', line_stripped) and not line_stripped.endswith('.'):
        # This might be a definition list or attribute, be cautious
        pass
    
    return True

def translate_text(text, source='es', target='en'):
    """Translate text while preserving markdown structure"""
    translator = GoogleTranslator(source=source, target=target)
    
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
                    translated_alt = translator.translate(alt_text) if alt_text else alt_text
                    translated_lines.append(f"{indent}![{translated_alt}]{rest}")
                except Exception as e:
                    print(f"Error translating image alt text: {e}")
                    translated_lines.append(line)
            else:
                translated_lines.append(line)
        # Translate only the content
        elif content.strip():
            try:
                translated_content = translator.translate(content)
                translated_lines.append(f"{indent}{prefix}{translated_content}")
            except Exception as e:
                print(f"Error translating line: {e}")
                translated_lines.append(line)
        else:
            translated_lines.append(line)
    
    return '\n'.join(translated_lines)

def translate_yaml_fields(yaml_content):
    """Translate specific YAML fields"""
    lines = yaml_content.split('\n')
    translated_lines = []
    translator = GoogleTranslator(source='es', target='en')
    
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
                    translated_value = translator.translate(value)
                    translated_line = f"{prefix}{open_quote}{translated_value}{close_quote}"
                    break
                except Exception as e:
                    print(f"Error translating YAML field '{field}': {e}")
        
        # Handle categories array: [guia, master]
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
                        translated_cat = translator.translate(cat)
                        translated_categories.append(translated_cat)
                    except Exception as e:
                        print(f"Error translating category '{cat}': {e}")
                        translated_categories.append(cat)
                
                translated_line = f"{prefix}{', '.join(translated_categories)}{suffix}"
        
        translated_lines.append(translated_line)
    
    return '\n'.join(translated_lines)

def translate_qmd_file(file_path):
    """Translate a .qmd file in place"""
    print(f"Translating: {file_path}")
    
    yaml_front, main_content = extract_yaml_and_content(file_path)
    
    # Translate YAML fields
    if yaml_front:
        translated_yaml = translate_yaml_fields(yaml_front)
    else:
        translated_yaml = yaml_front
    
    # Translate main content
    translated_content = translate_text(main_content)
    
    # Reconstruct file
    if yaml_front:
        final_content = f"---{translated_yaml}---{translated_content}"
    else:
        final_content = translated_content
    
    # Write back to the same file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"✓ Translated: {file_path}")

def main():
    """Find and translate all .qmd files in current directory and subfolders"""
    current_dir = Path.cwd()
    
    print(f"Working directory: {current_dir}")
    
    # Find all .qmd files in current folder and subfolders
    qmd_files = list(current_dir.rglob('*.qmd'))
    
    # Exclude configuration files
    qmd_files = [
        f for f in qmd_files 
        if not f.name.startswith('_')  # Skip _website.yml, _quarto.yml, etc.
    ]
    
    if not qmd_files:
        print("No .qmd files found in current directory!")
        return
    
    print(f"Found {len(qmd_files)} .qmd files to translate\n")
    
    for i, file_path in enumerate(qmd_files, 1):
        print(f"[{i}/{len(qmd_files)}] ", end='')
        
        try:
            translate_qmd_file(file_path)
        except Exception as e:
            print(f"✗ Error with {file_path}: {e}")
    
    print(f"\n✓ Translation complete! Translated {len(qmd_files)} files in place.")

if __name__ == "__main__":
    main()
