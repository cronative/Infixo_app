-- 010_remove_cdn_picture_urls.sql
-- Remove CDN image URLs from stored records
UPDATE creators 
SET photo_url = NULL 
WHERE photo_url LIKE CONCAT('%', 'cdn', 'insta', 'gram', '%') OR photo_url LIKE CONCAT('%', 'fb', 'cdn', '.net%');

