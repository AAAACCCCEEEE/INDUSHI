// INDUSHI Data Module
export const INDUSHI_DATA = {
  categories: [
    { id: 'all', name: 'All Menu' },
    { id: 'signatures', name: '🔥 Signature Rolls' },
    { id: 'main', name: '🍱 Fusion Mains' },
    { id: 'appetizers', name: '🥟 Appetizers' },
    { id: 'beverages', name: '🍹 Refreshing Drinks' },
    { id: 'vegan', name: '🌱 Plant-Based (Vegan)' }
  ],

  products: [
    {
      id: 'prod-1',
      name: 'Rendang Aburi Supreme Roll',
      category: 'signatures',
      description: 'Slow-braised 12hr beef rendang wrapped in seasoned uduk rice, flame-torched with coconut rendang reduction & crispy potato flakes.',
      price: 68000,
      formattedPrice: 'IDR 68,000',
      spiceLevel: 3,
      isCooked: true,
      cookingStyle: 'Flame-Torched Aburi',
      badge: 'Bestseller',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      ingredients: ['12hr Beef Rendang', 'Nasi Uduk', 'Rendang Reduction', 'Crispy Potato Flakes', 'Kaffir Lime']
    },
    {
      id: 'prod-2',
      name: 'Ayam Geprek Mozza Roll',
      category: 'signatures',
      description: 'Crispy garlic fried chicken roll with authentic Indonesian chili crunch, topped with melted torched mozzarella cheese.',
      price: 58000,
      formattedPrice: 'IDR 58,000',
      spiceLevel: 5,
      isCooked: true,
      cookingStyle: 'Flame-Torched Aburi',
      badge: 'Super Spicy 🔥',
      image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Garlic Crispy Chicken', 'Sambal Geprek', 'Torched Mozzarella', 'Cucumber', 'Nori']
    },
    {
      id: 'prod-3',
      name: 'Sambal Matah Bali Salmon Roll',
      category: 'signatures',
      description: 'Fully cooked pan-seared salmon roll topped with fresh Balinese lemongrass, kaffir lime leaves, shallots & extra virgin coconut oil.',
      price: 75000,
      formattedPrice: 'IDR 75,000',
      spiceLevel: 3,
      isCooked: true,
      cookingStyle: 'Warm Glazed',
      badge: 'Chef Choice',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Cooked Salmon', 'Fresh Sambal Matah', 'Coconut Oil', 'Toasted Serundeng', 'Sushi Rice']
    },
    {
      id: 'prod-4',
      name: 'Sate Maranggi Sweet Glaze Roll',
      category: 'signatures',
      description: 'Smoky grilled tenderloin skewers flavor infused roll with sweet aromatic soy glaze, crushed shallots & fresh green chili.',
      price: 65000,
      formattedPrice: 'IDR 65,000',
      spiceLevel: 2,
      isCooked: true,
      cookingStyle: '100% Cooked',
      badge: 'Popular',
      image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Maranggi Beef', 'Sweet Soy Glaze', 'Shallots', 'Green Chili', 'Nasi Uduk']
    },
    {
      id: 'prod-5',
      name: 'Nasi Uduk Soft-Shell Crab Roll',
      category: 'main',
      description: 'Fragrant coconut rice roll featuring crispy soft-shell crab, wrapped in nori and drizzled with spicy sambal terasi aioli.',
      price: 72000,
      formattedPrice: 'IDR 72,000',
      spiceLevel: 3,
      isCooked: true,
      cookingStyle: '100% Cooked',
      badge: 'Signature Fusion',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Crispy Soft Shell Crab', 'Nasi Uduk Base', 'Sambal Terasi Aioli', 'Cucumber', 'Emping Crumble']
    },
    {
      id: 'prod-6',
      name: 'Balado Smoked Duck Roll',
      category: 'main',
      description: 'Tender smoked duck breast with Padang red balado chili glaze, cucumber crunch and toasted crispy onion.',
      price: 78000,
      formattedPrice: 'IDR 78,000',
      spiceLevel: 4,
      isCooked: true,
      cookingStyle: 'Flame-Torched Aburi',
      badge: 'Spicy & Smoky',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Smoked Duck', 'Red Balado Chili', 'Cucumber', 'Crispy Onion', 'Sushi Rice']
    },
    {
      id: 'prod-7',
      name: 'Tempeh Bacem Sweet Soy Roll',
      category: 'vegan',
      description: 'Braised sweet soy coriander tempeh, fresh avocado, toasted sesame seeds and sweet soy shallot dip.',
      price: 42000,
      formattedPrice: 'IDR 42,000',
      spiceLevel: 1,
      isCooked: true,
      cookingStyle: '100% Cooked',
      badge: '100% Vegan',
      image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Tempeh Bacem', 'Avocado', 'Toasted Sesame', 'Nasi Kuning Base', 'Sambal Kecap']
    },
    {
      id: 'prod-8',
      name: 'Gado-Gado Crunch Vegan Roll',
      category: 'vegan',
      description: 'Crispy tempeh, blanched spinach, bean sprouts, wrapped in turmeric rice with rich aromatic peanut satay reduction.',
      price: 45000,
      formattedPrice: 'IDR 45,000',
      spiceLevel: 1,
      isCooked: true,
      cookingStyle: '100% Cooked',
      badge: '100% Vegan',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Crispy Tempeh', 'Blanched Vegetables', 'Nasi Kuning Base', 'Peanut Sauce', 'Krupuk Chips']
    },
    {
      id: 'prod-9',
      name: 'Tahu Kipas Tempura Bites',
      category: 'appetizers',
      description: 'Stuffed Indonesian tofu loaded with minced vegetables, fried in light crisp Japanese tempura batter with sweet chili sambal.',
      price: 35000,
      formattedPrice: 'IDR 35,000',
      spiceLevel: 2,
      isCooked: true,
      cookingStyle: '100% Cooked',
      badge: 'Starter',
      image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Stuffed Tofu', 'Tempura Batter', 'Sweet Chili Dip', 'Spring Onion']
    },
    {
      id: 'prod-10',
      name: 'Crispy Chicken Skin with Sambal Roa',
      category: 'appetizers',
      description: 'Golden extra-crispy seasoned chicken skin served with authentic Manado smoked fish chili dip (Sambal Roa).',
      price: 38000,
      formattedPrice: 'IDR 38,000',
      spiceLevel: 4,
      isCooked: true,
      cookingStyle: '100% Cooked',
      badge: 'Addictive Snacks',
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Crispy Chicken Skin', 'Sambal Roa', 'Kaffir Lime Leaf']
    },
    {
      id: 'prod-11',
      name: 'Es Cendol Matcha Fusion',
      category: 'beverages',
      description: 'Creamy coconut milk, organic palm sugar syrup, traditional pandan cendol jelly topped with Uji Matcha green tea float.',
      price: 32000,
      formattedPrice: 'IDR 32,000',
      spiceLevel: 0,
      isCooked: false,
      cookingStyle: 'Cold Beverage',
      badge: 'Signature Drink',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Pandan Cendol', 'Coconut Milk', 'Gula Aren Palm Sugar', 'Matcha Cream']
    },
    {
      id: 'prod-12',
      name: 'Es Bir Pletok Craft Fizz',
      category: 'beverages',
      description: 'Refreshing carbonated mocktail crafted with Betawi ginger, lemongrass, secang wood, cardamom & fresh squeezed lime.',
      price: 28000,
      formattedPrice: 'IDR 28,000',
      spiceLevel: 0,
      isCooked: false,
      cookingStyle: 'Cold Beverage',
      badge: 'Heritage Craft',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      ingredients: ['Herbal Ginger Extract', 'Secang Wood', 'Lime Juice', 'Sparkling Water']
    }
  ],

  customBuilderOptions: {
    bases: [
      { id: 'b1', name: 'Nasi Uduk (Fragrant Coconut Rice)', price: 10000, description: 'Infused with coconut milk & lemongrass' },
      { id: 'b2', name: 'Nasi Kuning (Turmeric Herbal Rice)', price: 10000, description: 'Fragrant turmeric & pandan leaf aroma' },
      { id: 'b3', name: 'Traditional Seasoned Sushi Rice', price: 8000, description: 'Classic Japanese vinegared rice' },
      { id: 'b4', name: 'Nasi Merah (Organic Red Rice)', price: 12000, description: 'Healthy high-fiber red rice base' }
    ],
    proteins: [
      { id: 'p1', name: '12hr Braised Beef Rendang', price: 30000, description: 'Tender caramelized Sumatra spiced beef' },
      { id: 'p2', name: 'Ayam Geprek Crispy Chicken', price: 24000, description: 'Garlic seasoned crispy golden chicken' },
      { id: 'p3', name: 'Cooked Salmon Sambal Glazed', price: 34000, description: 'Pan-seared juicy salmon fillet' },
      { id: 'p4', name: 'Smoked Duck Balado', price: 32000, description: 'Aromatic wood-smoked duck breast' },
      { id: 'p5', name: 'Tempeh Bacem & Tofu (Vegan)', price: 18000, description: 'Sweet coriander braised tempeh' }
    ],
    fillings: [
      { id: 'f1', name: 'Crispy Potato Flakes (Kentang Kering)', price: 4000 },
      { id: 'f2', name: 'Melted Mozzarella Cheese', price: 6000 },
      { id: 'f3', name: 'Fresh Cucumber & Avocado Strips', price: 5000 },
      { id: 'f4', name: 'Japanese Tamago Egg Omelette', price: 5000 },
      { id: 'f5', name: 'Toasted Coconut Serundeng', price: 4000 }
    ],
    toppings: [
      { id: 't1', name: 'Sambal Matah Bali (Fresh Chili & Shallot)', price: 6000, spiceLevel: 3 },
      { id: 't2', name: 'Rendang Reduction Glaze', price: 6000, spiceLevel: 2 },
      { id: 't3', name: 'Mentai Sambal Hijau (Green Chili Cream)', price: 7000, spiceLevel: 4 },
      { id: 't4', name: 'Sambal Kecap Sweet Soy & Shallots', price: 5000, spiceLevel: 1 },
      { id: 't5', name: 'Spicy Sambal Roa Smoked Fish Dip', price: 8000, spiceLevel: 5 }
    ],
    torchLevels: [
      { id: 'l1', name: 'Warm Glazed (Signature)', extra: 0 },
      { id: 'l2', name: 'Flame-Torched Aburi (Extra Smoky & Melted)', extra: 3000 }
    ]
  },

  cateringPlatters: [
    {
      id: 'plat-1',
      name: 'Mini Tumpeng INDUSHI Sushi Tower',
      pax: '10 - 12 Pax',
      rollsCount: '48 Pieces (4 Signature Varieties)',
      price: 480000,
      formattedPrice: 'IDR 480,000',
      popularFor: 'Small Office Lunches & Family Birthdays',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      includes: ['12x Rendang Aburi Roll', '12x Ayam Geprek Mozza Roll', '12x Sambal Matah Salmon', '12x Tempeh Bacem Roll', 'Includes Sambal Dips & Festive Packaging']
    },
    {
      id: 'plat-2',
      name: 'Pesta Nusantara Platter Tower',
      pax: '20 - 25 Pax',
      rollsCount: '96 Pieces (6 Fusion Varieties)',
      price: 890000,
      formattedPrice: 'IDR 890,000',
      popularFor: 'Corporate Meetings, Celebrations & Gathering Events',
      image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80',
      includes: ['24x Rendang Aburi Roll', '24x Ayam Geprek Mozza Roll', '16x Sambal Matah Salmon', '16x Sate Maranggi Roll', '16x Soft-Shell Crab Roll', 'Festive Tumpeng Tower Tier Setup']
    },
    {
      id: 'plat-3',
      name: 'Grand Royal INDUSHI Celebration Tower',
      pax: '40 - 50 Pax',
      rollsCount: '192 Pieces + Side Appetizer Trays',
      price: 1680000,
      formattedPrice: 'IDR 1,680,000',
      popularFor: 'Weddings, Grand Corporate Functions & Banquets',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
      includes: ['Full Custom Roll Selection (All 8 Varieties)', '2 Trays of Tahu Kipas Tempura', '2 Trays of Crispy Chicken Skin', 'Dedicated On-Site Flame Torching Station Service Option']
    }
  ],

  testimonials: [
    {
      id: 'rev-1',
      name: 'Reza Rahardian',
      role: 'Creative Director & Food Enthusiast',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      comment: 'As someone who loves spicy Indonesian food but gets tired of messy nasi box catering, INDUSHI is a game changer! The Rendang Aburi Roll is out of this world!'
    },
    {
      id: 'rev-2',
      name: 'Sarah Amalia',
      role: 'Office Manager at Tech Hub Jakarta',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      comment: 'We ordered the Pesta Nusantara Platter Tower for our quarterly team meeting. Clean, easy to pick up, and everyone loved the warm Sambal Matah salmon rolls!'
    },
    {
      id: 'rev-3',
      name: 'Michael & Jessica Tan',
      role: 'Food Vloggers & Culinary Tourists',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      comment: '100% cooked and served warm with real flame-torched cheese and chili glazes! INDUSHI proves that fusion food can be deeply authentic and delicious.'
    }
  ]
};
