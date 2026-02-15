"""
Landsat Timelapse Creator with Interactive Map
Author: Your Name
Date: 2026-02-14
Description: Creates Landsat timelapses with year labels using geemap
"""

import ee
import geemap
from geemap.timelapse import landsat_timelapse
import os
import json
import calendar
import threading
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont

# ============================================
# AUTHENTICATION AND INITIALIZATION
# ============================================

# Initialize Earth Engine
# First time: run ee.Authenticate() in terminal
try:
    ee.Initialize(project='basic-scripts-pedro')
    print("✅ Earth Engine initialized successfully!")
except Exception as e:
    print("❌ Error initializing Earth Engine. Please run: ee.Authenticate()")
    print(f"Error: {e}")
    exit()

# ============================================
# CONFIGURATION
# ============================================

config = {
    'title': 'Landsat Timelapse',
    'start_year': 1984,
    'end_year': 2025,
    'start_month': 5,      # May
    'end_month': 10,       # October
    'start_day': 1,
    'end_day': 30,
    
    # Band combinations
    # Options: 'Red/Green/Blue', 'NIR/Red/Green', 'SWIR2/SWIR1/NIR', 
    #          'NIR/SWIR1/Red', 'SWIR2/NIR/Red', 'SWIR1/NIR/Red'
    'bands': 'Red/Green/Blue',
    
    # Cloud masking
    'apply_fmask': True,
    
    # Video settings
    'frames_per_second': 5,
    'font_size': 18,
    'font_color': 'white',
    'progress_bar_color': 'blue',
    'dimensions': 384,     # Image width in pixels (default 768, lower = faster)
    
    # Output settings
    'output_folder': './timelapse_outputs',
    'gif_filename': 'landsat_timelapse.gif'
}

# ============================================
# CREATE OUTPUT FOLDER
# ============================================

if not os.path.exists(config['output_folder']):
    os.makedirs(config['output_folder'])
    print(f"✅ Created output folder: {config['output_folder']}")

# ============================================
# CREATE INTERACTIVE MAP
# ============================================

print("\n🗺️  Creating interactive map...")
Map = geemap.Map()
Map.add_basemap('HYBRID')

# Set initial view (adjust to your region)
Map.setCenter(2.1734, 41.3851, 9)  # Centered on Barcelona/Catalonia

print("✅ Map created!")

# ============================================
# FUNCTIONS
# ============================================

def add_month_year_labels(gif_path, start_year, end_year, start_month, end_month,
                         font_size=30, font_color='white'):
    """
    Post-process a timelapse GIF to add month-year labels to each frame.
    
    Args:
        gif_path: Path to the GIF file
        start_year, end_year: Year range
        start_month, end_month: Month range
        font_size: Size of the label text
        font_color: Color of the label text
    """
    start_name = calendar.month_abbr[start_month]
    end_name = calendar.month_abbr[end_month]
    years = list(range(start_year, end_year + 1))
    
    img = Image.open(gif_path)
    frames = []
    durations = []
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except (IOError, OSError):
        font = ImageFont.load_default()
    
    i = 0
    while True:
        try:
            img.seek(i)
        except EOFError:
            break
        frame = img.convert('RGBA')
        durations.append(img.info.get('duration', 200))
        
        if i < len(years):
            label = f"{start_name}-{end_name} {years[i]}"
        else:
            label = ""
        
        if label:
            draw = ImageDraw.Draw(frame)
            bbox = draw.textbbox((0, 0), label, font=font)
            text_w = bbox[2] - bbox[0]
            x = frame.width - text_w - 10
            y = 5
            # Draw shadow for readability
            draw.text((x + 1, y + 1), label, font=font, fill='black')
            draw.text((x, y), label, font=font, fill=font_color)
        
        frames.append(frame.convert('P', palette=Image.ADAPTIVE))
        i += 1
    
    if frames:
        frames[0].save(
            gif_path,
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=0
        )
        print(f"   📝 Added '{start_name}-{end_name} YYYY' labels to {len(frames)} frames")


