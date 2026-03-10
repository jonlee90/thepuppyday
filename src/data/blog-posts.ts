/**
 * Blog post metadata for SEO Phase 5
 * All 12 blog posts with complete metadata for the blog infrastructure.
 * Actual article content lives in individual page files under src/app/(marketing)/blog/
 */

export interface BlogPostMeta {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishDate: string;
  author: string;
  readTime: string;
  excerpt: string;
  keywords: string[];
  relatedPostSlugs: string[];
  relatedServiceSlugs: string[];
  featuredImageAlt: string;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'dog-grooming-cost-la-mirada',
    title: 'How Much Does Dog Grooming Cost in La Mirada?',
    metaTitle: 'Dog Grooming Cost in La Mirada, CA | Puppy Day Pricing Guide',
    metaDescription:
      'Wondering how much dog grooming costs in La Mirada, CA? Learn about bath, haircut, and breed-specific styling prices at Puppy Day. Transparent pricing for all dog sizes.',
    publishDate: '2026-01-15',
    author: 'Puppy Day Team',
    readTime: '6 min read',
    excerpt:
      'Dog grooming prices in La Mirada vary by service type, dog size, and coat condition. From a basic bath to a full breed-specific style, we break down exactly what you can expect to pay at Puppy Day and why professional grooming is worth every penny.',
    keywords: [
      'dog grooming cost La Mirada',
      'how much does dog grooming cost',
      'dog grooming prices La Mirada CA',
      'pet grooming prices',
      'dog bath cost',
      'dog haircut price',
    ],
    relatedPostSlugs: ['goldendoodle-grooming-guide', 'signs-dog-needs-grooming'],
    relatedServiceSlugs: ['dog-bath', 'dog-haircut', 'breed-specific-styling'],
    featuredImageAlt: 'Friendly groomer pricing consultation at Puppy Day in La Mirada',
  },
  {
    slug: 'goldendoodle-grooming-guide',
    title: 'The Complete Goldendoodle Grooming Guide',
    metaTitle: 'Goldendoodle Grooming Guide: Styles, Tips & Frequency | Puppy Day',
    metaDescription:
      'Everything you need to know about grooming your Goldendoodle. Popular haircut styles, how often to groom, and professional tips from Puppy Day in La Mirada, CA.',
    publishDate: '2026-01-22',
    author: 'Puppy Day Team',
    readTime: '7 min read',
    excerpt:
      'Goldendoodles are one of the most popular breeds in Southern California — and one of the most grooming-intensive. Our complete guide covers the best haircut styles like the teddy bear and puppy cut, how often your Doodle needs professional grooming, and how to keep their curly coat tangle-free between appointments.',
    keywords: [
      'goldendoodle grooming',
      'goldendoodle haircut styles',
      'goldendoodle teddy bear cut',
      'how often to groom goldendoodle',
      'goldendoodle grooming La Mirada',
      'doodle grooming guide',
    ],
    relatedPostSlugs: ['dog-grooming-cost-la-mirada', 'first-puppy-grooming-appointment'],
    relatedServiceSlugs: ['breed-specific-styling', 'deshedding', 'dog-bath'],
    featuredImageAlt: 'Fluffy Goldendoodle with a fresh teddy bear cut at Puppy Day grooming salon',
  },
  {
    slug: 'signs-dog-needs-grooming',
    title: '7 Signs Your Dog Needs Grooming Now',
    metaTitle: '7 Signs Your Dog Needs Grooming | Puppy Day La Mirada',
    metaDescription:
      'Is your dog overdue for grooming? Learn the 7 clear warning signs — from matted fur to overgrown nails — that tell you it\'s time to book an appointment at Puppy Day.',
    publishDate: '2026-01-29',
    author: 'Puppy Day Team',
    readTime: '5 min read',
    excerpt:
      'Most dog owners wait too long between grooming appointments. Matted fur, clicking nails, and a musty smell are all signs your pup is overdue. Here are 7 telltale signals your dog needs professional grooming — and why catching them early prevents bigger problems.',
    keywords: [
      'signs dog needs grooming',
      'when to groom your dog',
      'dog grooming frequency',
      'matted dog fur',
      'dog overdue for grooming',
      'pet grooming signs La Mirada',
    ],
    relatedPostSlugs: ['dog-grooming-cost-la-mirada', 'spring-deshedding-guide'],
    relatedServiceSlugs: ['dog-bath', 'nail-trimming', 'deshedding'],
    featuredImageAlt: 'Matted dog coat before professional grooming at Puppy Day',
  },
  {
    slug: 'spring-deshedding-guide',
    title: 'Spring Deshedding Guide for Southern California Dogs',
    metaTitle: 'Spring Deshedding for Dogs in SoCal | Puppy Day La Mirada',
    metaDescription:
      'Spring shedding season is intense in Southern California. Learn how professional deshedding treatments at Puppy Day in La Mirada can reduce your dog\'s shedding by up to 80%.',
    publishDate: '2026-02-05',
    author: 'Puppy Day Team',
    readTime: '6 min read',
    excerpt:
      'SoCal dogs experience a major coat blow-out every spring, leaving fur on every surface in your home. A professional deshedding treatment can dramatically reduce shedding, improve your dog\'s coat health, and make life cleaner for everyone. Here\'s everything you need to know about spring deshedding.',
    keywords: [
      'dog deshedding La Mirada',
      'spring dog shedding Southern California',
      'deshedding treatment for dogs',
      'dog shedding season SoCal',
      'professional deshedding grooming',
      'reduce dog shedding',
    ],
    relatedPostSlugs: ['signs-dog-needs-grooming', 'summer-dog-grooming-guide'],
    relatedServiceSlugs: ['deshedding', 'dog-bath', 'dog-haircut'],
    featuredImageAlt: 'Dog undergoing professional deshedding treatment at Puppy Day in La Mirada',
  },
  {
    slug: 'first-puppy-grooming-appointment',
    title: "Your Puppy's First Grooming Appointment: What to Expect",
    metaTitle: "First Puppy Grooming Appointment Guide | Puppy Day La Mirada",
    metaDescription:
      "Is your puppy ready for their first grooming appointment? Learn when to start, how to prepare, and what happens at Puppy Day's gentle puppy grooming sessions in La Mirada.",
    publishDate: '2026-02-12',
    author: 'Puppy Day Team',
    readTime: '5 min read',
    excerpt:
      "A puppy's first grooming experience sets the tone for a lifetime of positive salon visits. At Puppy Day, we specialize in gentle introductory grooming for young dogs — from their first bath to their first trim. Here's what to expect and how to prepare your pup for a stress-free appointment.",
    keywords: [
      'first puppy grooming appointment',
      'when to groom a puppy for the first time',
      'puppy grooming La Mirada',
      'puppy first bath grooming',
      'gentle puppy grooming',
      'how to prepare puppy for grooming',
    ],
    relatedPostSlugs: ['goldendoodle-grooming-guide', 'signs-dog-needs-grooming'],
    relatedServiceSlugs: ['dog-bath', 'dog-haircut', 'breed-specific-styling'],
    featuredImageAlt: 'Young puppy enjoying their first gentle grooming session at Puppy Day',
  },
  {
    slug: 'dog-friendly-parks-la-mirada',
    title: 'Best Dog-Friendly Parks Near La Mirada, CA',
    metaTitle: 'Best Dog-Friendly Parks Near La Mirada, CA | Puppy Day Blog',
    metaDescription:
      'Discover the best dog-friendly parks, trails, and outdoor spaces near La Mirada, CA. Perfect for your freshly groomed pup to explore and socialize.',
    publishDate: '2026-02-19',
    author: 'Puppy Day Team',
    readTime: '4 min read',
    excerpt:
      "La Mirada and its surrounding cities have some of Orange County and LA County's best spots for dogs to run, sniff, and socialize. Whether you're looking for an off-leash dog park or a scenic trail, we've rounded up the top dog-friendly destinations near our grooming salon.",
    keywords: [
      'dog friendly parks La Mirada',
      'dog parks near La Mirada CA',
      'dog friendly trails Norwalk',
      'best dog parks Los Angeles County',
      'dog friendly outdoor spots SoCal',
      'La Mirada dog activities',
    ],
    relatedPostSlugs: ['signs-dog-needs-grooming', 'spring-deshedding-guide'],
    relatedServiceSlugs: ['dog-bath', 'deshedding'],
    featuredImageAlt: 'Happy dog running at a dog-friendly park near La Mirada California',
  },
  {
    slug: 'french-bulldog-grooming',
    title: 'French Bulldog Grooming: The Complete Care Guide',
    metaTitle: 'French Bulldog Grooming Guide | Puppy Day La Mirada',
    metaDescription:
      "French Bulldogs have unique grooming needs including skin fold care, short coat maintenance, and allergy-prone skin. Learn how Puppy Day's expert groomers care for your Frenchie.",
    publishDate: '2026-02-26',
    author: 'Puppy Day Team',
    readTime: '7 min read',
    excerpt:
      "Despite their short coats, French Bulldogs require more grooming attention than most people expect. From cleaning delicate skin folds to choosing hypoallergenic shampoos, Frenchie grooming is a specialty. Our guide covers everything you need to keep your French Bulldog comfortable, clean, and healthy.",
    keywords: [
      'French Bulldog grooming',
      'Frenchie grooming guide',
      'French Bulldog skin fold care',
      'French Bulldog grooming La Mirada',
      'short coat dog grooming',
      'French Bulldog bathing tips',
    ],
    relatedPostSlugs: ['hypoallergenic-dog-grooming', 'signs-dog-needs-grooming'],
    relatedServiceSlugs: ['dog-bath', 'breed-specific-styling', 'nail-trimming'],
    featuredImageAlt: 'French Bulldog receiving gentle grooming at Puppy Day salon in La Mirada',
  },
  {
    slug: 'hypoallergenic-dog-grooming',
    title: 'Hypoallergenic Dog Grooming: What It Means for Your Pet',
    metaTitle: 'Hypoallergenic Dog Grooming | Puppy Day La Mirada CA',
    metaDescription:
      'What does hypoallergenic grooming actually mean? Learn about allergy-safe shampoos, common irritants to avoid, and how Puppy Day protects sensitive dogs in La Mirada.',
    publishDate: '2026-03-05',
    author: 'Puppy Day Team',
    readTime: '6 min read',
    excerpt:
      "If your dog has sensitive skin, allergies, or a hypoallergenic coat, standard grooming products can cause irritation and discomfort. At Puppy Day, we use premium hypoallergenic shampoos and conditioners on every dog. Here's what that means and why it matters for your pet's health.",
    keywords: [
      'hypoallergenic dog grooming',
      'dog sensitive skin grooming',
      'allergy friendly dog shampoo',
      'hypoallergenic pet grooming La Mirada',
      'dog grooming sensitive skin',
      'natural dog grooming products',
    ],
    relatedPostSlugs: ['french-bulldog-grooming', 'poodle-grooming-guide'],
    relatedServiceSlugs: ['dog-bath', 'breed-specific-styling'],
    featuredImageAlt: 'Dog with sensitive skin receiving hypoallergenic grooming treatment at Puppy Day',
  },
  {
    slug: 'shih-tzu-haircut-styles',
    title: 'Popular Shih Tzu Haircut Styles and How to Choose',
    metaTitle: 'Shih Tzu Haircut Styles Guide | Puppy Day La Mirada',
    metaDescription:
      "From the practical puppy cut to the elegant top knot, explore popular Shih Tzu haircut styles. Puppy Day's expert groomers in La Mirada help you find the perfect look for your Shih Tzu.",
    publishDate: '2026-03-12',
    author: 'Puppy Day Team',
    readTime: '6 min read',
    excerpt:
      'Shih Tzus are known for their luxurious coats and endless styling possibilities. The right haircut depends on your lifestyle, your dog\'s activity level, and how much maintenance you want between visits. We cover the most popular Shih Tzu cuts — from the low-maintenance puppy cut to the show-stopping lion cut.',
    keywords: [
      'Shih Tzu haircut styles',
      'Shih Tzu puppy cut',
      'Shih Tzu grooming guide',
      'Shih Tzu grooming La Mirada',
      'best Shih Tzu haircuts',
      'Shih Tzu lion cut',
    ],
    relatedPostSlugs: ['poodle-grooming-guide', 'goldendoodle-grooming-guide'],
    relatedServiceSlugs: ['breed-specific-styling', 'dog-haircut', 'dog-bath'],
    featuredImageAlt: 'Shih Tzu with a fresh puppy cut groomed at Puppy Day in La Mirada',
  },
  {
    slug: 'dog-teeth-brushing-grooming',
    title: 'Dog Teeth Brushing: Why Dental Hygiene Matters at the Groomer',
    metaTitle: 'Dog Teeth Brushing at the Groomer | Puppy Day La Mirada',
    metaDescription:
      "Dog dental hygiene is often overlooked but critical for your pet's health. Learn about professional teeth brushing services at Puppy Day and how to maintain dental health at home.",
    publishDate: '2026-03-19',
    author: 'Puppy Day Team',
    readTime: '5 min read',
    excerpt:
      "Most dogs never get their teeth brushed — and it shows. Dental disease affects over 80% of dogs by age three. Adding a professional teeth brushing to your grooming routine is one of the easiest ways to protect your dog's health and avoid costly vet bills down the road.",
    keywords: [
      'dog teeth brushing grooming',
      'dog dental hygiene',
      'professional dog teeth cleaning grooming',
      'dog teeth brushing La Mirada',
      'dog oral health grooming',
      'pet dental care',
    ],
    relatedPostSlugs: ['signs-dog-needs-grooming', 'first-puppy-grooming-appointment'],
    relatedServiceSlugs: ['teeth-brushing', 'dog-bath'],
    featuredImageAlt: 'Professional dog teeth brushing add-on service at Puppy Day grooming salon',
  },
  {
    slug: 'summer-dog-grooming-guide',
    title: 'Summer Dog Grooming Guide for SoCal Pet Owners',
    metaTitle: 'Summer Dog Grooming Guide for SoCal | Puppy Day La Mirada',
    metaDescription:
      "Southern California summers are tough on dogs. Learn how to keep your dog cool, whether to shave their coat, and summer grooming tips from Puppy Day in La Mirada, CA.",
    publishDate: '2026-03-26',
    author: 'Puppy Day Team',
    readTime: '6 min read',
    excerpt:
      "Summer in SoCal means heat, sun, and outdoor adventures — all of which affect your dog's coat and skin. Should you shave your dog for the summer? How often should they be bathed? We answer the most common summer grooming questions for pet owners in the greater Los Angeles area.",
    keywords: [
      'summer dog grooming SoCal',
      'summer dog grooming tips',
      'should you shave your dog in summer',
      'dog grooming summer La Mirada',
      'keeping dog cool summer grooming',
      'summer pet care Southern California',
    ],
    relatedPostSlugs: ['spring-deshedding-guide', 'shih-tzu-haircut-styles'],
    relatedServiceSlugs: ['deshedding', 'dog-bath', 'dog-haircut'],
    featuredImageAlt: 'Happy dog with a summer grooming trim at Puppy Day in La Mirada CA',
  },
  {
    slug: 'poodle-grooming-guide',
    title: 'The Complete Poodle Grooming Guide: All Sizes & Cuts',
    metaTitle: 'Poodle Grooming Guide: Toy, Mini & Standard | Puppy Day La Mirada',
    metaDescription:
      'Poodles require regular professional grooming to keep their curly coats healthy and mat-free. Our complete guide covers all poodle sizes, popular cuts, and grooming frequency at Puppy Day.',
    publishDate: '2026-04-02',
    author: 'Puppy Day Team',
    readTime: '7 min read',
    excerpt:
      "Whether you have a Toy, Miniature, or Standard Poodle, keeping that iconic curly coat looking its best requires regular professional grooming. Poodles don't shed like other breeds, but their continuously growing coats need consistent maintenance to prevent matting and skin issues.",
    keywords: [
      'poodle grooming guide',
      'poodle haircut styles',
      'standard poodle grooming',
      'toy poodle grooming La Mirada',
      'poodle continental cut',
      'poodle puppy cut grooming',
    ],
    relatedPostSlugs: ['goldendoodle-grooming-guide', 'shih-tzu-haircut-styles'],
    relatedServiceSlugs: ['breed-specific-styling', 'dog-haircut', 'dog-bath'],
    featuredImageAlt: 'Elegant poodle with a fresh professional groom at Puppy Day in La Mirada',
  },
];

/**
 * Get a single blog post by its slug.
 * Returns undefined if not found.
 */
export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
