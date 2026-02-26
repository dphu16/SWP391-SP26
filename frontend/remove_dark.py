import os
import re

directory = r"d:\PRJ301_QuanTM\Intel\SWP391-SP26\frontend\src\components\recruitment"

for filename in os.listdir(directory):
    if not filename.endswith(".tsx"):
        continue
        
    filepath = os.path.join(directory, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove all dark mode classes
    new_content = re.sub(r'\s*dark:[a-zA-Z0-9\-\/\[\]\:]+', '', content)
    
    # Also change inputs background to bg-white
    new_content = new_content.replace('bg-surface-light', 'bg-white')
    new_content = new_content.replace('bg-gray-50/50', 'bg-white')
    
    # Ensure double spaces inside classNames are collapsed
    new_content = re.sub(r' +', ' ', new_content)
    new_content = new_content.replace('\" ', '\"').replace(' \"', '\"')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

print("Dark mode classes removed and bg changed.")
