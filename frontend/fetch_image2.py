import urllib.request
import re
import urllib.parse

def fetch_image():
    query = urllib.parse.quote("lycee technique mohamed v beni mellal")
    url = f"https://html.duckduckgo.com/html/?q={query}+image"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Look for image links
            images = re.findall(r'img src="([^"]+)"', html)
            for img in images:
                if img.startswith('//'):
                    img = 'https:' + img
                print(f"Found img: {img}")
    except Exception as e:
        print(f"Error: {e}")

fetch_image()
