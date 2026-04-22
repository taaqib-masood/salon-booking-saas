import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const seedData = async () => {
  try {
    console.log('✅ Connected to Supabase');

    // Real tenant ID from your registered La Maison admin account
    const tenant_id = '5103813d-5a3b-4ebd-88f3-d1277e600a06';

    // Check if tenant exists
    const { data: tenant, error: tenantQueryErr } = await supabase.from('tenants').select('id').eq('id', tenant_id).maybeSingle();
    
    if (!tenant) {
        const { error: tenantInsertErr } = await supabase.from('tenants').insert({ 
            id: tenant_id, 
            name: 'La Maison Luxury Salon', 
            slug: 'la-maison',
            owner_email: 'hello@lamaison.ae' 
        });
        if (tenantInsertErr) throw tenantInsertErr;
    }

    console.log('🧹 Purging existing luxury data...');
    await supabase.from('services').delete().eq('tenant_id', tenant_id);
    await supabase.from('service_categories').delete().eq('tenant_id', tenant_id);
    await supabase.from('branches').delete().eq('tenant_id', tenant_id);

    // Create Branches
    const { data: branches, error: branchErr } = await supabase.from('branches').insert([
      { 
        tenant_id, 
        name: 'Jumeirah Flagship', 
        address: { street: 'Jumeirah Beach Road, Dubai' }, 
        phone: '+971 4 000 0001',
        email: 'jumeirah@lamaison.ae'
      },
      { 
        tenant_id, 
        name: 'Downtown Penthouse', 
        address: { street: 'Downtown Dubai' }, 
        phone: '+971 4 000 0002',
        email: 'downtown@lamaison.ae'
      }
    ]).select();
    
    if (branchErr) throw branchErr;

    // Create Categories
    const { data: categories, error: catErr } = await supabase.from('service_categories').insert([
      { tenant_id, name_en: 'Haute Coiffure', name_ar: 'تصفيف الشعر الراقي', icon: 'scissors', display_order: 1, is_active: true },
      { tenant_id, name_en: 'Bespoke Nail Artistry', name_ar: 'فن تجميل الأظافر', icon: 'sparkles', display_order: 2, is_active: true },
      { tenant_id, name_en: 'Wellness Spa & Face', name_ar: 'سبا الوجه والعافية', icon: 'leaf', display_order: 3, is_active: true },
      { tenant_id, name_en: 'Bridal & Editorial', name_ar: 'تجهيز العرائس', icon: 'star', display_order: 4, is_active: true }
    ]).select();
    
    if (catErr) throw catErr;

    // Create Services
    const { error: servErr } = await supabase.from('services').insert([
      { 
        tenant_id, 
        name_en: 'Signature Silk Blowout', 
        category_id: categories[0].id, 
        description_en: 'A transformative blowout using caviar-infused serums to achieve a glass-like finish and ultimate volume.',
        duration: 60, price: 350, is_active: true 
      },
      { 
        tenant_id, 
        name_en: 'Balayage & Color Correction', 
        category_id: categories[0].id, 
        description_en: 'Custom hand-painted highlights by our master colorists, finished with a deeply nourishing Olaplex treatment.',
        duration: 180, price: 1200, is_active: true 
      },
      { 
        tenant_id, 
        name_en: '24K Gold Manicure', 
        category_id: categories[1].id, 
        description_en: 'An opulent hand treatment featuring a warm paraffin dip infused with 24K gold flakes, finished with precise cuticle care and gel polish.',
        duration: 75, price: 450, is_active: true 
      },
      { 
        tenant_id, 
        name_en: 'Royal Caviar Facial', 
        category_id: categories[2].id, 
        description_en: 'A rejuvenating facial lifting treatment utilizing premium Swiss caviar extracts to dramatically restore firmness and glow.',
        duration: 90, price: 1500, is_active: true 
      }
    ]);

    if (servErr) throw servErr;

    console.log('✨ Seeded Supabase with luxury categories and signature services successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
