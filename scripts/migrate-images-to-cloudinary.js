/**
 * Usage: node scripts/migrate-images-to-cloudinary.js
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
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

const SERVICE_IMAGES = [
  { slug: 'haircut-blowdry',           url: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fb6b8?w=800&q=80&fit=crop' },
  { slug: 'signature-silk-blowout',    url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80&fit=crop' },
  { slug: 'deep-conditioning',         url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&fit=crop' },
  { slug: 'keratin-treatment',         url: 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800&q=80&fit=crop' },
  { slug: 'balayage-color-correction', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80&fit=crop' },
  { slug: 'full-balayage',             url: 'https://images.unsplash.com/photo-1605497787304-f7e2e8a42b51?w=800&q=80&fit=crop' },
  { slug: 'hair-coloring',             url: 'https://images.unsplash.com/photo-1520699049698-acd2fccb8cc8?w=800&q=80&fit=crop' },
  { slug: 'classic-pedicure',          url: 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5c?w=800&q=80&fit=crop' },
  { slug: 'spa-mani-pedi-combo',       url: 'https://images.unsplash.com/photo-1604655852743-d3f5c1ed2c98?w=800&q=80&fit=crop' },
  { slug: 'gel-manicure',              url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fit=crop' },
  { slug: '24k-gold-manicure',         url: 'https://images.unsplash.com/photo-1604655854198-ef2b2f1f3e8b?w=800&q=80&fit=crop' },
  { slug: 'nail-art',                  url: 'https://images.unsplash.com/photo-1604655869273-b2c6f87ef31d?w=800&q=80&fit=crop' },
  { slug: 'classic-facial',            url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&fit=crop' },
  { slug: 'royal-caviar-facial',       url: 'https://images.unsplash.com/photo-1573461160327-aab9dd33a122?w=800&q=80&fit=crop' },
  { slug: 'hydrafacial',               url: 'https://images.unsplash.com/photo-1616394158624-e3d4c4ad0847?w=800&q=80&fit=crop' },
  { slug: 'chemical-peel',             url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&fit=crop' },
  { slug: 'bridal-makeup',             url: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80&fit=crop' },
  { slug: 'party-makeup',              url: 'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=800&q=80&fit=crop' },
  { slug: 'airbrush-makeup',           url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80&fit=crop' },
  { slug: 'eyebrow-threading',         url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80&fit=crop' },
  { slug: 'eyebrow-tinting',           url: 'https://images.unsplash.com/photo-1623870234838-2b03e2a45ccd?w=800&q=80&fit=crop' },
  { slug: 'lash-lift-tint',            url: 'https://images.unsplash.com/photo-1597225244516-7b8a16e8c09b?w=800&q=80&fit=crop' },
  { slug: 'swedish-massage',           url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80&fit=crop' },
  { slug: 'hot-stone-massage',         url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80&fit=crop' },
  { slug: 'aromatherapy',              url: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&q=80&fit=crop' },
];

async function uploadToCloudinary(slug, imageUrl) {
  // Download image buffer
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id:    `salon-services/${slug}`,
        folder:       'salon-services',
        overwrite:    true,
        transformation: [{ width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function run() {
  console.log('Starting Cloudinary migration...\n');
  let success = 0, failed = 0;

  for (const { slug, url } of SERVICE_IMAGES) {
    try {
      const result = await uploadToCloudinary(slug, url);
      console.log(`✅ ${slug} → ${result.secure_url}`);

      // Update image_slug on matching services
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
  console.log(`\nCloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`Cloudinary URL pattern: https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_800,q_auto,f_auto/salon-services/<slug>`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
