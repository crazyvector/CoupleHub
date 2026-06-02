#!/bin/bash
echo "Downloading Lofi..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/lofi.%(ext)s' jfKfPfyJRdk

echo "Downloading Jazz..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/jazz.%(ext)s' kgx4WGK0oNU

echo "Downloading Star Wars..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/starwars.%(ext)s' 7_gPUOCMUJc

echo "Downloading Dark Aesthetic..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/dark.%(ext)s' Yvfve9OHF0w

echo "Downloading Classical..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/classical.%(ext)s' VThrx5MRJXA

echo "Downloading Rain..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/rain.%(ext)s' jX6kn9_U8qk

echo "Downloading Anime..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/anime.%(ext)s' mWghae5EK7Q

echo "Downloading Coffee..."
yt-dlp -f 'ba' --download-sections "*00:00:00-00:05:00" -x --audio-format mp3 -o 'public/audio/coffee.%(ext)s' c18WZZa4KIA

echo "All downloads complete."
