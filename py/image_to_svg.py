import requests
from PIL import Image
from potrace import Bitmap
import os

def convert_image_to_svg(image_source, output_file_path):
    """
    Converts a map image from a URL or local path to an SVG file.

    Args:
        image_source (str): The URL or local file path of the image.
        output_file_path (str): The path to save the output SVG file.
    """
    try:
        if image_source.startswith('http://') or image_source.startswith('https://'):
            # Handle image from a web link
            response = requests.get(image_source, stream=True)
            response.raise_for_status()
            image = Image.open(response.raw)
        else:
            # Handle image from a local file path
            if not os.path.exists(image_source):
                print(f"Error: The file '{image_source}' was not found.")
                return
            image = Image.open(image_source)

        # Convert the image to grayscale and then to a black and white bitmap.
        # The Potrace algorithm works with bitmaps.
        image = image.convert("L").point(lambda x: 255 if x > 128 else 0, "1")

        # Create a potrace.Bitmap object from the Pillow image
        bitmap = Bitmap(image)

        # Trace the bitmap to a path
        path = bitmap.trace()

        # Get the dimensions of the original image
        width, height = image.size

        # Create the SVG content
        svg_header = f'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
        svg_path = '<path d="'

        for curve in path:
            svg_path += f" M {curve.start_point.x},{curve.start_point.y}"
            for segment in curve:
                if segment.is_corner:
                    svg_path += f" L {segment.c.x},{segment.c.y} L {segment.end_point.x},{segment.end_point.y}"
                else:
                    svg_path += f" C {segment.c1.x},{segment.c1.y} {segment.c2.x},{segment.c2.y} {segment.end_point.x},{segment.end_point.y}"
        
        svg_path += '" fill="black" />'
        svg_footer = '</svg>'

        svg_content = svg_header + svg_path + svg_footer

        # Save the SVG content to the specified output file
        with open(output_file_path, "w") as f:
            f.write(svg_content)
        
        print(f"Successfully converted '{image_source}' to '{output_file_path}'")

    except requests.exceptions.RequestException as e:
        print(f"Error downloading the image: {e}")
    except IOError as e:
        print(f"Error processing the image: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == '__main__':
    print("Map Image to SVG Converter")
    print("=" * 30)
    
    # Get user input for the image source and output file path
    image_input = input("Enter the URL or local file path of the map image: ").strip()
    output_svg = input("Enter the desired output file name for the SVG (e.g., map.svg): ").strip()

    # Ensure the output file has a .svg extension
    if not output_svg.lower().endswith('.svg'):
        output_svg += '.svg'

    # Run the conversion function
    convert_image_to_svg(image_input, output_svg)