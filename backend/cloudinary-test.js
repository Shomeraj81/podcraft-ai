require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const audioResult = await cloudinary.uploader.upload("episode.mp3", {
    resource_type: "video", // Cloudinary treats audio as "video" type
    folder: "autopod/audio",
  });
  console.log("Audio URL:", audioResult.secure_url);

  const imageResult = await cloudinary.uploader.upload("thumbnail.png", {
    folder: "autopod/thumbnails",
  });
  console.log("Thumbnail URL:", imageResult.secure_url);
}

main();
