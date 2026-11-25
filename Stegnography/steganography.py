from PIL import Image

def encode_text_in_image(image_path, text, output_path):
    img = Image.open(image_path)
    width, height = img.size
    pixels = list(img.getdata())
    
    # Convert text to binary
    binary_text = ''.join(format(ord(c), '08b') for c in text)
    binary_text += '1111111111111110'  # End marker
    
    new_pixels = []
    index = 0
    
    for pixel in pixels:
        if index < len(binary_text):
            r = pixel[0] & 0xFE | int(binary_text[index]) if len(pixel) > 0 else pixel[0]
            g = pixel[1] & 0xFE | int(binary_text[index+1]) if index+1 < len(binary_text) and len(pixel) > 1 else pixel[1]
            b = pixel[2] & 0xFE | int(binary_text[index+2]) if index+2 < len(binary_text) and len(pixel) > 2 else pixel[2]
            new_pixel = (r, g, b) + (pixel[3],) if len(pixel) > 3 else (r, g, b)
            new_pixels.append(new_pixel)
            index += 3
        else:
            new_pixels.append(pixel)
    
    img.putdata(new_pixels)
    img.save(output_path, format='PNG')
    print(f"Encoded image saved as {output_path}")

def decode_text_from_image(image_path):
    img = Image.open(image_path)
    pixels = list(img.getdata())
    
    binary_text = ''
    for pixel in pixels:
        binary_text += str(pixel[0] & 1)
        if len(pixel) > 1:
            binary_text += str(pixel[1] & 1)
        if len(pixel) > 2:
            binary_text += str(pixel[2] & 1)
    
    text = ''
    for i in range(0, len(binary_text), 8):
        byte = binary_text[i:i+8]
        if byte == '11111110':  # Stop at end marker
            break
        if len(byte) == 8:
            text += chr(int(byte, 2))
    
    return text

# Our movie phrases to encode
movie_phrases = """
ABHYUDAY - Iconic Movie Phrases
================================

1. "May the Force be with you." - Star Wars
2. "I'll be back." - The Terminator
3. "Why so serious?" - The Dark Knight
4. "I'm the king of the world!" - Titanic
5. "Say hello to my little friend!" - Scarface
6. "You can't handle the truth!" - A Few Good Men
7. "Houston, we have a problem." - Apollo 13
8. "Life is like a box of chocolates." - Forrest Gump
9. "My precious." - The Lord of the Rings
10. "To infinity and beyond!" - Toy Story
"""

# Encode the phrases into the image
encode_text_in_image('1st.png', movie_phrases, 'abhyuday_steganography.png')

# Verify the decoding
decoded = decode_text_from_image('abhyuday_steganography.png')
print("\nDecoded text preview:")
print(decoded[:200])
