from duckduckgo_search import DDGS
import urllib.request

try:
    results = DDGS().images('lycee technique mohamed 5 beni mellal', max_results=3)
    if not results:
        print("No images found.")
        exit(1)
        
    img_url = results[0]['image']
    print(f"Found image URL: {img_url}")
    
    req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        with open('src/assets/campus_banner.png', 'wb') as out_file:
            out_file.write(response.read())
            
    print("Image downloaded successfully!")
except Exception as e:
    print(f"Error: {e}")
