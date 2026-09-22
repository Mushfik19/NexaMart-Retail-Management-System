import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NexaMart Management database seed...');

  // 1. Clean existing records (order matters for foreign keys)
  await prisma.storeDay.deleteMany();
  await prisma.refundItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.goodsReceiptItem.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.setting.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Create Stores
  const flagshipStore = await prisma.store.create({
    data: {
      name: 'NexaMart Flagship Superstore',
      code: 'STR-01',
      isWarehouse: false,
      address: '250 Elizabeth Street',
      city: 'Melbourne',
      state: 'VIC',
      country: 'Australia',
      currency: 'AUD',
      currencySymbol: '$',
      phone: '+61 3 9876 5432',
      email: 'flagship@nexamart.com.au',
      taxNumber: 'ABN 88 123 456 789',
      taxInclusive: true,
      taxRateDefault: 10.0,
    },
  });

  const metroStore = await prisma.store.create({
    data: {
      name: 'NexaMart Metro Express',
      code: 'STR-02',
      isWarehouse: false,
      address: '45 George Street',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      currency: 'AUD',
      currencySymbol: '$',
      phone: '+61 2 8765 4321',
      email: 'metro@nexamart.com.au',
      taxNumber: 'ABN 88 123 456 789',
      taxInclusive: true,
      taxRateDefault: 10.0,
    },
  });

  const warehouse = await prisma.store.create({
    data: {
      name: 'NexaMart Central Distribution DC',
      code: 'WH-01',
      isWarehouse: true,
      address: '10 Logistics Boulevard',
      city: 'Tullamarine',
      state: 'VIC',
      country: 'Australia',
      currency: 'AUD',
      currencySymbol: '$',
      phone: '+61 3 9999 0000',
      email: 'warehouse@nexamart.com.au',
      taxNumber: 'ABN 88 123 456 789',
      taxInclusive: true,
      taxRateDefault: 10.0,
    },
  });

  console.log('🏬 Created 3 store entities.');

  // 3. Create Cash Registers
  const reg1 = await prisma.cashRegister.create({
    data: {
      storeId: flagshipStore.id,
      name: 'Register 01 - Front Checkout',
      code: 'REG-01',
    },
  });

  const reg2 = await prisma.cashRegister.create({
    data: {
      storeId: flagshipStore.id,
      name: 'Register 02 - Express Lane (12 Items)',
      code: 'REG-02',
    },
  });

  // 4. Create 9 Roles Users
  const adminHash = await bcrypt.hash('Admin@12345', 10);
  const ownerHash = await bcrypt.hash('Owner@12345', 10);
  const managerHash = await bcrypt.hash('Manager@12345', 10);
  const cashierHash = await bcrypt.hash('Cashier@12345', 10);
  const inventoryHash = await bcrypt.hash('Inventory@12345', 10);
  const purchaseHash = await bcrypt.hash('Purchase@12345', 10);
  const warehouseHash = await bcrypt.hash('Warehouse@12345', 10);
  const accountHash = await bcrypt.hash('Account@12345', 10);
  const auditorHash = await bcrypt.hash('Auditor@12345', 10);

  const usersData = [
    { email: 'admin@nexamart.com', username: 'admin', fullName: 'Alexander Vance (Super Admin)', role: 'SUPER_ADMIN', password: adminHash, storeId: flagshipStore.id },
    { email: 'owner@nexamart.com', username: 'owner', fullName: 'Eleanor Sterling (Store Owner)', role: 'STORE_OWNER', password: ownerHash, storeId: flagshipStore.id },
    { email: 'manager@nexamart.com', username: 'manager', fullName: 'Marcus Brody (Store Manager)', role: 'STORE_MANAGER', password: managerHash, storeId: flagshipStore.id },
    { email: 'cashier@nexamart.com', username: 'cashier01', fullName: 'Sarah Jenkins (Head Cashier)', role: 'CASHIER', password: cashierHash, storeId: flagshipStore.id },
    { email: 'inventory@nexamart.com', username: 'inventory01', fullName: 'David Chen (Inventory Controller)', role: 'INVENTORY_MANAGER', password: inventoryHash, storeId: flagshipStore.id },
    { email: 'purchasing@nexamart.com', username: 'purchase01', fullName: 'Rachel Adams (Procurement Officer)', role: 'PURCHASING_OFFICER', password: purchaseHash, storeId: flagshipStore.id },
    { email: 'accountant@nexamart.com', username: 'accountant01', fullName: 'Thomas Wright (Chief Accountant)', role: 'ACCOUNTANT', password: accountHash, storeId: flagshipStore.id },
    { email: 'warehouse@nexamart.com', username: 'warehouse01', fullName: 'Liam O’Connor (Logistics Lead)', role: 'WAREHOUSE_STAFF', password: warehouseHash, storeId: warehouse.id },
    { email: 'auditor@nexamart.com', username: 'auditor01', fullName: 'Fiona Gallagher (Internal Auditor)', role: 'AUDITOR', password: auditorHash, storeId: flagshipStore.id },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    createdUsers[u.role] = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        passwordHash: u.password,
        storeId: u.storeId,
      },
    });
  }

  console.log('👥 Created 9 role-based staff members.');

  // 5. Open a shift for Cashier on Register 01
  const activeShift = await prisma.shift.create({
    data: {
      registerId: reg1.id,
      userId: createdUsers['CASHIER'].id,
      storeId: flagshipStore.id,
      openingCash: 200.0, // $200 float
      status: 'OPEN',
      notes: 'Morning shift opening float verified by Marcus Brody',
    },
  });

  await prisma.cashRegister.update({
    where: { id: reg1.id },
    data: { currentShiftId: activeShift.id },
  });

  await prisma.cashMovement.create({
    data: {
      shiftId: activeShift.id,
      userId: createdUsers['CASHIER'].id,
      type: 'FLOAT_ADD',
      amount: 200.0,
      reason: 'Standard opening drawer cash float',
    },
  });

  // 6. 13 Supermarket Categories
  const categoriesList = [
    { name: 'Fresh Produce & Fruit', slug: 'fresh-produce', icon: 'Apple', description: 'Fresh fruits and organic vegetables' },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: 'Milk', description: 'Fresh milk, butter, cheese, yogurts and farm eggs' },
    { name: 'Bakery & Bread', slug: 'bakery', icon: 'Croissant', description: 'Artisan sourdough, sliced breads, rolls and pastries' },
    { name: 'Beverages & Drinks', slug: 'beverages', icon: 'Coffee', description: 'Soft drinks, juices, energy drinks, mineral waters' },
    { name: 'Meat & Poultry', slug: 'meat-poultry', icon: 'Beef', description: 'Premium steaks, poultry, mince and sausages' },
    { name: 'Pantry & Groceries', slug: 'pantry-groceries', icon: 'PackageOpen', description: 'Pasta, rice, sauces, spices, oils and canned goods' },
    { name: 'Snacks & Confectionery', slug: 'snacks', icon: 'Cookie', description: 'Chips, chocolates, biscuits, nuts and candies' },
    { name: 'Frozen Foods', slug: 'frozen-foods', icon: 'IceCream', description: 'Ice cream, frozen meals, vegetables and seafood' },
    { name: 'Personal Care', slug: 'personal-care', icon: 'Sparkles', description: 'Shampoo, body wash, oral care, skincare' },
    { name: 'Household & Cleaning', slug: 'household-cleaning', icon: 'ShieldCheck', description: 'Detergents, paper towels, trash bags, cleaners' },
    { name: 'Baby & Toddler', slug: 'baby-toddler', icon: 'Baby', description: 'Nappies, baby formula, wipes and baby food' },
    { name: 'Pet Care', slug: 'pet-care', icon: 'Dog', description: 'Cat and dog food, treats, litter and accessories' },
    { name: 'Health & Deli', slug: 'health-deli', icon: 'HeartPulse', description: 'Vitamins, first aid, cured meats and specialty cheese' },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesList) {
    const c = await prisma.category.create({ data: cat });
    categoryMap[cat.slug] = c.id;
  }

  // 7. 20 Suppliers
  const suppliersList = [
    { name: 'Dairy Farmers Australia', contactPerson: 'Mark Higgins', email: 'orders@dairyfarmers.com.au', phone: '+61 3 9123 4567', paymentTerms: 'Net 30' },
    { name: 'Coca-Cola Europacific Partners', contactPerson: 'Kelly Adams', email: 'b2b@ccep.com.au', phone: '+61 2 9234 5678', paymentTerms: 'Net 14' },
    { name: 'Tip Top Bakeries ANZ', contactPerson: 'Greg Norton', email: 'dispatch@tiptop.com.au', phone: '+61 3 9345 6789', paymentTerms: 'COD' },
    { name: 'Fresh Farms Victoria', contactPerson: 'Samira Patel', email: 'orders@freshfarms.vic.gov.au', phone: '+61 3 9456 7890', paymentTerms: 'Net 7' },
    { name: 'Nestlé Australia Ltd', contactPerson: 'Julian Ross', email: 'wholesale@nestle.com.au', phone: '+61 2 9567 8901', paymentTerms: 'Net 30' },
    { name: 'Kellogg’s Australia', contactPerson: 'Angela Wright', email: 'orders@kelloggs.com.au', phone: '+61 2 9678 9012', paymentTerms: 'Net 30' },
    { name: 'Unilever Australia', contactPerson: 'Simon Vance', email: 'supply@unilever.com.au', phone: '+61 2 9789 0123', paymentTerms: 'Net 30' },
    { name: 'Procter & Gamble Australia', contactPerson: 'Chloe Taylor', email: 'orders@pg.com.au', phone: '+61 2 9890 1234', paymentTerms: 'Net 30' },
    { name: 'Mondelez / Cadbury ANZ', contactPerson: 'Darren Lee', email: 'orders@mondelezinternational.com', phone: '+61 3 9012 3456', paymentTerms: 'Net 21' },
    { name: 'Arnott’s Biscuits Ltd', contactPerson: 'Clair Dunphy', email: 'supply@arnotts.com.au', phone: '+61 2 9123 7890', paymentTerms: 'Net 30' },
    { name: 'Bega Cheese Ltd', contactPerson: 'Howard Price', email: 'orders@bega.com.au', phone: '+61 2 6491 7777', paymentTerms: 'Net 30' },
    { name: 'Primo Smallgoods', contactPerson: 'Tony Bertolucci', email: 'sales@primo.com.au', phone: '+61 2 9741 8000', paymentTerms: 'Net 14' },
    { name: 'Simplot Frozen Foods', contactPerson: 'Brett Morris', email: 'orders@simplot.com.au', phone: '+61 3 9588 3000', paymentTerms: 'Net 30' },
    { name: 'Kimberly-Clark Australia', contactPerson: 'Hannah Bell', email: 'orders@kca.com.au', phone: '+61 2 9963 8888', paymentTerms: 'Net 30' },
    { name: 'Reckitt Benckiser ANZ', contactPerson: 'Neil Gellar', email: 'supply@reckitt.com.au', phone: '+61 2 9857 2000', paymentTerms: 'Net 30' },
    { name: 'Bundaberg Brewed Drinks', contactPerson: 'Penny Fleming', email: 'orders@bundaberg.com', phone: '+61 7 4154 5400', paymentTerms: 'Net 14' },
    { name: 'Sanitarium Health Foods', contactPerson: 'Graham Ward', email: 'wholesale@sanitarium.com.au', phone: '+61 2 4348 7777', paymentTerms: 'Net 30' },
    { name: 'Golden Circle Beverages', contactPerson: 'Lisa Henderson', email: 'b2b@goldencircle.com.au', phone: '+61 7 3266 0111', paymentTerms: 'Net 21' },
    { name: 'Red Bull Australia', contactPerson: 'Travis Knight', email: 'orders@redbull.com.au', phone: '+61 2 9004 7000', paymentTerms: 'Net 14' },
    { name: 'Twinings Tea Australia', contactPerson: 'Fiona Baxter', email: 'orders@twinings.com.au', phone: '+61 2 8878 9999', paymentTerms: 'Net 30' },
  ];

  const supplierMap: Record<string, string> = {};
  for (const s of suppliersList) {
    const created = await prisma.supplier.create({ data: s });
    supplierMap[s.name] = created.id;
  }

  console.log('🚛 Created 20 verified suppliers.');

  // 8. 100+ Authentic Supermarket Products
  const rawProducts = [
    // --- DAIRY & EGGS ---
    { name: 'Dairy Farmers Full Cream Milk 2L', sku: 'DAI-DF-FC2L', barcode: '9310047201389', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 2.10, price: 3.80, unit: 'bottle', perish: true, days: 5, stock: 45, shelf: 'Aisle 1 - Fridge 1' },
    { name: 'Dairy Farmers Skim Milk 2L', sku: 'DAI-DF-SK2L', barcode: '9310047201396', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 2.10, price: 3.80, unit: 'bottle', perish: true, days: 6, stock: 32, shelf: 'Aisle 1 - Fridge 1' },
    { name: 'Dairy Farmers Thickened Cream 300ml', sku: 'DAI-DF-CR300', barcode: '9310047201402', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 1.60, price: 2.90, unit: 'tub', perish: true, days: 10, stock: 24, shelf: 'Aisle 1 - Fridge 2' },
    { name: 'Bega Tasty Cheese Block 500g', sku: 'DAI-BEG-BLK500', barcode: '9300650630018', cat: 'dairy-eggs', sup: 'Bega Cheese Ltd', cost: 4.80, price: 7.50, unit: 'pack', perish: true, days: 45, stock: 38, shelf: 'Aisle 1 - Fridge 3' },
    { name: 'Bega Cheese Slices 250g 12pk', sku: 'DAI-BEG-SLC250', barcode: '9300650630025', cat: 'dairy-eggs', sup: 'Bega Cheese Ltd', cost: 3.20, price: 5.20, unit: 'pack', perish: true, days: 60, stock: 42, shelf: 'Aisle 1 - Fridge 3' },
    { name: 'Western Star Salted Butter 250g', sku: 'DAI-WS-BUT250', barcode: '9310047202010', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 2.50, price: 4.20, unit: 'block', perish: true, days: 40, stock: 28, shelf: 'Aisle 1 - Fridge 2' },
    { name: 'Chobani Greek Yogurt Strawberry 170g', sku: 'DAI-CHO-STR170', barcode: '9345678000101', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 1.30, price: 2.50, unit: 'tub', perish: true, days: 8, stock: 22, shelf: 'Aisle 1 - Fridge 4' },
    { name: 'Chobani Greek Yogurt Plain 907g', sku: 'DAI-CHO-PLN907', barcode: '9345678000118', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 4.20, price: 6.80, unit: 'tub', perish: true, days: 12, stock: 15, shelf: 'Aisle 1 - Fridge 4' },
    { name: 'Sunny Queen Free Range Eggs 12pk 700g', sku: 'DAI-SQ-EG12', barcode: '9312345000202', cat: 'dairy-eggs', sup: 'Fresh Farms Victoria', cost: 4.00, price: 6.50, unit: 'carton', perish: true, days: 21, stock: 30, shelf: 'Aisle 1 - Stand A' },
    { name: 'Jalna Pot Set Biodynamic Yogurt 1kg', sku: 'DAI-JAL-YOG1KG', barcode: '9312345000219', cat: 'dairy-eggs', sup: 'Dairy Farmers Australia', cost: 4.50, price: 7.20, unit: 'tub', perish: true, days: 14, stock: 18, shelf: 'Aisle 1 - Fridge 4' },

    // --- BEVERAGES & DRINKS ---
    { name: 'Coca-Cola Classic Bottle 1.25L', sku: 'BEV-CC-125L', barcode: '9300601234567', cat: 'beverages', sup: 'Coca-Cola Europacific Partners', cost: 1.80, price: 3.50, unit: 'bottle', perish: false, days: 180, stock: 65, shelf: 'Aisle 2 - Bay 1' },
    { name: 'Coca-Cola No Sugar Bottle 1.25L', sku: 'BEV-CC-NS125L', barcode: '9300601234574', cat: 'beverages', sup: 'Coca-Cola Europacific Partners', cost: 1.80, price: 3.50, unit: 'bottle', perish: false, days: 180, stock: 58, shelf: 'Aisle 2 - Bay 1' },
    { name: 'Sprite Lemonade Bottle 1.25L', sku: 'BEV-SPR-125L', barcode: '9300601234581', cat: 'beverages', sup: 'Coca-Cola Europacific Partners', cost: 1.80, price: 3.50, unit: 'bottle', perish: false, days: 180, stock: 40, shelf: 'Aisle 2 - Bay 1' },
    { name: 'Fanta Orange Bottle 1.25L', sku: 'BEV-FAN-125L', barcode: '9300601234598', cat: 'beverages', sup: 'Coca-Cola Europacific Partners', cost: 1.80, price: 3.50, unit: 'bottle', perish: false, days: 180, stock: 34, shelf: 'Aisle 2 - Bay 1' },
    { name: 'Bundaberg Ginger Beer 4x375ml', sku: 'BEV-BUN-GB4PK', barcode: '9311492000017', cat: 'beverages', sup: 'Bundaberg Brewed Drinks', cost: 5.20, price: 8.50, unit: 'pack', perish: false, days: 365, stock: 26, shelf: 'Aisle 2 - Bay 2' },
    { name: 'Bundaberg Sarsaparilla 4x375ml', sku: 'BEV-BUN-SAR4PK', barcode: '9311492000024', cat: 'beverages', sup: 'Bundaberg Brewed Drinks', cost: 5.20, price: 8.50, unit: 'pack', perish: false, days: 365, stock: 18, shelf: 'Aisle 2 - Bay 2' },
    { name: 'Red Bull Energy Drink Can 250ml', sku: 'BEV-RB-CAN250', barcode: '9002490100070', cat: 'beverages', sup: 'Red Bull Australia', cost: 2.10, price: 3.80, unit: 'can', perish: false, days: 365, stock: 80, shelf: 'Aisle 2 - Chiller' },
    { name: 'Red Bull Sugarfree Can 250ml', sku: 'BEV-RB-SF250', barcode: '9002490100087', cat: 'beverages', sup: 'Red Bull Australia', cost: 2.10, price: 3.80, unit: 'can', perish: false, days: 365, stock: 55, shelf: 'Aisle 2 - Chiller' },
    { name: 'Golden Circle Orange Juice 2L', sku: 'BEV-GC-OJ2L', barcode: '9310055000011', cat: 'beverages', sup: 'Golden Circle Beverages', cost: 2.90, price: 4.80, unit: 'bottle', perish: true, days: 25, stock: 30, shelf: 'Aisle 1 - Fridge 5' },
    { name: 'Golden Circle Apple Juice 2L', sku: 'BEV-GC-AJ2L', barcode: '9310055000028', cat: 'beverages', sup: 'Golden Circle Beverages', cost: 2.90, price: 4.80, unit: 'bottle', perish: true, days: 25, stock: 28, shelf: 'Aisle 1 - Fridge 5' },
    { name: 'Mount Franklin Spring Water 6x600ml', sku: 'BEV-MF-WTR6PK', barcode: '9300601555556', cat: 'beverages', sup: 'Coca-Cola Europacific Partners', cost: 4.20, price: 7.20, unit: 'pack', perish: false, days: 720, stock: 45, shelf: 'Aisle 2 - Bay 3' },
    { name: 'San Pellegrino Sparkling Water 1L', sku: 'BEV-SP-SPK1L', barcode: '8002270014002', cat: 'beverages', sup: 'Nestlé Australia Ltd', cost: 2.00, price: 3.60, unit: 'bottle', perish: false, days: 540, stock: 35, shelf: 'Aisle 2 - Bay 3' },

    // --- BAKERY & BREAD ---
    { name: 'Tip Top The One White Sandwich Bread 700g', sku: 'BAK-TT-WHT700', barcode: '9310043000016', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 2.20, price: 3.90, unit: 'loaf', perish: true, days: 4, stock: 25, shelf: 'Aisle 3 - Shelf A' },
    { name: 'Tip Top The One Wholemeal Bread 700g', sku: 'BAK-TT-WML700', barcode: '9310043000023', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 2.20, price: 3.90, unit: 'loaf', perish: true, days: 4, stock: 20, shelf: 'Aisle 3 - Shelf A' },
    { name: 'Helga’s Traditional Sourdough Loaf 680g', sku: 'BAK-HLG-SRD680', barcode: '9310043000108', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 3.10, price: 5.40, unit: 'loaf', perish: true, days: 5, stock: 16, shelf: 'Aisle 3 - Shelf B' },
    { name: 'Mission White Corn Tortillas 12pk 384g', sku: 'BAK-MIS-TRT12', barcode: '9312345678901', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 2.40, price: 4.20, unit: 'pack', perish: true, days: 30, stock: 30, shelf: 'Aisle 3 - Shelf C' },
    { name: 'Wonder White Vitamins & Minerals 700g', sku: 'BAK-WW-VIT700', barcode: '9310043000207', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 2.30, price: 4.10, unit: 'loaf', perish: true, days: 4, stock: 18, shelf: 'Aisle 3 - Shelf A' },
    { name: 'Golden Crumpets Original 6pk 300g', sku: 'BAK-GLD-CRM6', barcode: '9310043000306', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 1.80, price: 3.20, unit: 'pack', perish: true, days: 7, stock: 22, shelf: 'Aisle 3 - Shelf B' },
    { name: 'Bakehouse Croissants 4pk 200g', sku: 'BAK-BK-CRS4', barcode: '9310043000405', cat: 'bakery', sup: 'Tip Top Bakeries ANZ', cost: 2.80, price: 4.80, unit: 'pack', perish: true, days: 3, stock: 12, shelf: 'Aisle 3 - Shelf B' },

    // --- FRESH PRODUCE & FRUITS ---
    { name: 'Fresh Cavendish Bananas (per kg)', sku: 'PRD-BAN-KG', barcode: '9300000000014', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 1.80, price: 3.50, unit: 'kg', perish: true, days: 5, stock: 60, shelf: 'Produce Stand 1' },
    { name: 'Royal Gala Apples 1kg Bag', sku: 'PRD-APP-GL1KG', barcode: '9300000000021', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 2.50, price: 4.90, unit: 'bag', perish: true, days: 10, stock: 35, shelf: 'Produce Stand 1' },
    { name: 'Washed Baby Spinach 280g Bag', sku: 'PRD-SPN-280G', barcode: '9300000000038', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 2.00, price: 3.80, unit: 'bag', perish: true, days: 6, stock: 24, shelf: 'Produce Chiller' },
    { name: 'Vine Ripened Tomatoes 500g Pack', sku: 'PRD-TOM-VN500', barcode: '9300000000045', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 2.40, price: 4.50, unit: 'pack', perish: true, days: 7, stock: 28, shelf: 'Produce Stand 2' },
    { name: 'Continental Lebanese Cucumbers 1kg', sku: 'PRD-CUC-LB1KG', barcode: '9300000000052', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 2.20, price: 4.20, unit: 'kg', perish: true, days: 8, stock: 22, shelf: 'Produce Stand 2' },
    { name: 'Washed Potatoes Carisma 2kg Bag', sku: 'PRD-POT-2KG', barcode: '9300000000069', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 3.00, price: 5.50, unit: 'bag', perish: true, days: 20, stock: 40, shelf: 'Produce Stand 3' },
    { name: 'Brown Onions 1kg Bag', sku: 'PRD-ONI-BR1KG', barcode: '9300000000076', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 1.50, price: 2.80, unit: 'bag', perish: true, days: 30, stock: 35, shelf: 'Produce Stand 3' },
    { name: 'Fresh Hass Avocados 4pk Net', sku: 'PRD-AVO-4PK', barcode: '9300000000083', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 4.20, price: 7.00, unit: 'pack', perish: true, days: 6, stock: 20, shelf: 'Produce Stand 1' },
    { name: 'Fresh Australian Strawberries 250g Punnet', sku: 'PRD-STR-250G', barcode: '9300000000090', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 2.20, price: 3.90, unit: 'punnet', perish: true, days: 4, stock: 26, shelf: 'Produce Chiller' },
    { name: 'Blueberries Australian 125g Punnet', sku: 'PRD-BLU-125G', barcode: '9300000000106', cat: 'fresh-produce', sup: 'Fresh Farms Victoria', cost: 2.80, price: 4.90, unit: 'punnet', perish: true, days: 5, stock: 19, shelf: 'Produce Chiller' },

    // --- MEAT & POULTRY ---
    { name: 'Primo Premium Short Cut Bacon 500g', sku: 'MEA-PRI-BAC500', barcode: '9310653000019', cat: 'meat-poultry', sup: 'Primo Smallgoods', cost: 5.50, price: 9.00, unit: 'pack', perish: true, days: 30, stock: 25, shelf: 'Meat Chiller 1' },
    { name: 'Primo Cocktail Frankfurts 500g', sku: 'MEA-PRI-FRK500', barcode: '9310653000026', cat: 'meat-poultry', sup: 'Primo Smallgoods', cost: 3.80, price: 6.20, unit: 'pack', perish: true, days: 35, stock: 20, shelf: 'Meat Chiller 1' },
    { name: 'Australian Grass Fed Beef Mince 500g', sku: 'MEA-BEEF-MNC500', barcode: '9310653000101', cat: 'meat-poultry', sup: 'Primo Smallgoods', cost: 5.80, price: 9.50, unit: 'pack', perish: true, days: 5, stock: 30, shelf: 'Meat Chiller 2' },
    { name: 'Free Range Chicken Breast Fillets 1kg', sku: 'MEA-CHK-BST1KG', barcode: '9310653000118', cat: 'meat-poultry', sup: 'Primo Smallgoods', cost: 8.50, price: 13.50, unit: 'pack', perish: true, days: 5, stock: 24, shelf: 'Meat Chiller 2' },
    { name: 'Australian Lamb Cutlets 6pk 500g', sku: 'MEA-LMB-CUT500', barcode: '9310653000125', cat: 'meat-poultry', sup: 'Primo Smallgoods', cost: 14.00, price: 21.00, unit: 'pack', perish: true, days: 4, stock: 12, shelf: 'Meat Chiller 2' },
    { name: 'Pork Chops Loin Medallions 500g', sku: 'MEA-PRK-CHP500', barcode: '9310653000132', cat: 'meat-poultry', sup: 'Primo Smallgoods', cost: 6.50, price: 10.50, unit: 'pack', perish: true, days: 5, stock: 15, shelf: 'Meat Chiller 2' },

    // --- PANTRY & GROCERIES ---
    { name: 'San Remo Spaghetti No 5 500g', sku: 'PAN-SR-SPG500', barcode: '9310155000012', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 1.50, price: 2.80, unit: 'box', perish: false, days: 720, stock: 50, shelf: 'Aisle 4 - Shelf A' },
    { name: 'San Remo Penne Rigate 500g', sku: 'PAN-SR-PEN500', barcode: '9310155000029', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 1.50, price: 2.80, unit: 'box', perish: false, days: 720, stock: 45, shelf: 'Aisle 4 - Shelf A' },
    { name: 'Leggo’s Bolognese Pasta Sauce 500g', sku: 'PAN-LEG-BLG500', barcode: '9310055111113', cat: 'pantry-groceries', sup: 'Simplot Frozen Foods', cost: 2.20, price: 3.80, unit: 'jar', perish: false, days: 540, stock: 36, shelf: 'Aisle 4 - Shelf B' },
    { name: 'SunRice Jasmine Fragrant Rice 5kg', sku: 'PAN-SUN-JAS5KG', barcode: '9310140000010', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 11.50, price: 17.50, unit: 'bag', perish: false, days: 720, stock: 22, shelf: 'Aisle 4 - Floor Bay' },
    { name: 'SunRice Medium Grain Calrose Rice 2kg', sku: 'PAN-SUN-CAL2KG', barcode: '9310140000027', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 4.80, price: 7.80, unit: 'bag', perish: false, days: 720, stock: 28, shelf: 'Aisle 4 - Floor Bay' },
    { name: 'Cobram Estate Extra Virgin Olive Oil 750ml', sku: 'PAN-COB-EVO750', barcode: '9332456000017', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 10.50, price: 16.00, unit: 'bottle', perish: false, days: 540, stock: 25, shelf: 'Aisle 4 - Shelf C' },
    { name: 'Sanitarium Weet-Bix Cereal 1.12kg', sku: 'PAN-SAN-WB112', barcode: '9300652000017', cat: 'pantry-groceries', sup: 'Sanitarium Health Foods', cost: 4.20, price: 6.80, unit: 'box', perish: false, days: 365, stock: 35, shelf: 'Aisle 5 - Shelf A' },
    { name: 'Kellogg’s Corn Flakes Cereal 725g', sku: 'PAN-KEL-CF725', barcode: '9310055600013', cat: 'pantry-groceries', sup: 'Kellogg’s Australia', cost: 3.80, price: 6.20, unit: 'box', perish: false, days: 365, stock: 28, shelf: 'Aisle 5 - Shelf A' },
    { name: 'Vegemite Spread Jar 380g', sku: 'PAN-BEG-VEG380', barcode: '9300650111111', cat: 'pantry-groceries', sup: 'Bega Cheese Ltd', cost: 4.10, price: 6.50, unit: 'jar', perish: false, days: 720, stock: 40, shelf: 'Aisle 5 - Shelf B' },
    { name: 'Moccona Classic Medium Roast Coffee 200g', sku: 'PAN-MOC-MDR200', barcode: '8711000000012', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 9.50, price: 15.00, unit: 'jar', perish: false, days: 720, stock: 30, shelf: 'Aisle 5 - Shelf C' },
    { name: 'Twinings English Breakfast Tea 100pk', sku: 'PAN-TWI-EB100', barcode: '9310055999995', cat: 'pantry-groceries', sup: 'Twinings Tea Australia', cost: 6.50, price: 10.50, unit: 'box', perish: false, days: 720, stock: 32, shelf: 'Aisle 5 - Shelf C' },
    { name: 'Nestlé Milo Chocolate Malt Drink 1kg', sku: 'PAN-NES-MIL1KG', barcode: '9300605000014', cat: 'pantry-groceries', sup: 'Nestlé Australia Ltd', cost: 8.50, price: 13.50, unit: 'tin', perish: false, days: 540, stock: 26, shelf: 'Aisle 5 - Shelf B' },

    // --- SNACKS & CONFECTIONERY ---
    { name: 'Cadbury Dairy Milk Chocolate Block 180g', sku: 'SNK-CAD-DM180', barcode: '9300617000014', cat: 'snacks', sup: 'Mondelez / Cadbury ANZ', cost: 2.80, price: 5.50, unit: 'block', perish: false, days: 365, stock: 65, shelf: 'Aisle 6 - Bay 1' },
    { name: 'Cadbury Caramilk Chocolate Block 180g', sku: 'SNK-CAD-CAR180', barcode: '9300617000021', cat: 'snacks', sup: 'Mondelez / Cadbury ANZ', cost: 2.80, price: 5.50, unit: 'block', perish: false, days: 365, stock: 50, shelf: 'Aisle 6 - Bay 1' },
    { name: 'Arnott’s Tim Tam Original Biscuits 200g', sku: 'SNK-ARN-TIM200', barcode: '9310072000018', cat: 'snacks', sup: 'Arnott’s Biscuits Ltd', cost: 2.40, price: 4.50, unit: 'pack', perish: false, days: 270, stock: 75, shelf: 'Aisle 6 - Bay 2' },
    { name: 'Arnott’s Shapes Barbecue Crackers 175g', sku: 'SNK-ARN-SHP175', barcode: '9310072000025', cat: 'snacks', sup: 'Arnott’s Biscuits Ltd', cost: 2.00, price: 3.80, unit: 'box', perish: false, days: 270, stock: 60, shelf: 'Aisle 6 - Bay 2' },
    { name: 'Arnott’s Shapes Pizza Crackers 175g', sku: 'SNK-ARN-PZA175', barcode: '9310072000032', cat: 'snacks', sup: 'Arnott’s Biscuits Ltd', cost: 2.00, price: 3.80, unit: 'box', perish: false, days: 270, stock: 55, shelf: 'Aisle 6 - Bay 2' },
    { name: 'Smith’s Crinkle Cut Original Potato Chips 170g', sku: 'SNK-SMT-ORI170', barcode: '9310015000013', cat: 'snacks', sup: 'Nestlé Australia Ltd', cost: 2.20, price: 4.20, unit: 'bag', perish: false, days: 180, stock: 45, shelf: 'Aisle 6 - Bay 3' },
    { name: 'Smith’s Salt & Vinegar Chips 170g', sku: 'SNK-SMT-SNV170', barcode: '9310015000020', cat: 'snacks', sup: 'Nestlé Australia Ltd', cost: 2.20, price: 4.20, unit: 'bag', perish: false, days: 180, stock: 40, shelf: 'Aisle 6 - Bay 3' },
    { name: 'Doritos Cheese Supreme Corn Chips 170g', sku: 'SNK-DOR-CHS170', barcode: '9310015000037', cat: 'snacks', sup: 'Nestlé Australia Ltd', cost: 2.40, price: 4.50, unit: 'bag', perish: false, days: 180, stock: 50, shelf: 'Aisle 6 - Bay 3' },
    { name: 'Red Rock Deli Sweet Chilli & Sour Cream 165g', sku: 'SNK-RRD-SC165', barcode: '9310015000044', cat: 'snacks', sup: 'Nestlé Australia Ltd', cost: 3.00, price: 5.80, unit: 'bag', perish: false, days: 180, stock: 35, shelf: 'Aisle 6 - Bay 3' },
    { name: 'M&M’s Milk Chocolate Party Bag 380g', sku: 'SNK-MM-MLK380', barcode: '9300682000016', cat: 'snacks', sup: 'Mondelez / Cadbury ANZ', cost: 4.50, price: 7.50, unit: 'bag', perish: false, days: 365, stock: 28, shelf: 'Aisle 6 - Bay 1' },

    // --- FROZEN FOODS ---
    { name: 'Birds Eye SteamFresh Mixed Veg 450g', sku: 'FRZ-BE-VEG450', barcode: '9310055222221', cat: 'frozen-foods', sup: 'Simplot Frozen Foods', cost: 2.20, price: 4.00, unit: 'bag', perish: false, days: 365, stock: 35, shelf: 'Freezer 1' },
    { name: 'Birds Eye Deep Sea Dory Fillets 425g', sku: 'FRZ-BE-DOR425', barcode: '9310055222238', cat: 'frozen-foods', sup: 'Simplot Frozen Foods', cost: 6.20, price: 10.50, unit: 'box', perish: false, days: 365, stock: 20, shelf: 'Freezer 2' },
    { name: 'Peters Drumstick Vanilla Ice Cream 4pk', sku: 'FRZ-PET-DRM4PK', barcode: '9310047333332', cat: 'frozen-foods', sup: 'Dairy Farmers Australia', cost: 4.80, price: 8.50, unit: 'box', perish: false, days: 365, stock: 24, shelf: 'Freezer 3' },
    { name: 'Ben & Jerry’s Half Baked Ice Cream 458ml', sku: 'FRZ-BJ-HB458', barcode: '0768406100015', cat: 'frozen-foods', sup: 'Unilever Australia', cost: 7.20, price: 12.00, unit: 'tub', perish: false, days: 365, stock: 18, shelf: 'Freezer 3' },
    { name: 'McCain Beer Batter Steak Cut Chips 750g', sku: 'FRZ-MCC-CHP750', barcode: '9310055333330', cat: 'frozen-foods', sup: 'Simplot Frozen Foods', cost: 3.10, price: 5.50, unit: 'bag', perish: false, days: 365, stock: 30, shelf: 'Freezer 1' },
    { name: 'Four’N Twenty Classic Meat Pies 4pk 700g', sku: 'FRZ-FNT-PIE4PK', barcode: '9310043444445', cat: 'frozen-foods', sup: 'Tip Top Bakeries ANZ', cost: 5.50, price: 9.20, unit: 'box', perish: false, days: 365, stock: 25, shelf: 'Freezer 2' },

    // --- HOUSEHOLD & CLEANING ---
    { name: 'Morning Fresh Ultimate Dishwashing Liquid 400ml', sku: 'HSD-MF-DSH400', barcode: '9310055444449', cat: 'household-cleaning', sup: 'Reckitt Benckiser ANZ', cost: 2.80, price: 5.20, unit: 'bottle', perish: false, days: 1080, stock: 40, shelf: 'Aisle 7 - Shelf A' },
    { name: 'Finish Ultimate All In 1 Dishwasher Tabs 34pk', sku: 'HSD-FIN-TAB34', barcode: '9300600000018', cat: 'household-cleaning', sup: 'Reckitt Benckiser ANZ', cost: 12.00, price: 21.00, unit: 'pack', perish: false, days: 1080, stock: 22, shelf: 'Aisle 7 - Shelf A' },
    { name: 'Omo Active Front & Top Laundry Liquid 2L', sku: 'HSD-OMO-LQD2L', barcode: '9300600000025', cat: 'household-cleaning', sup: 'Unilever Australia', cost: 11.50, price: 20.00, unit: 'bottle', perish: false, days: 1080, stock: 25, shelf: 'Aisle 7 - Shelf B' },
    { name: 'Kleenex Complete Clean Toilet Tissue 9pk', sku: 'HSD-KLN-TP9PK', barcode: '9310055555558', cat: 'household-cleaning', sup: 'Kimberly-Clark Australia', cost: 5.50, price: 9.50, unit: 'pack', perish: false, days: 1800, stock: 35, shelf: 'Aisle 7 - Shelf C' },
    { name: 'Viva Multi-Use Paper Towel 2pk', sku: 'HSD-VIV-PT2PK', barcode: '9310055555565', cat: 'household-cleaning', sup: 'Kimberly-Clark Australia', cost: 3.20, price: 5.50, unit: 'pack', perish: false, days: 1800, stock: 30, shelf: 'Aisle 7 - Shelf C' },
    { name: 'Dettol Disinfectant Surface Spray 450g', sku: 'HSD-DET-SPR450', barcode: '9300600000032', cat: 'household-cleaning', sup: 'Reckitt Benckiser ANZ', cost: 4.20, price: 7.50, unit: 'can', perish: false, days: 1080, stock: 28, shelf: 'Aisle 7 - Shelf A' },
    { name: 'Glad Cling Wrap Extra Grip 60m', sku: 'HSD-GLD-WRAP60', barcode: '9310055666667', cat: 'household-cleaning', sup: 'Reckitt Benckiser ANZ', cost: 3.50, price: 5.80, unit: 'roll', perish: false, days: 1800, stock: 32, shelf: 'Aisle 7 - Shelf D' },

    // --- PERSONAL CARE ---
    { name: 'Colgate Total Clean Mint Toothpaste 115g', sku: 'PC-COL-TP115', barcode: '8718951000015', cat: 'personal-care', sup: 'Procter & Gamble Australia', cost: 3.00, price: 5.50, unit: 'tube', perish: false, days: 720, stock: 45, shelf: 'Aisle 8 - Shelf A' },
    { name: 'Oral-B Cross Action Soft Toothbrush 2pk', sku: 'PC-ORB-TB2PK', barcode: '4902430000012', cat: 'personal-care', sup: 'Procter & Gamble Australia', cost: 4.20, price: 7.20, unit: 'pack', perish: false, days: 1800, stock: 30, shelf: 'Aisle 8 - Shelf A' },
    { name: 'Head & Shoulders Classic Clean Shampoo 400ml', sku: 'PC-HS-SHM400', barcode: '4902430000029', cat: 'personal-care', sup: 'Procter & Gamble Australia', cost: 6.50, price: 11.00, unit: 'bottle', perish: false, days: 1080, stock: 24, shelf: 'Aisle 8 - Shelf B' },
    { name: 'Dove Deeply Nourishing Body Wash 1L', sku: 'PC-DOV-BW1L', barcode: '8710447000018', cat: 'personal-care', sup: 'Unilever Australia', cost: 7.80, price: 13.50, unit: 'bottle', perish: false, days: 1080, stock: 20, shelf: 'Aisle 8 - Shelf B' },
    { name: 'Rexona Men Sport Defence Deodorant 250ml', sku: 'PC-REX-MN250', barcode: '8710447000025', cat: 'personal-care', sup: 'Unilever Australia', cost: 4.00, price: 7.00, unit: 'can', perish: false, days: 1080, stock: 35, shelf: 'Aisle 8 - Shelf C' },
    { name: 'Nivea Soft Refreshingly Soft Cream 200ml', sku: 'PC-NIV-SFT200', barcode: '4005808000019', cat: 'personal-care', sup: 'Procter & Gamble Australia', cost: 5.00, price: 8.80, unit: 'tub', perish: false, days: 720, stock: 22, shelf: 'Aisle 8 - Shelf C' },

    // --- BABY & TODDLER ---
    { name: 'Huggies Ultra Dry Nappies Size 4 64pk', sku: 'BAB-HUG-NAP64', barcode: '9310055777776', cat: 'baby-toddler', sup: 'Kimberly-Clark Australia', cost: 22.00, price: 34.00, unit: 'pack', perish: false, days: 1080, stock: 15, shelf: 'Aisle 9 - Floor' },
    { name: 'Curash Baby Wipes Fragrance Free 3x80pk', sku: 'BAB-CUR-WIP240', barcode: '9310055777783', cat: 'baby-toddler', sup: 'Kimberly-Clark Australia', cost: 6.50, price: 11.00, unit: 'pack', perish: false, days: 720, stock: 25, shelf: 'Aisle 9 - Shelf A' },
    { name: 'Aptamil Profutura Infant Formula 1 900g', sku: 'BAB-APT-INF900', barcode: '9410055000019', cat: 'baby-toddler', sup: 'Nestlé Australia Ltd', cost: 26.00, price: 38.00, unit: 'tin', perish: true, days: 365, stock: 12, shelf: 'Aisle 9 - Lock Bay' },
    { name: 'Rafferty’s Garden Banana Milk Pear Puree 120g', sku: 'BAB-RAF-PUR120', barcode: '9310055777790', cat: 'baby-toddler', sup: 'Nestlé Australia Ltd', cost: 1.40, price: 2.40, unit: 'pouch', perish: true, days: 180, stock: 30, shelf: 'Aisle 9 - Shelf B' },

    // --- PET CARE ---
    { name: 'Dine Wet Cat Food Daily Collection 6x85g', sku: 'PET-DIN-CAT6PK', barcode: '9334246000013', cat: 'pet-care', sup: 'Unilever Australia', cost: 6.00, price: 10.00, unit: 'box', perish: false, days: 540, stock: 25, shelf: 'Aisle 10 - Shelf A' },
    { name: 'Purina Supercoat Adult Dog Food Beef 7kg', sku: 'PET-PUR-DOG7KG', barcode: '9300605111119', cat: 'pet-care', sup: 'Nestlé Australia Ltd', cost: 21.00, price: 32.00, unit: 'bag', perish: false, days: 365, stock: 14, shelf: 'Aisle 10 - Floor Bay' },
    { name: 'Schmackos Strapz Beef Dog Treats 500g', sku: 'PET-SCH-STR500', barcode: '9334246000020', cat: 'pet-care', sup: 'Unilever Australia', cost: 7.50, price: 12.50, unit: 'bag', perish: false, days: 365, stock: 22, shelf: 'Aisle 10 - Shelf B' },
    { name: 'Catsan Clumping Cat Litter 7L', sku: 'PET-CAT-LTR7L', barcode: '9334246000037', cat: 'pet-care', sup: 'Unilever Australia', cost: 8.50, price: 14.50, unit: 'bag', perish: false, days: 1800, stock: 18, shelf: 'Aisle 10 - Floor Bay' },

    // --- HEALTH & DELI ---
    { name: 'Panadol Extra Caplets Paracetamol 24pk', sku: 'HLT-PAN-EXT24', barcode: '9310055888885', cat: 'health-deli', sup: 'Procter & Gamble Australia', cost: 3.80, price: 6.50, unit: 'pack', perish: false, days: 720, stock: 40, shelf: 'Pharmacy Bay' },
    { name: 'Berocca Performance Orange Effervescent 15pk', sku: 'HLT-BER-ORG15', barcode: '9310055888892', cat: 'health-deli', sup: 'Procter & Gamble Australia', cost: 6.20, price: 10.50, unit: 'tube', perish: false, days: 540, stock: 28, shelf: 'Pharmacy Bay' },
    { name: 'Blackmores Multivitamin For Men 50pk', sku: 'HLT-BLM-MEN50', barcode: '9300807000015', cat: 'health-deli', sup: 'Sanitarium Health Foods', cost: 14.00, price: 23.00, unit: 'bottle', perish: false, days: 720, stock: 16, shelf: 'Pharmacy Bay' },
    { name: 'Prosciutto Di Parma Aged 100g Sliced', sku: 'DEL-PRO-100G', barcode: '9310653000200', cat: 'health-deli', sup: 'Primo Smallgoods', cost: 5.50, price: 9.00, unit: 'pack', perish: true, days: 25, stock: 18, shelf: 'Deli Counter Fridge' },
    { name: 'Castello Creamy Danish Blue Cheese 100g', sku: 'DEL-CAS-BLU100', barcode: '5700447000014', cat: 'health-deli', sup: 'Bega Cheese Ltd', cost: 3.40, price: 5.80, unit: 'pack', perish: true, days: 35, stock: 20, shelf: 'Deli Counter Fridge' },
  ];

  console.log(`📦 Seeding ${rawProducts.length} authentic supermarket products with stock & batches...`);

  const createdProducts: any[] = [];

  for (const p of rawProducts) {
    const categoryId = categoryMap[p.cat];
    const supplierId = supplierMap[p.sup];

    const prod = await prisma.product.create({
      data: {
        name: p.name,
        shortName: p.name.slice(0, 30),
        description: `Premium supermarket standard ${p.name}.`,
        categoryId,
        supplierId,
        sku: p.sku,
        barcode: p.barcode,
        costPrice: p.cost,
        sellingPrice: p.price,
        wholesalePrice: Number((p.price * 0.85).toFixed(2)),
        taxRate: 10.0,
        unit: p.unit,
        isPerishable: p.perish,
        hasBatchTracking: p.perish,
        expiryWarningDays: p.days > 14 ? 14 : 5,
        minStockLevel: 8,
        maxStockLevel: 100,
        reorderPoint: 15,
        shelfLocation: p.shelf,
        status: 'ACTIVE',
      },
    });

    createdProducts.push(prod);

    // Create inventory record for Flagship Store
    await prisma.inventory.create({
      data: {
        productId: prod.id,
        storeId: flagshipStore.id,
        onHand: p.stock,
        available: p.stock,
        reserved: 0,
        damaged: 0,
        reorderPoint: 15,
        maxStock: 100,
      },
    });

    // Create inventory record for Metro Store
    await prisma.inventory.create({
      data: {
        productId: prod.id,
        storeId: metroStore.id,
        onHand: Math.floor(p.stock * 0.6),
        available: Math.floor(p.stock * 0.6),
        reserved: 0,
        damaged: 0,
        reorderPoint: 10,
        maxStock: 60,
      },
    });

    // Create inventory transaction for Opening stock
    await prisma.inventoryTransaction.create({
      data: {
        productId: prod.id,
        storeId: flagshipStore.id,
        type: 'OPENING',
        quantity: p.stock,
        balanceAfter: p.stock,
        unitCost: p.cost,
        reason: 'Initial system stock intake',
        userId: createdUsers['INVENTORY_MANAGER'].id,
      },
    });

    // Create Batch for perishables (some with near expiry to trigger alerts!)
    if (p.perish) {
      const now = new Date();
      // If days <= 5, expire in 3 days (triggering urgent warning)
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + (p.days <= 5 ? 3 : p.days));

      await prisma.stockBatch.create({
        data: {
          productId: prod.id,
          storeId: flagshipStore.id,
          batchNumber: `B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          manufacturingDate: new Date(Date.now() - 7 * 86400000),
          expiryDate,
          costPrice: p.cost,
          receivedQty: p.stock,
          currentQty: p.stock,
          status: 'ACTIVE',
        },
      });
    }
  }

  console.log(`✅ Seeded ${createdProducts.length} products with stock and inventory transactions.`);

  // 9. 50 Realistic Customers
  const customerNames = [
    { name: 'Oliver Smith', phone: '0412 101 202', email: 'oliver.smith@gmail.com', tier: 'VIP', points: 1450, spend: 2840.50 },
    { name: 'Charlotte Brown', phone: '0412 202 303', email: 'charlotte.b@outlook.com', tier: 'GOLD', points: 920, spend: 1820.00 },
    { name: 'Jack Wilson', phone: '0412 303 404', email: 'jwilson@yahoo.com', tier: 'SILVER', points: 410, spend: 810.20 },
    { name: 'Amelia Taylor', phone: '0412 404 505', email: 'amelia.t@gmail.com', tier: 'BRONZE', points: 150, spend: 320.00 },
    { name: 'William Jones', phone: '0412 505 606', email: 'wjones@hotmail.com', tier: 'GOLD', points: 880, spend: 1750.40 },
    { name: 'Mia White', phone: '0412 606 707', email: 'mia.white@gmail.com', tier: 'VIP', points: 1620, spend: 3100.00 },
    { name: 'Thomas Martin', phone: '0412 707 808', email: 'tmartin@icloud.com', tier: 'BRONZE', points: 95, spend: 190.00 },
    { name: 'Isla Anderson', phone: '0412 808 909', email: 'isla.a@gmail.com', tier: 'SILVER', points: 340, spend: 690.50 },
    { name: 'Lucas Harris', phone: '0412 909 010', email: 'lucas.h@gmail.com', tier: 'GOLD', points: 760, spend: 1520.00 },
    { name: 'Sophie Clark', phone: '0413 010 111', email: 'sophie.c@live.com', tier: 'BRONZE', points: 120, spend: 240.00 },
    { name: 'Noah Lewis', phone: '0413 111 222', email: 'noah.lewis@gmail.com', tier: 'VIP', points: 2100, spend: 4200.00 },
    { name: 'Ava Robinson', phone: '0413 222 333', email: 'ava.r@outlook.com', tier: 'SILVER', points: 510, spend: 1020.00 },
    { name: 'Ethan Walker', phone: '0413 333 444', email: 'ethan.w@gmail.com', tier: 'BRONZE', points: 80, spend: 160.00 },
    { name: 'Grace Hall', phone: '0413 444 555', email: 'grace.hall@gmail.com', tier: 'GOLD', points: 830, spend: 1660.00 },
    { name: 'Henry Allen', phone: '0413 555 666', email: 'henry.a@yahoo.com', tier: 'SILVER', points: 430, spend: 860.00 },
    { name: 'Chloe Young', phone: '0413 666 777', email: 'chloe.y@gmail.com', tier: 'VIP', points: 1350, spend: 2700.00 },
    { name: 'Alexander King', phone: '0413 777 888', email: 'aking@gmail.com', tier: 'BRONZE', points: 60, spend: 120.00 },
    { name: 'Ella Wright', phone: '0413 888 999', email: 'ella.wright@icloud.com', tier: 'GOLD', points: 940, spend: 1880.00 },
    { name: 'James Scott', phone: '0413 999 000', email: 'james.scott@gmail.com', tier: 'SILVER', points: 390, spend: 780.00 },
    { name: 'Zoe Green', phone: '0414 000 111', email: 'zoe.green@gmail.com', tier: 'VIP', points: 1780, spend: 3560.00 },
    { name: 'Benjamin Baker', phone: '0414 111 222', email: 'bbaker@outlook.com', tier: 'BRONZE', points: 45, spend: 90.00 },
    { name: 'Emily Adams', phone: '0414 222 333', email: 'emily.adams@gmail.com', tier: 'GOLD', points: 810, spend: 1620.00 },
    { name: 'Mason Nelson', phone: '0414 333 444', email: 'mason.n@yahoo.com', tier: 'SILVER', points: 470, spend: 940.00 },
    { name: 'Harper Carter', phone: '0414 444 555', email: 'harper.c@gmail.com', tier: 'BRONZE', points: 110, spend: 220.00 },
    { name: 'Liam Mitchell', phone: '0414 555 666', email: 'lmitchell@gmail.com', tier: 'VIP', points: 1950, spend: 3900.00 },
    { name: 'Evelyn Perez', phone: '0414 666 777', email: 'evelyn.perez@gmail.com', tier: 'GOLD', points: 870, spend: 1740.00 },
    { name: 'Samuel Roberts', phone: '0414 777 888', email: 'sroberts@hotmail.com', tier: 'SILVER', points: 360, spend: 720.00 },
    { name: 'Abigail Turner', phone: '0414 888 999', email: 'abigail.t@gmail.com', tier: 'BRONZE', points: 90, spend: 180.00 },
    { name: 'Daniel Phillips', phone: '0414 999 000', email: 'dphillips@gmail.com', tier: 'GOLD', points: 790, spend: 1580.00 },
    { name: 'Victoria Campbell', phone: '0415 000 111', email: 'victoria.c@gmail.com', tier: 'VIP', points: 1540, spend: 3080.00 },
    { name: 'Matthew Parker', phone: '0415 111 222', email: 'mparker@outlook.com', tier: 'BRONZE', points: 70, spend: 140.00 },
    { name: 'Penelope Evans', phone: '0415 222 333', email: 'penelope.e@gmail.com', tier: 'SILVER', points: 420, spend: 840.00 },
    { name: 'Jackson Edwards', phone: '0415 333 444', email: 'jedwards@gmail.com', tier: 'GOLD', points: 910, spend: 1820.00 },
    { name: 'Riley Collins', phone: '0415 444 555', email: 'riley.c@yahoo.com', tier: 'VIP', points: 1680, spend: 3360.00 },
    { name: 'Aria Stewart', phone: '0415 555 666', email: 'aria.stewart@gmail.com', tier: 'BRONZE', points: 55, spend: 110.00 },
    { name: 'Sebastian Sanchez', phone: '0415 666 777', email: 'ssanchez@icloud.com', tier: 'SILVER', points: 380, spend: 760.00 },
    { name: 'Lily Morris', phone: '0415 777 888', email: 'lily.morris@gmail.com', tier: 'GOLD', points: 860, spend: 1720.00 },
    { name: 'Aiden Rogers', phone: '0415 888 999', email: 'arogers@gmail.com', tier: 'BRONZE', points: 130, spend: 260.00 },
    { name: 'Aubrey Reed', phone: '0415 999 000', email: 'aubrey.reed@gmail.com', tier: 'VIP', points: 2200, spend: 4400.00 },
    { name: 'Logan Cook', phone: '0416 000 111', email: 'logan.cook@hotmail.com', tier: 'SILVER', points: 490, spend: 980.00 },
    { name: 'Madelyn Morgan', phone: '0416 111 222', email: 'mmorgan@gmail.com', tier: 'GOLD', points: 740, spend: 1480.00 },
    { name: 'David Bell', phone: '0416 222 333', email: 'david.bell@gmail.com', tier: 'BRONZE', points: 85, spend: 170.00 },
    { name: 'Layla Murphy', phone: '0416 333 444', email: 'layla.m@yahoo.com', tier: 'VIP', points: 1890, spend: 3780.00 },
    { name: 'Joseph Bailey', phone: '0416 444 555', email: 'jbailey@gmail.com', tier: 'SILVER', points: 410, spend: 820.00 },
    { name: 'Nora Rivera', phone: '0416 555 666', email: 'nora.rivera@gmail.com', tier: 'BRONZE', points: 65, spend: 130.00 },
    { name: 'Luke Cooper', phone: '0416 666 777', email: 'luke.cooper@gmail.com', tier: 'GOLD', points: 960, spend: 1920.00 },
    { name: 'Hazel Richardson', phone: '0416 777 888', email: 'hazel.r@outlook.com', tier: 'VIP', points: 1420, spend: 2840.00 },
    { name: 'Anthony Cox', phone: '0416 888 999', email: 'anthony.cox@gmail.com', tier: 'SILVER', points: 350, spend: 700.00 },
    { name: 'Stella Howard', phone: '0416 999 000', email: 'stella.h@gmail.com', tier: 'BRONZE', points: 105, spend: 210.00 },
    { name: 'Dylan Ward', phone: '0417 000 111', email: 'dylan.ward@gmail.com', tier: 'GOLD', points: 820, spend: 1640.00 },
  ];

  const createdCustomers: any[] = [];
  let memCounter = 1001;
  for (const c of customerNames) {
    const cust = await prisma.customer.create({
      data: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        membershipNo: `MEM-${memCounter++}`,
        loyaltyTier: c.tier,
        pointsBalance: c.points,
        totalSpending: c.spend,
        customerType: c.spend > 2500 ? 'VIP' : 'REGULAR',
        receiptPreference: 'PRINT',
      },
    });
    createdCustomers.push(cust);
  }

  console.log(`💳 Seeded ${createdCustomers.length} registered loyalty customers.`);

  // 10. Promotions & Coupons
  const promo1 = await prisma.promotion.create({
    data: {
      name: 'Dairy Milk 2L BOGO Special',
      code: 'BOGO-MILK',
      type: 'BUY_X_GET_Y',
      value: 7.0, // 2 for $7
      buyQty: 2,
      getQty: 0,
      startDate: new Date(Date.now() - 7 * 86400000),
      endDate: new Date(Date.now() + 30 * 86400000),
      isActive: true,
      usageLimit: 500,
      usageCount: 14,
    },
  });

  const promo2 = await prisma.promotion.create({
    data: {
      name: 'Bakery Super Hour 20% Off',
      code: 'BAKE20',
      type: 'PERCENTAGE',
      value: 20.0,
      minSpend: 15.0,
      startDate: new Date(Date.now() - 14 * 86400000),
      endDate: new Date(Date.now() + 60 * 86400000),
      isActive: true,
      usageLimit: 1000,
      usageCount: 38,
    },
  });

  const promo3 = await prisma.promotion.create({
    data: {
      name: 'Welcome Voucher $5 Off',
      code: 'WELCOME5',
      type: 'FIXED',
      value: 5.0,
      minSpend: 30.0,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 90 * 86400000),
      isActive: true,
      usageLimit: 200,
      usageCount: 52,
    },
  });

  console.log('🏷️ Created promotional campaigns & coupons.');

  // 11. Initial Expenses
  await prisma.expense.create({
    data: {
      storeId: flagshipStore.id,
      userId: createdUsers['STORE_MANAGER'].id,
      category: 'UTILITIES',
      amount: 450.0,
      description: 'Monthly commercial refrigeration electricity tariff',
      paymentMethod: 'BANK_TRANSFER',
    },
  });

  await prisma.expense.create({
    data: {
      storeId: flagshipStore.id,
      userId: createdUsers['STORE_MANAGER'].id,
      category: 'PACKAGING',
      amount: 180.0,
      description: 'Thermal receipt paper rolls (80mm x 50 rolls) and paper shopping bags',
      paymentMethod: 'CARD',
    },
  });

  // 12. Sample Completed Sale (to show on reports right away)
  const sampleSale = await prisma.sale.create({
    data: {
      receiptNumber: 'RCP-2026-0001',
      invoiceNumber: 'INV-2026-0001',
      storeId: flagshipStore.id,
      registerId: reg1.id,
      shiftId: activeShift.id,
      userId: createdUsers['CASHIER'].id,
      customerId: createdCustomers[0].id,
      subtotal: 22.80,
      itemDiscount: 0.0,
      orderDiscount: 1.00,
      taxAmount: 2.08,
      rounding: 0.0,
      grandTotal: 23.88,
      totalCost: 13.50,
      grossProfit: 10.38,
      amountPaid: 25.00,
      changeGiven: 1.12,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      notes: 'Customer scanned loyalty barcode',
      createdAt: new Date(Date.now() - 2 * 3600000),
    },
  });

  // Sale items
  await prisma.saleItem.create({
    data: {
      saleId: sampleSale.id,
      productId: createdProducts[0].id, // Milk
      productName: createdProducts[0].name,
      sku: createdProducts[0].sku,
      barcode: createdProducts[0].barcode,
      unitPrice: createdProducts[0].sellingPrice,
      costPrice: createdProducts[0].costPrice,
      quantity: 2,
      subtotal: 7.60,
      taxRate: 10.0,
      taxAmount: 0.69,
      total: 7.60,
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sampleSale.id,
      productId: createdProducts[10].id, // Coca-Cola
      productName: createdProducts[10].name,
      sku: createdProducts[10].sku,
      barcode: createdProducts[10].barcode,
      unitPrice: createdProducts[10].sellingPrice,
      costPrice: createdProducts[10].costPrice,
      quantity: 1,
      subtotal: 3.50,
      taxRate: 10.0,
      taxAmount: 0.32,
      total: 3.50,
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sampleSale.id,
      productId: createdProducts[22].id, // Tip Top Bread
      productName: createdProducts[22].name,
      sku: createdProducts[22].sku,
      barcode: createdProducts[22].barcode,
      unitPrice: createdProducts[22].sellingPrice,
      costPrice: createdProducts[22].costPrice,
      quantity: 3,
      subtotal: 11.70,
      taxRate: 10.0,
      taxAmount: 1.06,
      total: 11.70,
    },
  });

  // Payment
  await prisma.payment.create({
    data: {
      saleId: sampleSale.id,
      method: 'CASH',
      amount: 23.88,
      tendered: 25.00,
      change: 1.12,
      status: 'SUCCESS',
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: createdUsers['CASHIER'].id,
      action: 'SALE',
      module: 'POS',
      details: 'Completed Sale #RCP-2026-0001 for $23.88 via Cash',
      storeId: flagshipStore.id,
    },
  });

  // 13. System Settings
  const settingsData = [
    { key: 'STORE_NAME', value: 'NexaMart Flagship Superstore', category: 'GENERAL', description: 'Store trading name' },
    { key: 'CURRENCY', value: 'AUD', category: 'GENERAL', description: 'Base store currency' },
    { key: 'CURRENCY_SYMBOL', value: '$', category: 'GENERAL', description: 'Currency symbol' },
    { key: 'TAX_NAME', value: 'GST', category: 'TAX', description: 'Tax regime name' },
    { key: 'TAX_RATE', value: '10.0', category: 'TAX', description: 'Default tax percentage' },
    { key: 'TAX_INCLUSIVE', value: 'true', category: 'TAX', description: 'Prices display inclusive of tax' },
    { key: 'RECEIPT_HEADER', value: 'NexaMart Flagship Superstore\n250 Elizabeth Street, Melbourne VIC\nPhone: +61 3 9876 5432\nABN: 88 123 456 789', category: 'RECEIPT', description: 'Thermal receipt header' },
    { key: 'RECEIPT_FOOTER', value: 'Thank you for shopping at NexaMart!\nPlease retain your receipt for refunds within 14 days.\nVisit us online at www.nexamart.com.au', category: 'RECEIPT', description: 'Thermal receipt footer text' },
    { key: 'LOW_STOCK_THRESHOLD', value: '10', category: 'INVENTORY', description: 'Default threshold for low stock alerts' },
    { key: 'ALLOW_NEGATIVE_STOCK', value: 'false', category: 'INVENTORY', description: 'Disallow checkout if stock is insufficient' },
  ];

  for (const s of settingsData) {
    await prisma.setting.create({ data: s });
  }

  console.log('⚙️ Seeded system and receipt settings.');
  console.log('🎉 NexaMart Management seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
