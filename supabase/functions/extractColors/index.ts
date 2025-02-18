import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

async function extractColorsFromImageURL(imageUrl: string, numColors: number = 10): Promise<string[]> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch the image");
  }

  const imageData = await response.arrayBuffer();
  const image = await Image.decode(new Uint8Array(imageData));

  // Resize the image to a moderately smaller size for better accuracy
  const resizedImage = image.resize(50, Image.RESIZE_AUTO);

  const colorCounts: { [key: string]: number } = {};

  // Sampling more pixels to maintain accuracy
  for (let y = 1; y < resizedImage.height; y += 5) {
    for (let x = 1; x < resizedImage.width; x += 5) {
      const rgba = resizedImage.getRGBAAt(x, y);
      const color = `rgb(${rgba[0]},${rgba[1]},${rgba[2]})`;
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  console.log(colorCounts);

  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors)
    .map(([color]) => color);

  console.log(sortedColors);

  return sortedColors;
}

Deno.serve(async (req) => {
  try {
    const { image_url: imageUrl } = await req.json();
    if (!imageUrl) {
      throw new Error("Image URL not provided.");
    }

    const colors = await extractColorsFromImageURL(imageUrl);

    return new Response(
      JSON.stringify({ colors }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 },
    );
  }
});