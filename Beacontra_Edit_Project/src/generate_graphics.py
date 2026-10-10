#!/usr/bin/env python3
"""
Generate graphic assets, overlays, browser frames, and title cards for
Beacontra Master Film using PIL.
Color palette:
- Background: #080C12 (deep ink)
- Surface/Card: #0F1622 (slate ink)
- Border: #1F2D3D (hairline slate)
- Accent Signal Lime: #C9E6A6 / #A7E38C
- Accent Mint/Teal: #10B981 / #14B8A6 / #06B6D4
- Warning Amber: #F59E0B
- Danger Crimson: #EF4444
- Text Primary: #F8FAFC
- Text Secondary: #94A3B8
- Text Tech/Muted: #64748B
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

ASSETS_DIR = "Beacontra_Edit_Project/assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

# System fonts
FONT_SANS_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"

def get_font(size, bold=False):
    font_path = FONT_SANS_BOLD if bold else FONT_SANS
    try:
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.load_default()

def draw_beacon_reticle(draw, cx, cy, radius=40, color="#C9E6A6", tick_color="#8FBF9A"):
    """Draws the official Beacontra radar beacon reticle logo mark."""
    # Outer ring
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=color, width=3)
    # Center core dot
    core_r = int(radius * 0.32)
    draw.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=color)
    # 4 radar crosshair ticks
    tick_len = int(radius * 0.38)
    # Top tick
    draw.line([cx, cy - radius - tick_len, cx, cy - radius], fill=tick_color, width=3)
    # Bottom tick
    draw.line([cx, cy + radius, cx, cy + radius + tick_len], fill=tick_color, width=3)
    # Left tick
    draw.line([cx - radius - tick_len, cy, cx - radius, cy], fill=tick_color, width=3)
    # Right tick
    draw.line([cx + radius, cy, cx + radius + tick_len, cy], fill=tick_color, width=3)

def create_browser_frame():
    """1920x1080 canvas with rounded floating browser window frame."""
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer canvas background is dark charcoal with subtle radial gradient
    # We will generate background separately so we can layer video underneath frame
    
    # Window geometry: 1760 x 1000, centered at (80, 40)
    wx, wy, ww, wh = 80, 40, 1760, 1000
    tb_h = 42 # Titlebar height
    
    # Draw dark titlebar
    draw.rounded_rectangle([wx, wy, wx + ww, wy + tb_h + 12], radius=12, fill=(15, 22, 34, 255))
    # Window outline border
    draw.rounded_rectangle([wx, wy, wx + ww, wy + wh], radius=12, outline=(36, 52, 71, 255), width=2)
    
    # Window traffic lights
    dot_y = wy + tb_h // 2
    draw.ellipse([wx + 20, dot_y - 6, wx + 32, dot_y + 6], fill=(239, 68, 68, 255))
    draw.ellipse([wx + 42, dot_y - 6, wx + 54, dot_y + 6], fill=(245, 158, 11, 255))
    draw.ellipse([wx + 64, dot_y - 6, wx + 76, dot_y + 6], fill=(16, 185, 129, 255))
    
    # Address bar pill in titlebar
    pill_w = 480
    pill_x = wx + (ww - pill_w) // 2
    draw.rounded_rectangle([pill_x, wy + 8, pill_x + pill_w, wy + tb_h - 8], radius=6, fill=(24, 34, 50, 255), outline=(42, 60, 82, 255), width=1)
    
    # Lock icon / text in pill
    font_sm = get_font(13, bold=False)
    font_bold = get_font(13, bold=True)
    draw.text((pill_x + 16, wy + 12), "🔒 localhost:8787", fill=(148, 163, 184, 255), font=font_sm)
    draw.text((pill_x + 280, wy + 12), "BEACONTRA OS v2.0", fill=(201, 230, 166, 255), font=font_bold)
    
    img.save(os.path.join(ASSETS_DIR, "browser_frame_overlay.png"))
    print("Generated browser_frame_overlay.png")

def create_background_plate():
    """Generates the 1920x1080 cinematic dark gradient background."""
    img = Image.new("RGB", (1920, 1080), (8, 12, 18))
    draw = ImageDraw.Draw(img)
    
    # Soft radial glow in center
    cx, cy = 960, 540
    for r in range(700, 0, -20):
        alpha = int((1.0 - r / 700.0) * 28)
        color = (8 + alpha // 2, 14 + alpha, 22 + alpha)
        draw.ellipse([cx - r, cy - int(r * 0.7), cx + r, cy + int(r * 0.7)], outline=color, width=20)
    
    # Apply a subtle box blur to smooth radial steps
    img = img.filter(ImageFilter.GaussianBlur(radius=15))
    img.save(os.path.join(ASSETS_DIR, "cinematic_bg.png"))
    print("Generated cinematic_bg.png")

def create_scene01_hook_cards():
    """Scene 01 typography frames."""
    # Frame A: "Your brand is everywhere."
    img_a = Image.open(os.path.join(ASSETS_DIR, "cinematic_bg.png")).convert("RGBA")
    draw_a = ImageDraw.Draw(img_a)
    draw_beacon_reticle(draw_a, 960, 420, radius=56, color="#C9E6A6", tick_color="#8FBF9A")
    font_hero = get_font(56, bold=True)
    font_sub = get_font(20, bold=False)
    
    text_a = "Your brand is everywhere."
    bbox = draw_a.textbbox((0, 0), text_a, font=font_hero)
    tx = (1920 - (bbox[2] - bbox[0])) // 2
    draw_a.text((tx, 550), text_a, fill=(248, 250, 252, 255), font=font_hero)
    
    sub_a = "INDIAN D2C & MARKETPLACE BRAND OBSERVATION"
    bbox_sub = draw_a.textbbox((0, 0), sub_a, font=font_sub)
    tsx = (1920 - (bbox_sub[2] - bbox_sub[0])) // 2
    draw_a.text((tsx, 640), sub_a, fill=(100, 116, 139, 255), font=font_sub)
    img_a.save(os.path.join(ASSETS_DIR, "scene01_hook_a.png"))
    
    # Frame B: "But can you verify what you're seeing?"
    img_b = Image.open(os.path.join(ASSETS_DIR, "cinematic_bg.png")).convert("RGBA")
    draw_b = ImageDraw.Draw(img_b)
    draw_beacon_reticle(draw_b, 960, 420, radius=56, color="#06B6D4", tick_color="#10B981")
    text_b = "But can you verify what you're seeing?"
    bbox = draw_b.textbbox((0, 0), text_b, font=font_hero)
    tx = (1920 - (bbox[2] - bbox[0])) // 2
    draw_b.text((tx, 550), text_b, fill=(248, 250, 252, 255), font=font_hero)
    
    sub_b = "AMAZON · FLIPKART · GOOGLE SHOPPING · MYNTRA"
    bbox_sub = draw_b.textbbox((0, 0), sub_b, font=font_sub)
    tsx = (1920 - (bbox_sub[2] - bbox_sub[0])) // 2
    draw_b.text((tsx, 640), sub_b, fill=(148, 163, 184, 255), font=font_sub)
    img_b.save(os.path.join(ASSETS_DIR, "scene01_hook_b.png"))
    print("Generated scene01 cards.")

def create_scene02_problem_overlay():
    """Scene 02: Tasteful callout overlays for the marketplace listing."""
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Header tag
    draw.rounded_rectangle([80, 50, 360, 92], radius=6, fill=(15, 22, 34, 230), outline=(239, 68, 68, 200), width=2)
    font_tag = get_font(15, bold=True)
    draw.text((100, 62), "⚠️ UNVERIFIED MARKETPLACE LISTING", fill=(239, 68, 68, 255), font=font_tag)
    
    # Callout Box 1: Offer Price (Top right)
    draw.rounded_rectangle([1380, 180, 1840, 290], radius=8, fill=(15, 22, 34, 235), outline=(239, 68, 68, 220), width=2)
    draw.text((1405, 200), "SIGNAL 01: PRICE DEVIATION", fill=(239, 68, 68, 255), font=get_font(13, bold=True))
    draw.text((1405, 225), "₹1,399 vs ₹7,990 Statutory MRP", fill=(248, 250, 252, 255), font=get_font(18, bold=True))
    draw.text((1405, 258), "-81% Deviation · High Anomaly", fill=(148, 163, 184, 255), font=get_font(14, bold=False))
    
    # Callout Box 2: Merchant Authorization (Middle right)
    draw.rounded_rectangle([1380, 320, 1840, 430], radius=8, fill=(15, 22, 34, 235), outline=(245, 158, 11, 220), width=2)
    draw.text((1405, 340), "SIGNAL 02: MERCHANT STATUS", fill=(245, 158, 11, 255), font=get_font(13, bold=True))
    draw.text((1405, 365), "Seller: FABGIZMOZ", fill=(248, 250, 252, 255), font=get_font(18, bold=True))
    draw.text((1405, 398), "Not in Brand Authorized Whitelist", fill=(148, 163, 184, 255), font=get_font(14, bold=False))
    
    # Callout Box 3: Visual Verification (Bottom right)
    draw.rounded_rectangle([1380, 460, 1840, 570], radius=8, fill=(15, 22, 34, 235), outline=(6, 182, 212, 220), width=2)
    draw.text((1405, 480), "SIGNAL 03: VISUAL RECORD", fill=(6, 182, 212, 255), font=get_font(13, bold=True))
    draw.text((1405, 505), "Canonical Product Image Used", fill=(248, 250, 252, 255), font=get_font(18, bold=True))
    draw.text((1405, 538), "Reverse Image Match Pending", fill=(148, 163, 184, 255), font=get_font(14, bold=False))
    
    # Bottom Banner: Three Key Questions
    draw.rounded_rectangle([260, 940, 1660, 1020], radius=10, fill=(10, 15, 24, 240), outline=(36, 52, 71, 255), width=2)
    q_text = "Is this the right product?  ·  Is this price unusual?  ·  Where did this image appear?"
    font_q = get_font(21, bold=True)
    bbox_q = draw.textbbox((0, 0), q_text, font=font_q)
    qx = (1920 - (bbox_q[2] - bbox_q[0])) // 2
    draw.text((qx, 966), q_text, fill=(201, 230, 166, 255), font=font_q)
    
    img.save(os.path.join(ASSETS_DIR, "scene02_problem_overlay.png"))
    print("Generated scene02_problem_overlay.png")

def create_scene03_intro_card():
    """Scene 03: Beacontra Title Reveal."""
    img = Image.open(os.path.join(ASSETS_DIR, "cinematic_bg.png")).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Large glowing reticle in center
    draw_beacon_reticle(draw, 960, 360, radius=68, color="#C9E6A6", tick_color="#8FBF9A")
    
    # Wordmark
    font_title = get_font(64, bold=True)
    title = "BEACONTRA"
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tx = (1920 - (bbox[2] - bbox[0])) // 2
    draw.text((tx, 480), title, fill=(248, 250, 252, 255), font=font_title)
    
    # Tagline
    font_sub = get_font(28, bold=False)
    sub = "Marketplace intelligence. Built around evidence."
    bbox_s = draw.textbbox((0, 0), sub, font=font_sub)
    sx = (1920 - (bbox_s[2] - bbox_s[0])) // 2
    draw.text((sx, 570), sub, fill=(201, 230, 166, 255), font=font_sub)
    
    # Powered by SerpApi pill
    pill_w = 340
    pill_h = 44
    px = (1920 - pill_w) // 2
    py = 660
    draw.rounded_rectangle([px, py, px + pill_w, py + pill_h], radius=22, fill=(15, 23, 42, 230), outline=(56, 189, 248, 180), width=1)
    font_pill = get_font(16, bold=True)
    pill_txt = "⚡ POWERED BY SERPAPI"
    bbox_p = draw.textbbox((0, 0), pill_txt, font=font_pill)
    ptx = px + (pill_w - (bbox_p[2] - bbox_p[0])) // 2
    draw.text((ptx, py + 12), pill_txt, fill=(56, 189, 248, 255), font=font_pill)
    
    img.save(os.path.join(ASSETS_DIR, "scene03_intro_card.png"))
    print("Generated scene03_intro_card.png")

def create_scene_badges():
    """Generates upper badges for Scenes 04 through 08."""
    badges = [
        ("badge_scene04.png", "01 / ESTABLISH THE REFERENCE GROUND TRUTH", "#C9E6A6", "BRAND VAULT"),
        ("badge_scene05.png", "POWERED BY SERPAPI · GOOGLE SHOPPING", "#38BDF8", "LIVE MARKET SCAN"),
        ("badge_scene06.png", "02 / FOLLOW THE VISUAL EVIDENCE · GOOGLE LENS", "#34D399", "VISUAL FORENSICS"),
        ("badge_scene07.png", "NOT JUST A SCORE · THE REASONING BEHIND IT", "#F59E0B", "EXPLAIN THIS FINDING"),
        ("badge_scene08.png", "EVIDENCE YOU CAN ACTUALLY REVIEW", "#A78BFA", "STANDALONE DOSSIER")
    ]
    
    for filename, title, color_hex, cat in badges:
        img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Badge pill at top left (x=100, y=55)
        font_cat = get_font(12, bold=True)
        font_title = get_font(15, bold=True)
        
        bbox_t = draw.textbbox((0, 0), title, font=font_title)
        tw = bbox_t[2] - bbox_t[0]
        badge_w = max(tw + 60, 360)
        
        draw.rounded_rectangle([100, 52, 100 + badge_w, 98], radius=8, fill=(10, 15, 24, 235), outline=(36, 52, 71, 255), width=1)
        # Accent indicator bar on left
        draw.rounded_rectangle([100, 52, 106, 98], radius=3, fill=color_hex)
        
        draw.text((120, 60), cat, fill=color_hex, font=font_cat)
        draw.text((120, 76), title, fill=(248, 250, 252, 255), font=font_title)
        
        img.save(os.path.join(ASSETS_DIR, filename))
        print(f"Generated {filename}")

def create_scene09_outro_card():
    """Scene 09: Final Closing Card."""
    img = Image.open(os.path.join(ASSETS_DIR, "cinematic_bg.png")).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Center Reticle Logo
    draw_beacon_reticle(draw, 960, 320, radius=64, color="#C9E6A6", tick_color="#8FBF9A")
    
    # Punchy headline
    font_headline = get_font(44, bold=True)
    headline = "Every listing. A clearer signal."
    bbox_h = draw.textbbox((0, 0), headline, font=font_headline)
    hx = (1920 - (bbox_h[2] - bbox_h[0])) // 2
    draw.text((hx, 430), headline, fill=(248, 250, 252, 255), font=font_headline)
    
    # Wordmark
    font_brand = get_font(32, bold=True)
    brand = "BEACONTRA"
    bbox_b = draw.textbbox((0, 0), brand, font=font_brand)
    bx = (1920 - (bbox_b[2] - bbox_b[0])) // 2
    draw.text((bx, 510), brand, fill=(201, 230, 166, 255), font=font_brand)
    
    # Powered by SerpApi
    font_sub = get_font(20, bold=False)
    sub = "Built for SerpApi India Hackathon 2026"
    bbox_s = draw.textbbox((0, 0), sub, font=font_sub)
    sx = (1920 - (bbox_s[2] - bbox_s[0])) // 2
    draw.text((sx, 570), sub, fill=(148, 163, 184, 255), font=font_sub)
    
    # Repo link pill
    pill_w = 440
    pill_h = 48
    px = (1920 - pill_w) // 2
    py = 640
    draw.rounded_rectangle([px, py, px + pill_w, py + pill_h], radius=24, fill=(15, 23, 42, 240), outline=(56, 189, 248, 180), width=1)
    font_repo = get_font(17, bold=True)
    repo = "github.com/ThatKJ/Beacontra"
    bbox_r = draw.textbbox((0, 0), repo, font=font_repo)
    rx = px + (pill_w - (bbox_r[2] - bbox_r[0])) // 2
    draw.text((rx, py + 14), repo, fill=(56, 189, 248, 255), font=font_repo)
    
    img.save(os.path.join(ASSETS_DIR, "scene09_outro_card.png"))
    print("Generated scene09_outro_card.png")

if __name__ == "__main__":
    create_background_plate()
    create_browser_frame()
    create_scene01_hook_cards()
    create_scene02_problem_overlay()
    create_scene03_intro_card()
    create_scene_badges()
    create_scene09_outro_card()
    print("All graphic assets created successfully.")
