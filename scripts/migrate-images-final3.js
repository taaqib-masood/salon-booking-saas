import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { supabase } from '../lib/supabase.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FINAL = [
  // Using photo IDs known to be stable on Unsplash
  { slug: 'spa-mani-pedi-combo', url: 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5c?w=800&q=80&fit=crop' },
  { slug: '24k-gold-manicure',   url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fit=crop' },
  { slug: 'royal-caviar-facial', url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80&fit=crop' },
];

async function upload(slug, imageUrl) {
  const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 });
  const buf = Buffer.from(res.data);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { public_id: `salon-services/${slug}`, overwrite: true,
        transformation: [{ width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] },
      (err, r) => err ? reject(err) : resolve(r)
    ).end(buf);
  });
}

async function run() {
  for (const { slug, url } of FINAL) {
    try {
      const r = await upload(slug, url);
      console.log(`✅ ${slug} → ${r.secure_url}`);
      await supabase.from('services').update({ image_slug: slug })
        .ilike('name_en', `%${slug.replace(/-/g,' ')}%`);
    } catch (e) {
      console.error(`❌ ${slug}: ${e.message}`);
    }
  }
  console.log('\nAll done.');
  process.exit(0);
}

run();
