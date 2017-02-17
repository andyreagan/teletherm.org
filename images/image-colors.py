from PIL import Image
im = Image.open('dark-sky-colormap.png', 'r')
width, height = im.size
pixel_values = list(im.getdata())
print(pixel_values)

print("\", \"rgba".join(map(str,pixel_values)))
