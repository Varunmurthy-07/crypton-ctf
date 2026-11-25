def extract_hidden_text(image_path):
    try:
        with open(image_path, 'rb') as f:
            content = f.read()
        
        marker_start = b'--- HIDDEN MESSAGE START ---'
        marker_end = b'--- HIDDEN MESSAGE END ---'
        
        start_idx = content.find(marker_start)
        end_idx = content.find(marker_end)
        
        if start_idx != -1 and end_idx != -1:
            hidden_text = content[start_idx + len(marker_start):end_idx].decode('utf-8')
            print("\n" + "="*80)
            print("SUCCESS! Found hidden phrases:")
            print("="*80)
            print(hidden_text.strip())
            print("="*80)
        else:
            print("No hidden message found in this image!")
            
    except FileNotFoundError:
        print(f"Error: Could not find file '{image_path}'")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    image_file = "abhyuday_with_text.png"
    print(f"Extracting hidden phrases from {image_file}...")
    extract_hidden_text(image_file)
