/**
 * Retry script for the 10 failed slugs — uses verified working Unsplash URLs
 * Usage: node scripts/migrate-images-retry.js
 */
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { supabase } from '../lib/supabase.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const RETRY_IMAGES = [
  { slug: 'haircut-blowdry',     url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80&fit=crop' },
  { slug: 'full-balayage',       url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&fit=crop' },
  { slug: 'classic-pedicure',    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fit=crop' },
  { slug: 'spa-mani-pedi-combo', url: 'https://images.unsplash.com/photo-1604655852743-d3f5c1ed2c98?w=800&q=80&fit=crop' },
  { slug: '24k-gold-manicure',   url: 'https://images.unsplash.com/photo-1604655869273-b2c6f87ef31d?w=800&q=80&fit=crop' },
  { slug: 'nail-art',            url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fit=crop' },
  { slug: 'royal-caviar-facial', url: 'https://images.unsplash.com/photo-1616394158624-e3d4c4ad0847?w=800&q=80&fit=crop' },
  { slug: 'hydrafacial',         url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&fit=crop' },
  { slug: 'eyebrow-tinting',     url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80&fit=crop' },
  { slug: 'lash-lift-tint',      url: 'https://images.unsplash.com/photo-1523263685509-57c1d050d19b?w=800&q=80&fit=crop' },
];

async function uploadToCloudinary(slug, imageUrl) {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
  const buffer = Buffer.from(response.data);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id:      `salon-services/${slug}`,
        overwrite:      true,
        transformation: [{ width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(buffer);
  });
}

async function run() {
  console.log('Retrying 10 failed images...\n');
  let success = 0, failed = 0;

  for (const { slug, url } of RETRY_IMAGES) {
    try {
      const result = await uploadToCloudinary(slug, url);
      console.log(`✅ ${slug} → ${result.secure_url}`);

      await supabase
        .from('services')
        .update({ image_slug: slug })
        .ilike('name_en', `%${slug.replace(/-/g, ' ')}%`);

      success++;
    } catch (err) {
      console.error(`❌ ${slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} uploaded, ${failed} failed.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
