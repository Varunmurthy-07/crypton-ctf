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

# Read the original image
with open('1st.png', 'rb') as f:
    img_data = f.read()

# Append the text to the image data
with open('abhyuday_with_text.png', 'wb') as f:
    f.write(img_data)
    f.write(b'\n\n--- HIDDEN MESSAGE START ---\n')
    f.write(movie_phrases.encode('utf-8'))
    f.write(b'\n--- HIDDEN MESSAGE END ---\n')

print("Text appended to image successfully!")
print("Saved as: abhyuday_with_text.png")
print("\nOpen this file in any text editor to see the hidden phrases!")
