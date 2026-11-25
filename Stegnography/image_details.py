from PIL import Image
import os

def get_image_details(image_path):
    img = Image.open(image_path)
    details = {
        'Filename': os.path.basename(image_path),
        'Format': img.format,
        'Mode': img.mode,
        'Size': f"{img.width} x {img.height}",
        'Width': img.width,
        'Height': img.height,
        'Palette': img.palette is not None,
        'Info': img.info
    }
    img.close()
    return details

def extract_hidden_text(image_path):
    with open(image_path, 'rb') as f:
        content = f.read()
    
    marker_start = b'--- HIDDEN MESSAGE START ---'
    marker_end = b'--- HIDDEN MESSAGE END ---'
    
    start_idx = content.find(marker_start)
    end_idx = content.find(marker_end)
    
    if start_idx != -1 and end_idx != -1:
        hidden_text = content[start_idx + len(marker_start):end_idx].decode('utf-8')
        return hidden_text.strip()
    return "No hidden message found in this image."

# Generate the report
image_file = 'abhyuday_with_text.png'

details = get_image_details(image_file)
hidden_text = extract_hidden_text(image_file)

# Create the report content
report = f"""
================================================================================
                          ABHYUDAY IMAGE DETAILS REPORT
================================================================================

IMAGE METADATA
==============
Filename:          {details['Filename']}
Format:            {details['Format']}
Color Mode:        {details['Mode']}
Dimensions:        {details['Size']}
Width:             {details['Width']} pixels
Height:            {details['Height']} pixels
Has Palette:       {'Yes' if details['Palette'] else 'No'}
Additional Info:   {details['Info']}


EMBEDDED HIDDEN PHRASES
========================
{hidden_text}

================================================================================
                              END OF REPORT
================================================================================
"""

# Write the report
with open('abhyuday_image_details.txt', 'w', encoding='utf-8') as f:
    f.write(report)

print("Report generated successfully!")
print("Filename: abhyuday_image_details.txt")
print("\n" + report)
