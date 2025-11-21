# Wiki Master UPF - Multilingual Quarto Site

Personal website documenting my journey through the Master's Degree in Secondary Education Teaching at Universitat Pompeu Fabra.

## 🌐 Languages

This site is available in three languages:
- **🇪🇸 Spanish (Español)** - Default language (root)
- **🇨🇦 Catalan (Català)** - `/ca/`
- **🇬🇧 English** - `/en/`

## 📁 Project Structure

```
wiki_MasterUPF/
├── es/              # Spanish content (renders to /docs/)
├── ca/              # Catalan content (renders to /docs/ca/)
├── en/              # English content (renders to /docs/en/)
├── docs/            # Rendered output (published to GitHub Pages)
├── python_codes/    # Translation scripts
└── .github/
    └── workflows/
        └── deploy-quarto.yml  # GitHub Actions deployment
```

## 🚀 Local Development

### Prerequisites
- [Quarto](https://quarto.org/docs/get-started/)
- Python 3.x (for translation scripts)

### Rendering the Site

**Render all languages:**
```bash
# Spanish (default)
cd es && quarto render && cd ..

# Catalan
cd ca && quarto render && cd ..

# English
cd en && quarto render && cd ..
```

**Preview the site:**
```bash
cd es
quarto preview
```

## 🔄 Translation Workflow

### Batch Translation

**Translate all Catalan files:**
```bash
cd ca
python3 ../python_codes/translate_to_catalan.py
```

**Translate all English files:**
```bash
cd en
python3 ../python_codes/translate_to_english.py
```

### Single File Translation

**Translate a single Catalan file:**
```bash
cd ca
python3 ../python_codes/translate_single_file.py <filename.qmd>
```

**Translate a single English file:**
```bash
cd en
python3 ../python_codes/translate_single_file_en.py <filename.qmd>
```

## 📦 Deployment

The site automatically deploys to GitHub Pages when you push to the `main` or `master` branch using GitHub Actions.

### Manual Deployment Steps:

1. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: GitHub Actions

2. **Push changes:**
   ```bash
   git add .
   git commit -m "Update content"
   git push origin main
   ```

3. **Monitor deployment:**
   - Check the Actions tab in your GitHub repository

## 🛠️ Configuration Files

Each language folder contains:
- `_quarto.yml` - Quarto project configuration
- `_website.yml` - Website structure and navigation
- `_format.yml` - Output format settings
- `_brand.yml` - Branding and styling

## 📝 Adding Content

1. Add content to the Spanish version in `/es/`
2. Copy the file structure to `/ca/` and `/en/`
3. Run translation scripts or manually translate
4. Render all versions
5. Commit and push

## 🔗 Links

- **Live Site:** [Your GitHub Pages URL]
- **Repository:** https://github.com/pedromartinezduran/wiki_MasterUPF
- **UPF Master Program:** [Program URL]

## 📄 License

Copyright 2025, Pedro Martinez Duran

---

*Per aspera, ad astra*