def create_timelapse(roi, output_path=None):
    """
    Create a Landsat timelapse for a given region of interest
    
    Args:
        roi: Earth Engine geometry (drawn on map or defined manually)
        output_path: Path to save the GIF (optional)
    """
    
    if output_path is None:
        output_path = os.path.join(config['output_folder'], config['gif_filename'])
    
    print(f"\n🎬 Creating timelapse...")
    print(f"   Years: {config['start_year']} - {config['end_year']}")
    print(f"   Months: {config['start_month']} - {config['end_month']}")
    print(f"   Bands: {config['bands']}")
    print(f"   Dimensions: {config['dimensions']}px")
    print(f"   Cloud masking: {config['apply_fmask']}")
    
    # Determine if we need a progress bar
    add_progress_bar = config['start_year'] != config['end_year']
    
    # Format dates
    start_date = f"{config['start_month']:02d}-{config['start_day']:02d}"
    end_date = f"{config['end_month']:02d}-{config['end_day']:02d}"
    
    try:
        # Create timelapse using landsat_timelapse directly (add_text=False removes year-only label)
        landsat_timelapse(
            roi=roi,
            out_gif=output_path,
            start_year=config['start_year'],
            end_year=config['end_year'],
            start_date=start_date,
            end_date=end_date,
            bands=config['bands'].split('/'),
            dimensions=config['dimensions'],
            font_color=config['font_color'],
            frames_per_second=config['frames_per_second'],
            font_size=config['font_size'],
            add_text=False,
            add_progress_bar=add_progress_bar,
            progress_bar_color=config['progress_bar_color'],
            apply_fmask=config['apply_fmask'],
        )
        
        # Post-process: add month-year labels to each frame
        add_month_year_labels(
            output_path,
            config['start_year'], config['end_year'],
            config['start_month'], config['end_month'],
            font_size=config['font_size'],
            font_color=config['font_color']
        )
        
        print(f"\n✅ Timelapse created successfully!")
        print(f"   Saved to: {output_path}")
        
        # Display in notebook if available
        try:
            from IPython.display import Image as IPImage, display
            display(IPImage(filename=output_path))
        except:
            print(f"   Open the file to view: {output_path}")
            
    except Exception as e:
        print(f"\n❌ Error creating timelapse: {e}")
        raise

def define_roi_coordinates(west, south, east, north):
    """
    Define ROI using coordinates
    
    Args:
        west, south, east, north: Bounding box coordinates
    
    Returns:
        ee.Geometry.Rectangle
    """
    return ee.Geometry.Rectangle([west, south, east, north])

def define_roi_corners(top_left, bottom_right):
    """
    Define ROI using top-left and bottom-right corner coordinates.
    
    Args:
        top_left: (lat, lon) tuple of the top-left corner
        bottom_right: (lat, lon) tuple of the bottom-right corner
    
    Returns:
        ee.Geometry.Rectangle
    """
    north, west = top_left
    south, east = bottom_right
    return ee.Geometry.Rectangle([west, south, east, north])

# ============================================
# INTERACTIVE MAP SELECTOR
# ============================================

