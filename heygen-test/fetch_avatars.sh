#!/bin/bash

API_KEY="57b90cac-0e2c-470c-b3dd-c650cba23cae"
OUTPUT_FILE="avatars.json"
TEMP_FILE="all_avatars_temp.json"

echo "[]" > "$TEMP_FILE"

# Fetch all pages
page=1
while true; do
  echo "Fetching page $page..."
  response=$(curl -s "https://api.liveavatar.com/v1/avatars/public?page=$page&page_size=20" \
    -H "x-api-key: $API_KEY")
  
  # Extract results and append to temp file
  results=$(echo "$response" | jq '.data.results')
  
  # Check if results is empty or null
  if [ "$results" = "null" ] || [ "$results" = "[]" ]; then
    break
  fi
  
  # Merge results
  jq -s '.[0] + .[1]' "$TEMP_FILE" <(echo "$results") > "${TEMP_FILE}.new"
  mv "${TEMP_FILE}.new" "$TEMP_FILE"
  
  # Check if there's a next page
  next=$(echo "$response" | jq -r '.data.next')
  if [ "$next" = "null" ]; then
    break
  fi
  
  page=$((page + 1))
done

# Convert array to name-keyed object
jq 'map({(.name): {id, voice_id: .default_voice.id, voice_name: .default_voice.name, preview_url}}) | add' "$TEMP_FILE" > "$OUTPUT_FILE"

# Cleanup
rm "$TEMP_FILE"

echo "Saved $(jq 'keys | length' "$OUTPUT_FILE") avatars to $OUTPUT_FILE"
