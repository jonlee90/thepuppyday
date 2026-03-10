import type { CitySlug } from '@/data/cities';

export type CityContent = {
  introText: string[];
  whyChooseUs: string[];
  drivingDirections: string;
  estimatedDriveTime: string;
  nearbyAttractions: string[];
};

export const CITY_CONTENT: Record<CitySlug, CityContent> = {
  'la-mirada': {
    introText: [
      'Puppy Day is La Mirada\'s top-rated dog grooming salon, right here in the heart of our community on Leffingwell Rd. We\'ve built our reputation on one-on-one care, hypoallergenic products, and a stress-free environment where your dog genuinely looks forward to coming back. If you\'re searching for the best dog groomer in La Mirada CA, you won\'t need to look further.',
      'Our salon offers everything from basic baths and nail trims to full breed-specific styling packages. Every groom includes a warm bath, blow dry, ear cleaning, and a finishing spritz — all tailored to your dog\'s coat type and temperament. We keep our schedule intentionally small so your pup always gets undivided attention, never rushed off to a cage.',
      'We\'re proud to call La Mirada home. Whether you\'re coming from the Leffingwell Rd corridor, near Creek Park, or the Biola University neighborhood, we\'re just around the corner and always happy to meet your dog for the first time.',
    ],
    whyChooseUs: [
      'Our salon is right here in La Mirada — no driving across town',
      'Hypoallergenic, premium shampoos safe for sensitive skin',
      'One-on-one grooming — your dog is never left unattended',
      'Five-star rated with a loyal local client base',
      'Flexible scheduling including Saturday appointments',
    ],
    drivingDirections: 'N/A',
    estimatedDriveTime: '0 min',
    nearbyAttractions: [
      'La Mirada Regional Park',
      'La Mirada Theatre',
      'Biola University',
    ],
  },
  norwalk: {
    introText: [
      'Norwalk dog owners have a five-star grooming salon practically in their backyard. Puppy Day sits just a few minutes south of Norwalk on Leffingwell Rd in La Mirada — close enough that many of our most loyal clients come from Los Alisos and neighborhoods near the Norwalk Civic Center. If you\'ve been searching for a reliable dog groomer near Norwalk CA, we\'re the answer.',
      'At Puppy Day, every appointment is treated as a private session. We use warm water, gentle hypoallergenic shampoos, and a calm, kennel-free environment that keeps anxious dogs at ease. Whether your pup needs a quick bath and nail trim or a full haircut and styling, we have a package that fits.',
      'We love our Norwalk neighbors and appreciate you making the short drive. After drop-off, you can head to Norwalk Town Square or grab coffee along the Los Cerritos Channel Trail while we pamper your pup.',
    ],
    whyChooseUs: [
      'Just minutes from Norwalk Town Square and the Civic Center area',
      'Gentle, kennel-free environment — perfect for nervous dogs',
      'Hypoallergenic products that are safe for all coat types',
      'Transparent pricing — no surprise fees at checkout',
      'Easy online booking with same-week availability',
    ],
    drivingDirections:
      'Head south on Bloomfield Ave from central Norwalk. Turn west on Alondra Blvd, then continue south on Norwalk Blvd. Turn west on Leffingwell Rd — Puppy Day will be on your right at 14936 Leffingwell Rd, La Mirada.',
    estimatedDriveTime: 'about 5-7 minutes',
    nearbyAttractions: [
      'Norwalk Town Square',
      'Los Cerritos Channel Trail',
      'Cerritos College',
    ],
  },
  'buena-park': {
    introText: [
      'Buena Park families trust Puppy Day for professional dog grooming that\'s just a short drive south on Beach Blvd. Nestled in La Mirada at 14936 Leffingwell Rd, our salon has become the go-to groomer for dog owners throughout the Beach Blvd entertainment corridor and neighborhoods near Buena Park Mall. We offer the kind of attentive, personalized care that busy families count on.',
      'Every grooming session at Puppy Day is a private appointment. We never double-book time slots or rush your dog through the process. Your pup gets a warm bath, professional blow dry, ear cleaning, and nail trim as a baseline — with optional add-ons like teeth brushing, deshedding treatments, and breed-specific haircuts available.',
      'We know Buena Park families are on the go, and we make drop-off and pick-up as smooth as possible. Many of our clients from the Knott\'s Berry Farm area stop by on weekday mornings and pick up their freshly groomed pup on the way home.',
    ],
    whyChooseUs: [
      'A quick drive south on Beach Blvd from the Buena Park entertainment corridor',
      'Private, one-on-one sessions — never rushed or caged between appointments',
      'Premium hypoallergenic shampoos safe for puppies and sensitive skin',
      'Breed-specific styling expertise for all coat types and sizes',
      'Saturday appointments available for busy working families',
    ],
    drivingDirections:
      'Head south on Beach Blvd from Buena Park. Turn east on Rosecrans Ave and continue into La Mirada. Turn south on Marquardt Ave, then east on Leffingwell Rd. Puppy Day is located at 14936 Leffingwell Rd.',
    estimatedDriveTime: 'about 8-12 minutes',
    nearbyAttractions: [
      "Knott's Berry Farm",
      'Buena Park Downtown',
      'Gilbert St Community Park',
    ],
  },
  whittier: {
    introText: [
      'Whittier has a strong sense of community, and at Puppy Day we feel that same connection with the dog owners who make the drive from Uptown Whittier and the Greenleaf Ave neighborhood. Our grooming salon in La Mirada is just about 10 minutes west via Whittier Blvd — close enough to be your regular groomer without the inconvenience of crossing into a completely different part of the county.',
      'We understand that Whittier dog owners have plenty of options, which is why we focus on what matters most: calm handling, premium products, and a groom that lasts. Our hypoallergenic shampoos are gentle on sensitive skin, and our groomers have experience with the wide range of breeds common in residential Whittier — from Whittier College area doodles to the larger working breeds near the Narrows.',
      'Come for a bath and nail trim, or treat your pup to a full grooming package with breed-specific styling. We keep our appointment slots intentionally limited so every dog gets individual attention from start to finish.',
    ],
    whyChooseUs: [
      'About 10 minutes west of Uptown Whittier via Whittier Blvd',
      'Experience with all breeds — from doodles to working dogs',
      'Hypoallergenic shampoos recommended for allergy-prone coats',
      'Private sessions with no overlapping appointments',
      'Clear, upfront pricing — no hidden charges',
    ],
    drivingDirections:
      'Head west on Whittier Blvd from Uptown Whittier. Merge onto Pioneer Blvd heading south. Continue south on Pioneer Blvd, then turn west on Leffingwell Rd into La Mirada. Puppy Day is at 14936 Leffingwell Rd on your right.',
    estimatedDriveTime: 'about 10 minutes',
    nearbyAttractions: [
      'Uptown Whittier',
      'Whittier Narrows Recreation Area',
      'Whittier College',
    ],
  },
  'santa-fe-springs': {
    introText: [
      'Santa Fe Springs dog owners enjoy one of the most convenient commutes to Puppy Day — just a few minutes west via Telegraph Rd or Norwalk Blvd. Our salon at 14936 Leffingwell Rd in La Mirada has become a trusted grooming destination for families throughout Santa Fe Springs, including the Carmenita neighborhood and households near the Clarke Estate open space.',
      'Puppy Day specializes in keeping your dog calm and comfortable throughout the grooming process. We use warm water baths, low-stress handling techniques, and only hypoallergenic shampoos approved for sensitive skin. Every session is private — your dog will never be left waiting in a cage between appointments.',
      'Whether your Santa Fe Springs pup needs a simple bath and brush-out or a full cut and style, we have flexible packages that work for every schedule. Book online in minutes and arrive to a groomer who already knows what your dog needs.',
    ],
    whyChooseUs: [
      'One of the closest full-service groomers to Santa Fe Springs — just minutes via Norwalk Blvd',
      'Stress-free, kennel-free grooming environment',
      'Warm water baths with hypoallergenic shampoos every visit',
      'Experienced with both short-coat and long-coat breeds',
      'Flexible scheduling with online booking available',
    ],
    drivingDirections:
      'Head west on Telegraph Rd from central Santa Fe Springs. Turn north on Norwalk Blvd, then turn west on Leffingwell Rd. Puppy Day is located at 14936 Leffingwell Rd, La Mirada, on your left.',
    estimatedDriveTime: 'about 5-8 minutes',
    nearbyAttractions: [
      'Clarke Estate',
      'Santa Fe Springs Shopping Center',
      'Slauson Ave Greenway',
    ],
  },
  cerritos: {
    introText: [
      'Cerritos is home to one of the most discerning communities in the region — and dog owners here hold their groomers to a high standard. Puppy Day welcomes Cerritos families at our La Mirada salon on Leffingwell Rd, just a short drive north on Bloomfield Ave. We\'ve earned the trust of clients near Don Knabe Community Regional Park and throughout the multicultural neighborhoods that make Cerritos special.',
      'At Puppy Day, we bring the same level of care and precision to every groom that Cerritos families expect from any professional service. Our grooming sessions are private and unhurried — your dog is bathed, dried, and styled with full attention, not shuttled between stations. We use premium hypoallergenic shampoos and finish every groom with a light spritz so your pup walks out smelling great.',
      'With easy access from Los Cerritos Center and Bloomfield Ave, squeezing in a grooming appointment around your weekend errands has never been easier.',
    ],
    whyChooseUs: [
      'Conveniently located near Cerritos — just north on Bloomfield Ave to La Mirada',
      'Premium, hypoallergenic products trusted by families with sensitive-skin dogs',
      'Private, one-on-one grooms with no kennel waiting time',
      'Experienced with the diverse breeds popular in Cerritos',
      'Online booking with real-time availability',
    ],
    drivingDirections:
      'Head north on Bloomfield Ave from Cerritos. Turn east on South St into La Mirada. Continue east to Leffingwell Rd and turn north — Puppy Day is at 14936 Leffingwell Rd.',
    estimatedDriveTime: 'about 7-10 minutes',
    nearbyAttractions: [
      'Los Cerritos Center',
      'Don Knabe Community Regional Park',
      'Cerritos Library',
    ],
  },
  'hacienda-heights': {
    introText: [
      'Hacienda Heights sits tucked against the Puente Hills with a strong community identity and plenty of dog-loving families. Puppy Day in La Mirada is the closest full-service grooming salon for many Hacienda Heights residents — just about 12 minutes west via Colima Rd and Hacienda Blvd. We\'ve built a loyal following in this area thanks to our careful, attentive grooming approach and genuine love for dogs of all sizes.',
      'Our grooming sessions are always private and personalized. We never rush a nervous dog or cut corners on a breed that requires careful hand-scissoring. Whether your pup is a compact Shih Tzu or a large Bernese from the hillside neighborhoods, we have the experience to handle them properly. We use warm water, hypoallergenic shampoos, and finish with a professional blow-dry and style.',
      'We appreciate the extra drive from Hacienda Heights and always make it worth your while. Your dog will leave looking polished and calm, ready for another adventure up in the Puente Hills Preserve.',
    ],
    whyChooseUs: [
      'About 12 minutes from Hacienda Heights — closest full-service groomer in the area',
      'Experienced with larger and hill-trail breeds that need thorough coat care',
      'Calm, patient handling — especially important for first-time visitors',
      'Hypoallergenic shampoos suitable for outdoor-active dogs',
      'Saturday and weekday slots to fit your schedule',
    ],
    drivingDirections:
      'Head west on Colima Rd from Hacienda Heights. Turn north on Hacienda Blvd and continue to Valley Home Ave. Turn west and follow into La Mirada. Turn south on Leffingwell Rd — Puppy Day is at 14936 Leffingwell Rd.',
    estimatedDriveTime: 'about 12-15 minutes',
    nearbyAttractions: [
      'Puente Hills Preserve',
      'Hsi Lai Temple',
      'Hacienda Heights Community Center',
    ],
  },
  fullerton: {
    introText: [
      'Fullerton is a city with character — from the arts district on Harbor Blvd to the energy around Cal State Fullerton — and the dog owners here want a groomer that matches that same thoughtfulness. Puppy Day in La Mirada is about 15 minutes south of Downtown Fullerton and has become a trusted stop for Fullerton families who want quality grooming without having to settle for the nearest chain salon.',
      'We run a small, intentional operation at Puppy Day. Every appointment is a private session — no other dogs in the room, no distractions, no rushing. Your Fullerton pup gets a warm bath with hypoallergenic shampoo, a professional blow-dry, ear cleaning, and nail trimming as standard, with breed-specific haircuts and add-ons available.',
      'Fullerton clients tell us the drive is absolutely worth it. We\'ve become the go-to for several Cal State Fullerton families and dog owners from Hillcrest Park who want consistent, reliable grooming they can count on every four to six weeks.',
    ],
    whyChooseUs: [
      'About 15 minutes south of Downtown Fullerton via Harbor Blvd',
      'Private sessions — no communal kennels or overlapping appointments',
      'Breed-specific styling for the diverse range of breeds in Fullerton',
      'Consistent quality — your dog gets the same groomer each visit',
      'Easy online scheduling to plan around your week',
    ],
    drivingDirections:
      'Head south on Harbor Blvd from Downtown Fullerton. Continue south through Buena Park, then turn east on Rosecrans Ave into La Mirada. Follow east on Leffingwell Rd — Puppy Day is at 14936 Leffingwell Rd.',
    estimatedDriveTime: 'about 15-18 minutes',
    nearbyAttractions: [
      'Cal State Fullerton',
      'Downtown Fullerton',
      'Hillcrest Park',
    ],
  },
  brea: {
    introText: [
      'Brea has a walkable, artsy downtown on Birch St and easy access to Carbon Canyon Regional Park — and the dog owners here tend to be just as intentional about where they take their pups for grooming. Puppy Day in La Mirada is about 20 minutes south and has developed a steady following of Brea families who discovered that the drive is more than worth it for the quality of care their dogs receive.',
      'At Puppy Day, we treat every dog as an individual. Your Brea pup is not rushed through a conveyor-belt grooming process — they get a dedicated appointment, a warm hypoallergenic bath, expert styling, and a clean finish that holds up for weeks. We have experience with the range of breeds you\'ll find in Brea, from the smaller breeds common near Brea Mall to the larger, more active dogs that love Carbon Canyon trails.',
      'Many of our Brea clients combine the drop-off with a morning at Downtown Brea\'s art walk or a quick stop at Brea Mall. By the time you\'re ready to head back, your dog is cleaned, styled, and in great spirits.',
    ],
    whyChooseUs: [
      'About 20 minutes south via Harbor Blvd — worth every minute for the quality',
      'Private, one-on-one sessions from start to finish',
      'Expert grooming for trail-active and show-coat breeds',
      'Hypoallergenic shampoos that keep coats healthy between visits',
      'Reliable scheduling — same groomer, same high standard every time',
    ],
    drivingDirections:
      'Head south on Harbor Blvd from Downtown Brea through Fullerton. Continue south on Harbor Blvd past Buena Park. Turn east on Rosecrans Ave and continue into La Mirada. Follow east on Leffingwell Rd — Puppy Day is at 14936 Leffingwell Rd.',
    estimatedDriveTime: 'about 20-25 minutes',
    nearbyAttractions: [
      'Brea Mall',
      'Downtown Brea arts district',
      'Carbon Canyon Regional Park',
    ],
  },
};