def select_area_interactive(port=5050):
    """
    Open an interactive map in the browser where the user can draw a
    rectangle or polygon to select the region of interest.
    Once the shape is drawn and 'Create Timelapse' is clicked,
    the script creates the timelapse automatically.
    """
    
    roi_result = {'geometry': None, 'event': threading.Event()}
    
    MAP_HTML = """<!DOCTYPE html>
<html>
<head>
    <title>Select Area for Timelapse</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #map { height: 100vh; width: 100vw; }
        #panel {
            position: absolute; top: 10px; right: 10px; z-index: 1000;
            background: white; padding: 15px; border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3); max-width: 280px;
        }
        #panel h3 { margin: 0 0 10px 0; color: #333; }
        #panel p { margin: 5px 0; font-size: 13px; color: #666; }
        #create-btn {
            display: none; width: 100%; padding: 12px; margin-top: 10px;
            background: #2196F3; color: white; border: none; border-radius: 5px;
            font-size: 15px; font-weight: bold; cursor: pointer;
        }
        #create-btn:hover { background: #1976D2; }
        #create-btn:disabled { background: #ccc; cursor: not-allowed; }
        #stop-btn {
            display: none; width: 100%; padding: 10px; margin-top: 8px;
            background: #f44336; color: white; border: none; border-radius: 5px;
            font-size: 14px; font-weight: bold; cursor: pointer;
        }
        #stop-btn:hover { background: #d32f2f; }
        #download-btn {
            display: none; width: 100%; padding: 10px; margin-top: 8px;
            background: #4CAF50; color: white; border: none; border-radius: 5px;
            font-size: 14px; font-weight: bold; cursor: pointer; text-decoration: none; text-align: center;
            box-sizing: border-box;
        }
        #download-btn:hover { background: #388E3C; }
        #new-btn {
            display: none; width: 100%; padding: 10px; margin-top: 8px;
            background: #FF9800; color: white; border: none; border-radius: 5px;
            font-size: 14px; font-weight: bold; cursor: pointer;
        }
        #new-btn:hover { background: #F57C00; }
        #pause-btn {
            display: none; width: 100%; padding: 10px; margin-top: 8px;
            background: #9C27B0; color: white; border: none; border-radius: 5px;
            font-size: 14px; font-weight: bold; cursor: pointer;
        }
        #pause-btn:hover { background: #7B1FA2; }
        #clear-btn {
            width: 100%; padding: 10px; margin-top: 12px;
            background: #607D8B; color: white; border: none; border-radius: 5px;
            font-size: 13px; font-weight: bold; cursor: pointer; border-top: 1px solid #ddd;
        }
        #clear-btn:hover { background: #455A64; }
        .north-arrow {
            background: white; padding: 4px 8px; border-radius: 4px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4); text-align: center;
            font-size: 22px; line-height: 1; cursor: default;
        }
        .north-arrow span { display: block; font-size: 11px; font-weight: bold; color: #333; }
        .search-results {
            position: absolute; top: 100%; left: 0; right: 0; background: white;
            border-radius: 0 0 6px 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            max-height: 200px; overflow-y: auto; z-index: 2000; display: none;
        }
        .search-results div {
            padding: 8px 12px; font-size: 13px; cursor: pointer; border-top: 1px solid #eee;
        }
        .search-results div:hover { background: #f0f0f0; }
        #status { margin-top: 8px; font-size: 13px; color: #333; }
        #coords { font-size: 12px; color: #888; margin-top: 5px; word-break: break-all; }
        label.band-label { font-size: 13px; font-weight: bold; color: #333; margin-top: 10px; display: block; }
        #bands-select, #res-select { width: 100%; padding: 8px; margin-top: 4px; border-radius: 4px; border: 1px solid #ccc; font-size: 13px; }
        label.res-label { font-size: 13px; font-weight: bold; color: #333; margin-top: 10px; display: block; }
    </style>
</head>
<body>
    <div id="map"></div>
    <div id="panel">
        <h3>🎬 Timelapse Area</h3>
        <p>Draw a <b>rectangle</b> or <b>polygon</b> on the map to select the area.</p>
        <label class="band-label" for="bands-select">Band Combination:</label>
        <select id="bands-select">
            <option value="Red/Green/Blue">Red/Green/Blue (True Color)</option>
            <option value="NIR/Red/Green">NIR/Red/Green (False Color)</option>
            <option value="SWIR2/SWIR1/NIR">SWIR2/SWIR1/NIR</option>
            <option value="NIR/SWIR1/Red">NIR/SWIR1/Red</option>
            <option value="SWIR2/NIR/Red">SWIR2/NIR/Red</option>
            <option value="SWIR1/NIR/Red">SWIR1/NIR/Red</option>
        </select>
        <label class="res-label" for="res-select">Resolution:</label>
        <select id="res-select">
            <option value="256">256px (Fast)</option>
            <option value="384" selected>384px (Default)</option>
            <option value="512">512px</option>
            <option value="768">768px (High)</option>
            <option value="1024">1024px (Very High)</option>
        </select>
        <button id="create-btn" onclick="submitROI()">Create Timelapse</button>
        <button id="stop-btn" onclick="stopScript()">⏹ Stop</button>
        <a id="download-btn" href="#">⬇ Download GIF</a>
        <button id="new-btn" onclick="newTimelapse()">🔄 New Timelapse</button>
        <button id="pause-btn" onclick="toggleAnimation()">⏸ Pause</button>
        <div id="status"></div>
        <div id="coords"></div>
        <hr style="border:none;border-top:1px solid #ddd;margin-top:12px;">
        <button id="clear-btn" onclick="clearAll()">🗑 Clear All & Restart</button>
        <hr style="border:none;border-top:1px solid #ddd;margin-top:12px;">
        <label style="font-size:13px;font-weight:bold;color:#333;display:block;">🔍 Search Location:</label>
        <div style="position:relative;margin-top:4px;">
            <input id="search-input" type="text" placeholder="Search location..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:13px;box-sizing:border-box;">
            <div id="search-results" class="search-results"></div>
        </div>
    </div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <script>
        var map = L.map('map').setView([40.65, 0.6], 8);

        // Base layers
        var esriImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri', maxZoom: 18
        });
        var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
        });
        var cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO', maxZoom: 20
        });
        var cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO', maxZoom: 20
        });
        var esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri', maxZoom: 18
        });
        var openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenTopoMap', maxZoom: 17
        });
        esriImagery.addTo(map);

        L.control.layers({
            'Esri Satellite': esriImagery,
            'OpenStreetMap': osm,
            'Carto Light': cartoLight,
            'Carto Dark': cartoDark,
            'Esri Topographic': esriTopo,
            'OpenTopoMap': openTopo
        }, null, {position: 'bottomright'}).addTo(map);

        // Custom fancy scale bar (GMT/PyGMT style) at bottom-left
        var ScaleBar = L.Control.extend({
            options: { position: 'bottomleft', numSegments: 4 },
            onAdd: function(map) {
                this._container = L.DomUtil.create('div', 'custom-scalebar');
                this._container.style.cssText = 'background:rgba(255,255,255,0.85);padding:8px 12px 6px 12px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.3);';
                L.DomEvent.disableClickPropagation(this._container);
                map.on('zoomend moveend resize', this._update, this);
                this._update();
                return this._container;
            },
            onRemove: function(map) { map.off('zoomend moveend resize', this._update, this); },
            _update: function() {
                var map = this._map;
                var targetPx = Math.round(map.getSize().x * 0.2);
                var y = map.getSize().y / 2;
                var p1 = map.containerPointToLatLng([0, y]);
                var p2 = map.containerPointToLatLng([targetPx, y]);
                var dist = map.distance(p1, p2);
                var nice = [1,2,5,10,20,25,50,100,200,250,500,1000,2000,2500,5000,10000,20000,25000,50000,100000,200000,500000];
                var n = this.options.numSegments;
                var totalDist = 0;
                for (var i = 0; i < nice.length; i++) {
                    if (nice[i] * n <= dist) totalDist = nice[i] * n;
                }
                if (!totalDist) totalDist = dist;
                var segDist = totalDist / n;
                var barPx = Math.round(targetPx * totalDist / dist);
                var segPx = barPx / n;
                var useKm = totalDist >= 1000;
                var unit = useKm ? 'km' : 'm';
                var tickH = 6;
                var barH = 8;
                // Build SVG
                var svgW = barPx + 2;
                var svgH = barH + tickH + 22;
                var svg = '<svg width="' + svgW + '" height="' + svgH + '" xmlns="http://www.w3.org/2000/svg">';
                // Alternating filled rectangles
                for (var s = 0; s < n; s++) {
                    var x = 1 + s * segPx;
                    var fill = (s % 2 === 0) ? '#000' : '#fff';
                    svg += '<rect x="' + x + '" y="0" width="' + segPx + '" height="' + barH + '" fill="' + fill + '" stroke="#000" stroke-width="1"/>';
                }
                // Tick marks at boundaries + labels below
                for (var s = 0; s <= n; s++) {
                    var x = 1 + s * segPx;
                    svg += '<line x1="' + x + '" y1="' + barH + '" x2="' + x + '" y2="' + (barH + tickH) + '" stroke="#000" stroke-width="1.2"/>';
                    var d = segDist * s;
                    var val = useKm ? (d / 1000) : d;
                    // Clean up floating point
                    val = Math.round(val * 100) / 100;
                    var anchor = 'middle';
                    if (s === 0) anchor = 'start';
                    if (s === n) anchor = 'end';
                    svg += '<text x="' + x + '" y="' + (barH + tickH + 13) + '" text-anchor="' + anchor + '" font-size="12" font-family="Arial" font-weight="bold" fill="#000">' + val + '</text>';
                }
                // Unit label centered below
                svg += '<text x="' + (barPx / 2 + 1) + '" y="' + (svgH - 1) + '" text-anchor="middle" font-size="11" font-family="Arial" fill="#333">' + unit + '</text>';
                svg += '</svg>';
                this._container.innerHTML = svg;
            }
        });
        map.addControl(new ScaleBar());

        // Geocoding search box (in panel)
        (function() {
            var input = document.getElementById('search-input');
            var results = document.getElementById('search-results');
            var timer = null;
            input.addEventListener('input', function() {
                clearTimeout(timer);
                var q = input.value.trim();
                if (q.length < 3) { results.style.display = 'none'; results.innerHTML = ''; return; }
                timer = setTimeout(function() {
                    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + encodeURIComponent(q))
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        results.innerHTML = '';
                        if (!data.length) { results.style.display = 'none'; return; }
                        data.forEach(function(item) {
                            var row = document.createElement('div');
                            row.innerText = item.display_name;
                            row.addEventListener('click', function() {
                                map.flyTo([parseFloat(item.lat), parseFloat(item.lon)], 13);
                                input.value = item.display_name;
                                results.style.display = 'none';
                            });
                            results.appendChild(row);
                        });
                        results.style.display = 'block';
                    });
                }, 400);
            });
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') { results.style.display = 'none'; }
            });
            document.addEventListener('click', function(e) {
                if (!input.parentElement.contains(e.target)) results.style.display = 'none';
            });
        })();

        // North arrow at top-left
        var NorthArrow = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function(map) {
                var div = L.DomUtil.create('div', 'north-arrow');
                div.innerHTML = '&#9650;<span>N</span>';
                div.title = 'North';
                return div;
            }
        });
        map.addControl(new NorthArrow());

        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        var drawControl = new L.Control.Draw({
            draw: {
                polygon: true, rectangle: true,
                circle: false, circlemarker: false, marker: false, polyline: false
            },
            edit: { featureGroup: drawnItems }
        });
        map.addControl(drawControl);

        var currentGeoJSON = null;

        map.on(L.Draw.Event.CREATED, function(e) {
            drawnItems.clearLayers();
            drawnItems.addLayer(e.layer);
            currentGeoJSON = e.layer.toGeoJSON().geometry;
            document.getElementById('create-btn').style.display = 'block';
            document.getElementById('coords').innerText = JSON.stringify(currentGeoJSON.coordinates[0].map(
                function(c) { return [c[1].toFixed(4), c[0].toFixed(4)]; }
            ));
            document.getElementById('status').innerText = '✅ Area selected!';
        });

        map.on(L.Draw.Event.DELETED, function() {
            currentGeoJSON = null;
            document.getElementById('create-btn').style.display = 'none';
            document.getElementById('coords').innerText = '';
            document.getElementById('status').innerText = '';
        });

        var abortCtrl = null;
        var frameOverlay = null;
        var opacityLbl = null;
        var opacitySlider = null;
        var speedLbl = null;
        var speedSlider = null;
        var opWrap = null;
        var spWrap = null;
        var gifBounds = null;
        var frames = [];
        var frameIdx = 0;
        var frameTimer = null;
        var frameSpeed = 200; // ms per frame
        var isPlaying = true;

        function showFrame(idx) {
            if (!frames.length || !gifBounds) return;
            var op = opacitySlider ? opacitySlider.value / 100 : 0.9;
            if (frameOverlay) map.removeLayer(frameOverlay);
            frameOverlay = L.imageOverlay('/frame/' + idx + '?' + Date.now(), gifBounds, {opacity: op}).addTo(map);
        }

        function startPlayer() {
            stopPlayer();
            isPlaying = true;
            document.getElementById('pause-btn').innerText = '\u23f8 Pause';
            frameTimer = setInterval(function() {
                frameIdx = (frameIdx + 1) % frames.length;
                showFrame(frameIdx);
            }, frameSpeed);
        }

        function stopPlayer() {
            if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
            isPlaying = false;
        }

        function toggleAnimation() {
            if (isPlaying) {
                stopPlayer();
                document.getElementById('pause-btn').innerText = '\u25b6 Play';
            } else {
                startPlayer();
            }
        }

        function initPlayer(frameCount) {
            frames = [];
            for (var i = 0; i < frameCount; i++) frames.push(i);
            frameIdx = 0;
            frameSpeed = 200;
            showFrame(0);
            startPlayer();
        }

        function newTimelapse() {
            // Remove overlay and stop player
            stopPlayer();
            if (frameOverlay) { map.removeLayer(frameOverlay); frameOverlay = null; }
            gifBounds = null; frames = []; frameIdx = 0;
            document.getElementById('pause-btn').style.display = 'none';
            if (spWrap) { spWrap.remove(); spWrap = null; }
            if (opWrap) { opWrap.remove(); opWrap = null; }
            if (speedLbl) { speedLbl.remove(); speedLbl = null; }
            if (speedSlider) { speedSlider.remove(); speedSlider = null; }
            if (opacityLbl) { opacityLbl.remove(); opacityLbl = null; }
            if (opacitySlider) { opacitySlider.remove(); opacitySlider = null; }
            drawnItems.clearLayers();
            currentGeoJSON = null;
            // Reset UI
            document.getElementById('create-btn').style.display = 'none';
            document.getElementById('create-btn').disabled = false;
            document.getElementById('create-btn').innerText = 'Create Timelapse';
            document.getElementById('stop-btn').style.display = 'none';
            document.getElementById('download-btn').style.display = 'none';
            document.getElementById('new-btn').style.display = 'none';
            document.getElementById('bands-select').style.display = '';
            document.querySelector('.band-label').style.display = '';
            document.getElementById('res-select').style.display = '';
            document.querySelector('.res-label').style.display = '';
            document.querySelector('#panel p').style.display = '';
            document.getElementById('status').innerText = '';
            document.getElementById('coords').innerText = '';
            // Tell server to reset
            fetch('/reset', {method: 'POST'});
        }

        function clearAll() {
            fetch('/reset', {method: 'POST'}).then(function() {
                window.location.reload();
            });
        }

        function stopScript() {
            if (abortCtrl) abortCtrl.abort();
            fetch('/stop', {method: 'POST'}).then(function() {
                document.getElementById('status').innerText = '⏹ Stopped.';
                document.getElementById('stop-btn').style.display = 'none';
                document.getElementById('create-btn').disabled = false;
                document.getElementById('create-btn').innerText = 'Create Timelapse';
                document.getElementById('bands-select').style.display = '';
                document.querySelector('.band-label').style.display = '';
                document.getElementById('res-select').style.display = '';
                document.querySelector('.res-label').style.display = '';
                document.querySelector('#panel p').style.display = '';
            });
        }

        function submitROI() {
            if (!currentGeoJSON) return;
            var btn = document.getElementById('create-btn');
            btn.disabled = true;
            btn.innerText = 'Processing...';
            document.getElementById('status').innerText = '⏳ Creating timelapse... Check your terminal for progress.';
            document.getElementById('bands-select').style.display = 'none';
            document.querySelector('.band-label').style.display = 'none';
            document.getElementById('res-select').style.display = 'none';
            document.querySelector('.res-label').style.display = 'none';
            document.querySelector('#panel p').style.display = 'none';
            document.getElementById('stop-btn').style.display = 'block';

            abortCtrl = new AbortController();
            fetch('/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({geometry: currentGeoJSON, bands: document.getElementById('bands-select').value, dimensions: parseInt(document.getElementById('res-select').value)}),
                signal: abortCtrl.signal
            }).then(function(r) { return r.json(); })
              .then(function(data) {
                if (data.status === 'ok' && data.bounds) {
                    document.getElementById('status').innerText = '✅ ' + data.message;
                    btn.innerText = 'Done!';
                    document.getElementById('stop-btn').style.display = 'none';
                    var dlBtn = document.getElementById('download-btn');
                    dlBtn.style.display = 'block';
                    dlBtn.href = '/download';
                    dlBtn.download = 'timelapse.gif';
                    document.getElementById('new-btn').style.display = 'block';
                    document.getElementById('pause-btn').style.display = 'block';
                    // Setup frame player on the map
                    drawnItems.clearLayers();
                    var b = data.bounds;
                    var bounds = [[b.south, b.west], [b.north, b.east]];
                    gifBounds = bounds;
                    map.fitBounds(bounds);
                    // Fetch frame count and start player
                    fetch('/frame-count').then(function(r){return r.json();}).then(function(info){
                        initPlayer(info.count);
                    });
                    // Add opacity slider
                    if (opacityLbl) opacityLbl.remove();
                    if (opacitySlider) opacitySlider.remove();
                    opacitySlider = document.createElement('input');
                    opacitySlider.type = 'range'; opacitySlider.min = '0'; opacitySlider.max = '100'; opacitySlider.value = '90';
                    opacitySlider.style.cssText = 'width:100%;margin-top:8px;';
                    opacitySlider.oninput = function() { if(frameOverlay) frameOverlay.setOpacity(this.value / 100); };
                    opacityLbl = document.createElement('label');
                    opacityLbl.style.cssText = 'font-size:13px;font-weight:bold;color:#333;margin-top:10px;display:block;';
                    opacityLbl.innerText = 'Overlay Opacity:';
                    document.getElementById('panel').appendChild(opacityLbl);
                    if (opWrap) opWrap.remove();
                    opWrap = document.createElement('div');
                    opWrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:8px;';
                    var opMin = document.createElement('span'); opMin.innerText = '0%'; opMin.style.cssText = 'font-size:11px;color:#888;';
                    var opMax = document.createElement('span'); opMax.innerText = '100%'; opMax.style.cssText = 'font-size:11px;color:#888;';
                    opacitySlider.style.cssText = 'flex:1;';
                    opWrap.appendChild(opMin); opWrap.appendChild(opacitySlider); opWrap.appendChild(opMax);
                    document.getElementById('panel').appendChild(opWrap);
                    // Add speed slider
                    if (speedLbl) speedLbl.remove();
                    if (speedSlider) speedSlider.remove();
                    speedSlider = document.createElement('input');
                    speedSlider.type = 'range'; speedSlider.min = '50'; speedSlider.max = '1000'; speedSlider.value = '200';
                    speedSlider.style.cssText = 'width:100%;margin-top:8px;';
                    speedSlider.oninput = function() {
                        frameSpeed = parseInt(this.value);
                        if (isPlaying) startPlayer();
                    };
                    speedLbl = document.createElement('label');
                    speedLbl.style.cssText = 'font-size:13px;font-weight:bold;color:#333;margin-top:10px;display:block;';
                    speedLbl.innerText = 'Speed (ms/frame):';
                    document.getElementById('panel').appendChild(speedLbl);
                    if (spWrap) spWrap.remove();
                    spWrap = document.createElement('div');
                    spWrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:8px;';
                    var spMin = document.createElement('span'); spMin.innerText = 'Fast'; spMin.style.cssText = 'font-size:11px;color:#888;';
                    var spMax = document.createElement('span'); spMax.innerText = 'Slow'; spMax.style.cssText = 'font-size:11px;color:#888;';
                    speedSlider.style.cssText = 'flex:1;';
                    spWrap.appendChild(spMin); spWrap.appendChild(speedSlider); spWrap.appendChild(spMax);
                    document.getElementById('panel').appendChild(spWrap);
                } else {
                    document.getElementById('status').innerText = '❌ ' + (data.message || 'Error');
                    btn.disabled = false;
                    btn.innerText = 'Create Timelapse';
                }
            }).catch(function(err) {
                document.getElementById('status').innerText = '❌ Error: ' + err;
                btn.disabled = false;
                btn.innerText = 'Create Timelapse';
            });
        }
    </script>
</body>
</html>"""

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/download':
                gif_path = roi_result.get('gif_path', '')
                if gif_path and os.path.exists(gif_path):
                    self.send_response(200)
                    self.send_header('Content-type', 'application/octet-stream')
                    self.send_header('Content-Disposition', f'attachment; filename="{os.path.basename(gif_path)}"')
                    self.end_headers()
                    with open(gif_path, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.send_response(404)
                    self.end_headers()
            elif self.path == '/frame-count':
                frame_count = roi_result.get('frame_count', 0)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(json.dumps({'count': frame_count}).encode())
            elif self.path.startswith('/frame/'):
                try:
                    idx = int(self.path.split('/frame/')[1].split('?')[0])
                    frames_dir = roi_result.get('frames_dir', '')
                    frame_path = os.path.join(frames_dir, f'frame_{idx:04d}.png')
                    if os.path.exists(frame_path):
                        self.send_response(200)
                        self.send_header('Content-type', 'image/png')
                        self.send_header('Cache-Control', 'max-age=3600')
                        self.end_headers()
                        with open(frame_path, 'rb') as f:
                            self.wfile.write(f.read())
                    else:
                        self.send_response(404)
                        self.end_headers()
                except:
                    self.send_response(400)
                    self.end_headers()
            elif self.path.startswith('/gif'):
                gif_path = roi_result.get('gif_path', '')
                if gif_path and os.path.exists(gif_path):
                    self.send_response(200)
                    self.send_header('Content-type', 'image/gif')
                    self.send_header('Cache-Control', 'no-cache')
                    self.end_headers()
                    with open(gif_path, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.send_response(404)
                    self.end_headers()
            else:
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(MAP_HTML.encode())
        
        def do_POST(self):
            if self.path == '/reset':
                roi_result['event'].clear()
                roi_result['geometry'] = None
                roi_result.pop('bounds', None)
                roi_result.pop('gif_path', None)
                roi_result.pop('stop', None)
                roi_result.pop('done', None)
                roi_result.pop('frames_dir', None)
                roi_result.pop('frame_count', None)
                roi_result.pop('message', None)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'reset'}).encode())
            elif self.path == '/stop':
                roi_result['stop'] = True
                if 'done' in roi_result:
                    roi_result['done'].set()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'stopped'}).encode())
            elif self.path == '/create':
                length = int(self.headers['Content-Length'])
                data = json.loads(self.rfile.read(length).decode())
                roi_result['geometry'] = data['geometry']
                roi_result['bands'] = data.get('bands', config['bands'])
                roi_result['dimensions'] = data.get('dimensions', config['dimensions'])
                roi_result['event'].set()
                
                # Wait for timelapse to finish before responding
                roi_result['done'] = threading.Event()
                roi_result['done'].wait(timeout=600)
                
                msg = roi_result.get('message', 'Timelapse created!')
                bounds = roi_result.get('bounds', None)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'message': msg, 'bounds': bounds}).encode())
            else:
                self.send_response(404)
                self.end_headers()
        
        def log_message(self, format, *args):
            pass
    
    server = HTTPServer(('localhost', port), Handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    
    url = f'http://localhost:{port}'
    print(f"\n🗺️  Opening interactive map at {url}")
    print("   Draw a rectangle or polygon on the map, then click 'Create Timelapse'.")
    print("   Waiting for your selection...\n")
    webbrowser.open(url)
    
    # Main loop: supports multiple timelapse runs
    while True:
        roi_result['event'].wait()
        
        if roi_result.get('stop'):
            break
        
        geojson = roi_result['geometry']
        if geojson is None:
            continue
        
        # Convert GeoJSON to ee.Geometry
        coords = geojson['coordinates']
        if geojson['type'] == 'Polygon':
            roi = ee.Geometry.Polygon(coords)
        else:
            roi = ee.Geometry(geojson)
        
        # Apply the user's selections
        selected_bands = roi_result.get('bands', config['bands'])
        selected_dims = roi_result.get('dimensions', config['dimensions'])
        config['bands'] = selected_bands
        config['dimensions'] = selected_dims
        print(f"✅ Area selected! Bands: {selected_bands}, Resolution: {selected_dims}px")
        print(f"   Creating timelapse...")
        
        # Compute bounding box from geometry for the overlay
        coords_list = geojson['coordinates'][0]
        lats = [c[1] for c in coords_list]
        lngs = [c[0] for c in coords_list]
        roi_result['bounds'] = {
            'south': min(lats), 'north': max(lats),
            'west': min(lngs), 'east': max(lngs)
        }
        
        # Create the timelapse
        output_file = os.path.join(config['output_folder'], config['gif_filename'])
        roi_result['gif_path'] = os.path.abspath(output_file)
        try:
            create_timelapse(roi, output_file)
            # Extract individual frames for the player
            frames_dir = os.path.join(config['output_folder'], 'frames')
            os.makedirs(frames_dir, exist_ok=True)
            gif_img = Image.open(output_file)
            frame_count = 0
            try:
                while True:
                    gif_img.seek(frame_count)
                    frame = gif_img.convert('RGBA')
                    frame.save(os.path.join(frames_dir, f'frame_{frame_count:04d}.png'))
                    frame_count += 1
            except EOFError:
                pass
            roi_result['frames_dir'] = os.path.abspath(frames_dir)
            roi_result['frame_count'] = frame_count
            roi_result['message'] = f'Timelapse saved to {output_file}'
            print(f"   Extracted {frame_count} frames for playback control")
        except Exception as e:
            roi_result['message'] = f'Error: {e}'
            roi_result['bounds'] = None
        
        roi_result['done'].set()
        
        print("\n🗺️  Timelapse displayed on the map. Draw a new area or press Ctrl+C to exit.")
        
        # Reset event for next run
        roi_result['event'].clear()
        roi_result['geometry'] = None
    
    server.shutdown()
    return roi

# ============================================
# EXAMPLE USAGE
# ============================================

def example_spain():
    """Example: Create timelapse for a region in Spain"""
    
    # Example ROI: Barcelona area
    roi = define_roi_coordinates(
        west=0.3,
        south=40.4,
        east=0.9,
        north=40.9,
    )
    
    # Add ROI to map
    Map.addLayer(roi, {'color': 'red'}, 'ROI')
    Map.centerObject(roi, 10)
    
    # Create timelapse
    output_file = os.path.join(config['output_folder'], 'barcelona_timelapse.gif')
    create_timelapse(roi, output_file)

def example_custom_coordinates(west, south, east, north, name="custom"):
    """
    Create timelapse for custom coordinates
    
    Args:
        west, south, east, north: Bounding box coordinates
        name: Name for the output file
    """
    roi = define_roi_coordinates(west, south, east, north)
    
    # Add ROI to map
    Map.addLayer(roi, {'color': 'red'}, 'ROI')
    Map.centerObject(roi, 10)
    
    # Create timelapse
    output_file = os.path.join(config['output_folder'], f'{name}_timelapse.gif')
    create_timelapse(roi, output_file)

def example_corner_coordinates(top_left, bottom_right, name="custom"):
    """
    Create timelapse using top-left and bottom-right corner coordinates.
    
    Args:
        top_left: (lat, lon) tuple of the top-left corner
        bottom_right: (lat, lon) tuple of the bottom-right corner
        name: Name for the output file
    """
    roi = define_roi_corners(top_left, bottom_right)
    
    # Add ROI to map
    Map.addLayer(roi, {'color': 'red'}, 'ROI')
    Map.centerObject(roi, 10)
    
    # Create timelapse
    output_file = os.path.join(config['output_folder'], f'{name}_timelapse.gif')
    create_timelapse(roi, output_file)

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    
    print("\n" + "="*60)
    print("🎬 LANDSAT TIMELAPSE CREATOR")
    print("="*60)
    
    # Interactive mode: opens a map in your browser to draw the area
    select_area_interactive()
