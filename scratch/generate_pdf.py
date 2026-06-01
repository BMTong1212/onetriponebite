import os
import re
import base64
import subprocess

# Define paths
WORKSPACE_DIR = "/Users/bmtong/Desktop/One Trip One Bite Landing Page"
PROJECT_DIR = os.path.join(WORKSPACE_DIR, "content-calendar-lp")
BRAIN_DIR = "/Users/bmtong/.gemini/antigravity-ide/brain/b8b76f8f-9066-4ed2-a4cb-6aff795b2a75"
MD_PATH = os.path.join(BRAIN_DIR, "kids_fishing_activity_guide.md")
LOGO_PATH = os.path.join(PROJECT_DIR, "assets/logo_transparent.png")
COVER_ILLUST_PATH = os.path.join(PROJECT_DIR, "assets/kids_fishing_cover_illustration.png")
OUTPUT_HTML_PATH = os.path.join(PROJECT_DIR, "scratch/kids_fishing_activity_guide.html")
OUTPUT_PDF_PATH = os.path.join(PROJECT_DIR, "assets/OTOB_Kids_Fishing_Activity_Guide.pdf")

# Ensure scratch directory exists
os.makedirs(os.path.dirname(OUTPUT_HTML_PATH), exist_ok=True)

def get_base64_image(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            data = f.read()
            encoded = base64.b64encode(data).decode('utf-8')
            ext = os.path.splitext(path)[1][1:]
            if ext == 'jpg': ext = 'jpeg'
            return f"data:image/{ext};base64,{encoded}"
    print(f"Warning: Image not found at {path}")
    return ""

logo_base64 = get_base64_image(LOGO_PATH)
cover_base64 = get_base64_image(COVER_ILLUST_PATH)

def format_md(text):
    if not text:
        return ""
    # Convert bold-italic ***text*** to <strong><em>text</em></strong>
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', text)
    # Convert bold **text** to <strong>text</strong>
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    # Convert italic *text* or _text_ to <em>text</em>
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    text = re.sub(r'_(.*?)_', r'<em>\1</em>', text)
    return text

print("Parsing markdown file...")
with open(MD_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

title = ""
subtitle = ""
intro_paragraphs = []
phases = []
current_phase = None
current_activity = None
bonus_section = False
bonus_title = ""
bonus_desc = ""
bonus_items = []

for line in lines:
    line = line.strip()
    if not line:
        continue
    
    # Check for title
    if line.startswith("# ") and not title:
        title = line[2:].strip()
        continue
    
    # Check for H2 sections
    if line.startswith("## "):
        h2_title = line[3:].strip()
        if "Introduction" in h2_title:
            continue
        elif "Phase" in h2_title:
            current_phase = {
                "title": h2_title,
                "focus": "",
                "activities": []
            }
            phases.append(current_phase)
            current_activity = None
            bonus_section = False
        elif "Bonus" in h2_title:
            bonus_section = True
            bonus_title = h2_title
            current_phase = None
            current_activity = None
        continue
        
    if line.startswith("---"):
        continue
        
    # Check for H3 activities
    if line.startswith("### "):
        h3_title = line[4:].strip()
        if not bonus_section:
            match = re.match(r"(\d+)\.\s*(.*)", h3_title)
            if match:
                num = match.group(1)
                act_name = match.group(2)
                current_activity = {
                    "num": num,
                    "title": act_name,
                    "situation": "",
                    "activity": "",
                    "learning_outcome": "",
                    "curriculum_link": ""
                }
                if current_phase:
                    current_phase["activities"].append(current_activity)
            continue

    # Parse metadata within an activity
    if current_activity:
        if "**Situation:**" in line:
            current_activity["situation"] = line.split("**Situation:**")[-1].strip()
        elif "**Activity:**" in line:
            current_activity["activity"] = line.split("**Activity:**")[-1].strip()
        elif "**Learning Outcome:**" in line:
            current_activity["learning_outcome"] = line.split("**Learning Outcome:**")[-1].strip()
        elif "**Curriculum Link:**" in line:
            current_activity["curriculum_link"] = line.split("**Curriculum Link:**")[-1].strip()
        continue

    # Parse Phase Focus description
    if current_phase and not current_activity and "Focus:" in line:
        current_phase["focus"] = line.replace("*Focus:", "").replace("Focus:", "").strip("*").strip()
        continue

    # Parse Bonus Section items
    if bonus_section:
        match_bonus = re.match(r"^(\d+)\.\s*\*\*(.*?):\*\*\s*(.*)", line)
        if match_bonus:
            num = match_bonus.group(1)
            bold_text = match_bonus.group(2)
            desc_text = match_bonus.group(3)
            bonus_items.append({
                "num": num,
                "bold": bold_text,
                "text": desc_text
            })
        else:
            if not bonus_desc:
                bonus_desc = line
            else:
                bonus_desc += " " + line
        continue

    # If it's introductory text
    if not current_phase and not bonus_section:
        if not subtitle:
            subtitle = line
        else:
            intro_paragraphs.append(line)

print(f"Parsed Title: {title}")
print(f"Parsed Subtitle: {subtitle}")
print(f"Parsed {len(phases)} phases.")
for p in phases:
    print(f"  - {p['title']} ({len(p['activities'])} activities)")
print(f"Parsed Bonus Section with {len(bonus_items)} items.")

# HTML Template Generation
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #F7F4EE;
      --text: #1F2933;
      --blue: #2E5B76;
      --blue-light: #e6eff5;
      --beige: #D8C3A5;
      --orange: #C77D4A;
      --orange-light: rgba(199, 125, 74, 0.08);
      --green: #7A8F7B;
      --green-light: rgba(122, 143, 123, 0.08);
      --white: #ffffff;
      --muted: #52606d;
      --border: rgba(46, 91, 118, 0.12);
      --font-serif: 'Playfair Display', Georgia, serif;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}

    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: var(--font-sans);
      color: var(--text);
      background-color: var(--bg);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      font-size: 15px;
    }}

    @page {{
      size: letter;
      margin-top: 1.2in;
      margin-bottom: 1.2in;
      margin-left: 0.8in;
      margin-right: 0.8in;
    }}

    /* Remove margins for the cover page, which also suppresses header/footer templates on the first page */
    @page :first {{
      margin-top: 0in;
      margin-bottom: 0in;
      margin-left: 0in;
      margin-right: 0in;
    }}

    /* ─── COVER PAGE ─── */
    .page-cover {{
      width: 100%;
      height: 100vh;
      background-color: var(--bg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 1.2in 0.8in;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      text-align: center;
    }}

    .cover-top {{
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }}

    .cover-logo {{
      width: 180px;
      height: auto;
      margin-bottom: 10px;
    }}

    .cover-badge {{
      background: var(--blue);
      color: var(--white);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 2px;
      padding: 6px 16px;
      border-radius: 50px;
      text-transform: uppercase;
      margin-bottom: 20px;
      display: inline-block;
    }}

    .cover-title {{
      font-family: var(--font-serif);
      font-size: 2.8rem;
      font-weight: 700;
      line-height: 1.15;
      color: var(--blue);
      margin-bottom: 10px;
    }}

    .cover-subtitle {{
      font-family: var(--font-sans);
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--orange);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 30px;
    }}

    .cover-illustration-container {{
      margin: 10px 0;
      border: 1px solid var(--border);
      padding: 12px;
      background: var(--white);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(31, 41, 51, 0.05);
      max-width: 380px;
    }}

    .cover-illustration {{
      width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
    }}

    .cover-bottom {{
      width: 100%;
      border-top: 1px solid var(--border);
      padding-top: 20px;
    }}

    .cover-slogan {{
      font-family: var(--font-serif);
      font-style: italic;
      font-size: 1.25rem;
      color: var(--orange);
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }}

    .cover-tagline {{
      font-size: 0.85rem;
      color: var(--muted);
      font-family: var(--font-sans);
    }}

    /* ─── CONTENT WRAPPER ─── */
    .content-container {{
      position: relative;
      z-index: 10;
    }}

    /* ─── INTRODUCTION ─── */
    .intro-section {{
      page-break-after: always;
      break-after: page;
      padding-top: 0.2in;
    }}

    .section-title {{
      font-family: var(--font-serif);
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--blue);
      margin-bottom: 25px;
      border-bottom: 2px solid var(--orange);
      padding-bottom: 8px;
    }}

    .intro-paragraph {{
      color: var(--text);
      font-size: 1.05rem;
      line-height: 1.8;
      margin-bottom: 20px;
      text-align: justify;
    }}

    .intro-callout {{
      background: var(--white);
      border-left: 4px solid var(--orange);
      padding: 22px;
      border-radius: 0 8px 8px 0;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(31, 41, 51, 0.02);
    }}

    .intro-callout p {{
      font-family: var(--font-serif);
      font-style: italic;
      font-size: 1.15rem;
      line-height: 1.7;
      color: var(--blue);
    }}

    /* ─── PHASE SECTION ─── */
    .phase-section {{
      page-break-before: always;
      break-before: page;
      padding-top: 0.1in;
    }}

    .phase-header {{
      margin-bottom: 30px;
    }}

    .phase-title {{
      font-family: var(--font-serif);
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--blue);
      margin-bottom: 8px;
    }}

    .phase-focus {{
      font-family: var(--font-sans);
      font-style: italic;
      color: var(--muted);
      font-size: 0.95rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 15px;
    }}

    /* ─── ACTIVITY CARDS ─── */
    .activity-card {{
      background: var(--white);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid var(--border);
      box-shadow: 0 4px 12px rgba(31, 41, 51, 0.02);
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    /* Visual accents matching age phases */
    .phase-1 .activity-card {{
      border-left: 4px solid var(--green);
    }}
    .phase-2 .activity-card {{
      border-left: 4px solid var(--blue);
    }}
    .phase-3 .activity-card {{
      border-left: 4px solid var(--orange);
    }}

    .card-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }}

    .card-title-group {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .card-number {{
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 1.2rem;
    }}
    .phase-1 .card-number {{ color: var(--green); }}
    .phase-2 .card-number {{ color: var(--blue); }}
    .phase-3 .card-number {{ color: var(--orange); }}

    .card-title {{
      font-family: var(--font-serif);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text);
    }}

    .phase-badge {{
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 4px;
    }}
    .phase-1 .phase-badge {{ background: var(--green-light); color: var(--green); }}
    .phase-2 .phase-badge {{ background: var(--blue-light); color: var(--blue); }}
    .phase-3 .phase-badge {{ background: var(--orange-light); color: var(--orange); }}

    .card-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 15px;
      font-size: 0.8rem;
    }}

    .meta-tag {{
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f1ebd9;
      color: var(--text);
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid rgba(46, 91, 118, 0.05);
    }}

    .meta-tag strong {{
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      font-size: 0.75rem;
    }}

    .card-activity {{
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text);
      margin-bottom: 12px;
    }}

    .card-outcome {{
      background: #faf9f6;
      border-left: 3px dashed var(--border);
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      font-size: 0.88rem;
      color: var(--muted);
    }}

    .card-outcome strong {{
      color: var(--text);
    }}

    /* ─── BONUS SECTION ─── */
    .bonus-section {{
      page-break-before: always;
      break-before: page;
      padding-top: 0.1in;
    }}

    .bonus-intro {{
      font-size: 1.05rem;
      line-height: 1.7;
      color: var(--muted);
      margin-bottom: 30px;
      font-style: italic;
    }}

    .bonus-list {{
      display: flex;
      flex-direction: column;
      gap: 18px;
    }}

    .bonus-item {{
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      display: flex;
      gap: 15px;
      align-items: flex-start;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    .bonus-num {{
      background: var(--orange-light);
      color: var(--orange);
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 1.2rem;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .bonus-content {{
      font-size: 0.95rem;
      line-height: 1.65;
    }}

    .bonus-content strong {{
      color: var(--blue);
      font-family: var(--font-serif);
      font-size: 1.05rem;
      display: block;
      margin-bottom: 4px;
    }}

  </style>
</head>
<body>

  <!-- ─── COVER PAGE ─── -->
  <div class="page-cover">
    <div class="cover-top">
      <img src="{logo_base64}" class="cover-logo" alt="One Trip One Bite Logo">
      <span class="cover-badge">Homeschool Field Study</span>
      <h1 class="cover-title">30 Ways to Keep<br>Kids Hooked</h1>
      <div class="cover-subtitle">Activity Guide for Family Fishing Days</div>
      
      <div class="cover-illustration-container">
        <img src="{cover_base64}" class="cover-illustration" alt="Cover Illustration">
      </div>
    </div>
    
    <div class="cover-bottom">
      <div class="cover-slogan">Cast. Taste. Explore. Repeat.</div>
      <div class="cover-tagline">A Premium Outdoor Education Resource by One Trip One Bite</div>
    </div>
  </div>

  <!-- ─── CONTENT CONTAINER ─── -->
  <div class="content-container">

    <!-- ─── INTRODUCTION ─── -->
    <section class="intro-section">
      <h2 class="section-title">🧭 Introduction for Homeschool Parents</h2>
      <p class="intro-paragraph">{format_md(intro_paragraphs[0]) if len(intro_paragraphs) > 0 else ""}</p>
      
      <div class="intro-callout">
        <p>"For a homeschooling family, the great outdoors is the ultimate classroom. But as every fishing parent knows, the fish don’t always respect our lesson plans..."</p>
      </div>

      <p class="intro-paragraph">{format_md(intro_paragraphs[1]) if len(intro_paragraphs) > 1 else ""}</p>
    </section>

    <!-- ─── PHASES ─── -->
"""

# Add Phases and Activities to HTML
for idx, phase in enumerate(phases):
    phase_class = f"phase-{idx+1}"
    phase_badge_text = f"Phase {idx+1}"
    
    html_content += f"""
    <section class="phase-section {phase_class}">
      <div class="phase-header">
        <h2 class="phase-title">{phase['title']}</h2>
        <div class="phase-focus"><strong>Focus:</strong> {phase['focus']}</div>
      </div>
      
      <div class="activities-container">
    """
    
    for act in phase['activities']:
        situation = format_md(act['situation'])
        activity_body = format_md(act['activity'])
        learning_outcome = format_md(act['learning_outcome'])
        curriculum_link = format_md(act['curriculum_link'])
        
        html_content += f"""
        <div class="activity-card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="card-number">#{int(act['num']):02d}</span>
              <h3 class="card-title">{act['title']}</h3>
            </div>
            <span class="phase-badge">{phase_badge_text}</span>
          </div>
          
          <div class="card-meta">
            <div class="meta-tag">
              <strong>Situation:</strong> {situation}
            </div>
            <div class="meta-tag">
              <strong>Curriculum:</strong> {curriculum_link}
            </div>
          </div>
          
          <div class="card-activity">
            <strong>Activity:</strong> {activity_body}
          </div>
          
          <div class="card-outcome">
            <strong>Learning Outcome:</strong> {learning_outcome}
          </div>
        </div>
        """
        
    html_content += """
      </div>
    </section>
    """

# Add Bonus Section
html_content += f"""
    <!-- ─── BONUS SECTION ─── -->
    <section class="bonus-section">
      <h2 class="section-title">{bonus_title}</h2>
      <div class="bonus-intro">{format_md(bonus_desc)}</div>
      
      <div class="bonus-list">
"""

for item in bonus_items:
    bold_text = format_md(item['bold'])
    desc_text = format_md(item['text'])
    html_content += f"""
        <div class="bonus-item">
          <div class="bonus-num">{item['num']}</div>
          <div class="bonus-content">
            <strong>{bold_text}</strong>
            {desc_text}
          </div>
        </div>
    """

html_content += """
      </div>
    </section>

  </div>
</body>
</html>
"""

# Write HTML content
print(f"Writing HTML output to {OUTPUT_HTML_PATH}...")
with open(OUTPUT_HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html_content)
print("HTML output complete.")

# Trigger PDF Generation via headless Chrome with custom headers/footers templates
print(f"Generating PDF using headless Chrome at {OUTPUT_PDF_PATH}...")
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

header_template = '<div style="font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 8px; color: #52606d; width: 100%; margin-left: 0.8in; margin-right: 0.8in; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(46, 91, 118, 0.12); padding-bottom: 5px; box-sizing: border-box;"><span style="font-weight: 700; color: #2E5B76;">One Trip One Bite</span><span>Kids Fishing Activity Guide</span></div>'

footer_template = '<div style="font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 8px; color: #52606d; width: 100%; margin-left: 0.8in; margin-right: 0.8in; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(46, 91, 118, 0.12); padding-top: 5px; box-sizing: border-box;"><span>Homeschool Field Study Edition</span><span style="font-family: Georgia, serif; font-style: italic; color: #C77D4A; font-weight: 600;">Cast. Taste. Explore.</span><div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div></div>'

try:
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        f"--print-to-pdf={OUTPUT_PDF_PATH}",
        "--display-header-footer",
        f"--header-template={header_template}",
        f"--footer-template={footer_template}",
        OUTPUT_HTML_PATH
    ]
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    print("PDF generated successfully!")
    print(result.stdout)
except Exception as e:
    print(f"Error compiling PDF: {e}")
    if hasattr(e, 'stderr'):
        print(e.stderr)
