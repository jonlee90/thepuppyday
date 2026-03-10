import type { ServiceSlug } from './services';

export type ServiceContent = {
  whatsIncluded: string[];
  benefits: string[];
  idealFor: string;
  sessionDuration: string;
  faqItems: Array<{ question: string; answer: string }>;
  relatedServiceSlugs: ServiceSlug[];
};

export const SERVICE_CONTENT: Record<ServiceSlug, ServiceContent> = {
  'dog-bath': {
    whatsIncluded: [
      'Warm water bath with temperature-controlled water tailored to your dog\'s comfort level',
      'Hypoallergenic, soap-free shampoo and conditioner selected for your dog\'s coat type and skin sensitivity',
      'Thorough blow dry and hand fluffing to leave the coat soft, shiny, and tangle-free',
      'Ear cleaning with veterinarian-recommended solution to remove buildup and prevent infection',
      'Nail trim and filing to a comfortable, safe length',
    ],
    benefits: [
      'Removes dirt, dander, and allergens that accumulate between grooming visits, keeping your dog\'s skin healthy and coat vibrant',
      'Reduces shedding by removing loose undercoat and dead hair during the bathing and drying process',
      'Early detection of skin issues, hot spots, lumps, or parasites through hands-on inspection during the bath',
      'Eliminates odor-causing bacteria, leaving your dog smelling fresh for days after the appointment',
      'Regular ear cleaning helps prevent painful ear infections, especially in floppy-eared breeds',
    ],
    idealFor:
      'Dogs of all breeds and sizes who need a thorough clean without a haircut. Our basic bath is perfect for short-coated breeds like Labradors, Beagles, and Boxers, as well as any dog between full grooming appointments. Puppies getting their first professional grooming experience also benefit from starting with a gentle bath to build positive associations with the salon.',
    sessionDuration:
      'A standard bath appointment takes approximately 45 minutes to 1.5 hours depending on your dog\'s size, coat density, and temperament. Small dogs (under 18 lbs) are typically finished in about 45 minutes, while larger or double-coated breeds may require up to 90 minutes for a complete bath and dry.',
    faqItems: [
      {
        question: 'How often should I bathe my dog?',
        answer:
          'Most dogs do well with a professional bath every 4 to 6 weeks. Dogs with oily coats like Basset Hounds may benefit from bathing every 2 to 3 weeks, while breeds with water-repellent coats like Golden Retrievers can go 6 to 8 weeks between baths. Over-bathing can strip natural oils from the coat, so we recommend discussing a schedule based on your dog\'s specific breed, activity level, and skin condition during your visit.',
      },
      {
        question: 'What shampoo do you use?',
        answer:
          'We use professional-grade, hypoallergenic shampoos that are free of harsh sulfates, parabens, and artificial fragrances. Our standard shampoo is gentle enough for sensitive skin while still delivering a deep clean. For dogs with specific needs, we carry medicated shampoos for itchy or irritated skin, oatmeal-based formulas for extra moisturizing, and whitening shampoos for light-colored coats. Your groomer will assess your dog\'s coat and skin at the start of every session to choose the best product.',
      },
      {
        question: 'My dog is anxious about baths. Can you still help?',
        answer:
          'Absolutely. At The Puppy Day, every dog receives one-on-one attention in a calm, quiet environment without the stress of cage drying or multiple dogs being groomed at once. Our groomers are experienced with nervous dogs and use gentle handling, positive reinforcement, and a patient approach to make bath time as stress-free as possible. Many anxious dogs become regulars who learn to enjoy their spa day.',
      },
    ],
    relatedServiceSlugs: ['dog-haircut', 'deshedding', 'nail-trimming'],
  },

  'dog-haircut': {
    whatsIncluded: [
      'Full bath with breed-appropriate shampoo and conditioner, followed by a complete blow dry',
      'Breed-specific or custom haircut tailored to your preferences and your dog\'s coat type',
      'Face, feet, and sanitary area trimming for a polished, clean finish',
      'Ear cleaning, nail trim, and filing included with every haircut appointment',
      'Coat assessment and groomer consultation to recommend the best style and maintenance schedule',
    ],
    benefits: [
      'Maintains a healthy coat by removing mats, tangles, and excess length that can trap moisture and cause skin irritation',
      'Keeps your dog comfortable in every season with appropriate coat length for temperature regulation',
      'Professional styling enhances your dog\'s appearance and natural breed characteristics',
      'Regular haircuts prevent painful matting that can pull on the skin and restrict movement',
      'Our one-on-one grooming environment means your dog gets undivided attention from start to finish, reducing stress and improving the quality of the cut',
    ],
    idealFor:
      'Dogs with medium to long coats that require regular trimming to stay healthy and manageable. This service is essential for breeds like Poodles, Shih Tzus, Yorkshire Terriers, Maltese, Goldendoodles, and Cocker Spaniels. It is also ideal for any mixed-breed dog with a coat that continues to grow rather than shed naturally. If your dog\'s hair gets in their eyes, mats easily, or grows past a comfortable length, a professional haircut keeps them looking and feeling their best.',
    sessionDuration:
      'A full haircut appointment typically takes 1.5 to 2.5 hours depending on your dog\'s size, coat condition, and the complexity of the style. Small dogs generally require about 1.5 hours, medium dogs about 2 hours, and large or heavily coated dogs up to 2.5 hours. Dogs with significant matting may need additional time for safe, gentle dematting before the cut can begin.',
    faqItems: [
      {
        question: 'How often does my dog need a haircut?',
        answer:
          'Most dogs with continuously growing coats need a haircut every 4 to 8 weeks. Breeds with faster-growing hair like Poodles and Bichon Frises typically need grooming every 4 to 6 weeks, while breeds with slower growth can stretch to 6 to 8 weeks. Waiting too long between haircuts often leads to matting, which can be uncomfortable for your dog and may require a shorter cut to remove safely. We will help you establish the right grooming schedule during your first visit.',
      },
      {
        question: 'Can you do specific breed cuts?',
        answer:
          'Yes, our groomers are trained in breed-standard cuts for a wide range of breeds, including the Poodle continental clip, Schnauzer pattern, Bichon Frise round head, Westie hand-stripping, and many more. We also specialize in popular pet trims like the teddy bear cut, puppy cut, and lamb cut. Bring reference photos if you have a specific look in mind, and your groomer will discuss what is achievable based on your dog\'s current coat condition and texture.',
      },
      {
        question: 'What happens if my dog has mats?',
        answer:
          'If your dog arrives with matting, your groomer will assess the severity before proceeding. Light mats can often be brushed out with minimal discomfort. Severe matting may require shaving the affected areas for your dog\'s safety and comfort, as pulling out tight mats can bruise or tear the skin. We will always discuss the options with you before we begin and never force a painful dematting process. Regular grooming every 4 to 6 weeks is the best way to prevent mats from forming.',
      },
    ],
    relatedServiceSlugs: ['breed-specific-styling', 'dog-bath', 'deshedding'],
  },

  'breed-specific-styling': {
    whatsIncluded: [
      'Pre-grooming consultation to discuss breed standards, your style preferences, and your dog\'s coat history',
      'Full bath with coat-specific shampoo and conditioner designed to enhance texture and volume',
      'Precision scissor work and clipper styling following breed-standard patterns or custom variations',
      'Detailed finishing touches including face sculpting, topknot shaping, ear trimming, and paw pad cleanup',
      'Ear cleaning, nail trim, and a light fragrance spritz to complete the look',
    ],
    benefits: [
      'Showcases your dog\'s natural breed beauty with cuts that follow established grooming standards',
      'Our groomers understand the unique coat textures and growth patterns of each breed, ensuring the style works with your dog\'s natural hair rather than against it',
      'Custom styling options let you personalize the look while maintaining breed-appropriate proportions and balance',
      'Proper breed-specific grooming supports coat health by maintaining the structure needed for natural temperature regulation and protection',
      'Ideal preparation for dog shows, photo sessions, or simply keeping your companion looking their absolute best',
    ],
    idealFor:
      'Owners of breeds with distinctive grooming requirements who want their dog styled to breed standards or popular breed-inspired variations. This service is especially popular for Goldendoodles, Standard and Miniature Poodles, Shih Tzus, Bichon Frises, Schnauzers, Cocker Spaniels, and Yorkshire Terriers. Whether you want a classic continental Poodle clip, a fluffy Goldendoodle teddy bear cut, a rounded Bichon head, or a sleek Shih Tzu topknot, our stylists have the breed knowledge and hand-scissoring skills to deliver a standout result.',
    sessionDuration:
      'Breed-specific styling typically takes 2 to 3 hours depending on the breed, coat length, and complexity of the style. Intricate styles like the Poodle continental clip or Bichon show trim may take up to 3 hours, while popular pet variations like the teddy bear or puppy cut generally fall in the 2 to 2.5 hour range. We recommend allowing extra time for a first visit so your groomer can establish a thorough style plan.',
    faqItems: [
      {
        question: 'Which breeds need specialized styling?',
        answer:
          'While all breeds benefit from professional grooming, breeds with continuously growing coats or distinctive breed profiles especially benefit from specialized styling. This includes Poodles (all sizes), Goldendoodles and Labradoodles, Bichon Frises, Shih Tzus, Maltese, Yorkshire Terriers, Schnauzers, Cocker Spaniels, Westies, Scottish Terriers, and Portuguese Water Dogs. Double-coated breeds like Huskies and Pomeranians also benefit from breed-knowledgeable grooming to preserve their undercoat properly.',
      },
      {
        question: 'How do I choose a style for my dog?',
        answer:
          'Start by considering your lifestyle and maintenance commitment. A shorter puppy cut is low-maintenance and works well for active dogs, while a longer teddy bear cut requires brushing at home between appointments. Your groomer will evaluate your dog\'s coat texture, density, and condition to recommend styles that will look best. Feel free to bring reference photos from social media or breed grooming guides. During your consultation, we will discuss what is realistic for your dog\'s coat and how to maintain the style between visits.',
      },
      {
        question: 'What is the difference between a teddy bear cut and a puppy cut?',
        answer:
          'A puppy cut is a uniform length all over the body, typically between half an inch and two inches, giving a clean and even appearance that is easy to maintain. A teddy bear cut keeps the body at a similar length but leaves the face, head, and ears fuller and rounded to create that soft, plush teddy bear look. The teddy bear style requires more precision around the face and may need touch-ups every 4 to 6 weeks to maintain the rounded shape. Both are popular choices for Doodles, Shih Tzus, and Bichons.',
      },
    ],
    relatedServiceSlugs: ['dog-haircut', 'dog-bath', 'deshedding'],
  },

  'nail-trimming': {
    whatsIncluded: [
      'Careful nail trimming to a safe, comfortable length using professional-grade clippers or a Dremel rotary tool',
      'Nail filing and smoothing after trimming to eliminate sharp edges that can scratch skin and floors',
      'Quick inspection of paw pads for cracks, dryness, or foreign objects like foxtails or thorns',
    ],
    benefits: [
      'Prevents overgrown nails from curling into paw pads, which causes pain, infection, and difficulty walking',
      'Maintains proper posture and gait by keeping nails at a length that allows natural foot placement',
      'Reduces the risk of torn or broken nails, which are painful and can require veterinary attention',
      'Protects your floors, furniture, and skin from scratches caused by sharp or overgrown nails',
    ],
    idealFor:
      'Every dog, regardless of breed or size. Dogs who walk primarily on soft surfaces like grass or carpet wear down their nails less naturally and tend to need trimming more frequently. Senior dogs, puppies, and small breeds who spend most of their time indoors are especially prone to overgrown nails. This service is available as a standalone quick appointment or as an add-on to any bath or haircut session for convenience.',
    sessionDuration:
      'A standalone nail trimming appointment takes approximately 15 to 20 minutes. When added to a bath or haircut, nail trimming is seamlessly included in your grooming session at no extra time. For dogs who are nervous about nail trims, we may take a few extra minutes to use gentle desensitization techniques and positive reinforcement.',
    faqItems: [
      {
        question: 'How often should my dog\'s nails be trimmed?',
        answer:
          'Most dogs need their nails trimmed every 3 to 4 weeks. A good rule of thumb is that if you can hear your dog\'s nails clicking on hard floors, they are overdue for a trim. Dogs who walk frequently on concrete or asphalt may naturally wear their nails down and can go longer between trims. Keeping nails trimmed regularly also helps recede the quick over time, making future trims easier and less stressful for your dog.',
      },
      {
        question: 'My dog is scared of nail trims. What do you do differently?',
        answer:
          'Many dogs are sensitive about their paws, and we see it regularly. Our groomers use a calm, patient approach with treats and praise to create positive associations. We offer both traditional clippers and a Dremel rotary tool, and some dogs who dislike the clipping sensation do much better with the gentle filing of the Dremel. Because we groom one dog at a time in a quiet environment, your dog won\'t be stressed by other animals or loud background noise during the process.',
      },
    ],
    relatedServiceSlugs: ['dog-bath', 'dog-haircut', 'teeth-brushing'],
  },

  'teeth-brushing': {
    whatsIncluded: [
      'Gentle teeth brushing using an enzymatic, pet-safe toothpaste in a flavor dogs love',
      'Gum line cleaning to remove plaque buildup along the areas most prone to tartar formation',
      'Visual oral health check to identify signs of gum disease, broken teeth, or other concerns that should be seen by a veterinarian',
    ],
    benefits: [
      'Reduces plaque and tartar buildup that leads to periodontal disease, the most common health problem in dogs over age three',
      'Freshens breath by eliminating the bacteria that cause persistent bad odor',
      'Supports overall health, as dental infections can spread bacteria to the heart, liver, and kidneys through the bloodstream',
      'Saves money over time by reducing the likelihood of expensive veterinary dental cleanings and extractions',
    ],
    idealFor:
      'All dogs, especially small breeds like Chihuahuas, Yorkshire Terriers, and Dachshunds, who are genetically predisposed to dental disease due to crowded teeth. Dogs who do not receive regular at-home dental care or dental chews also benefit significantly. Adding a teeth brushing to your regular grooming appointment is an easy way to maintain your dog\'s oral health between veterinary checkups. This service is available as a standalone appointment or as a convenient add-on to any bath or grooming session.',
    sessionDuration:
      'A teeth brushing takes approximately 10 to 15 minutes as a standalone service. When added to a bath or haircut appointment, it fits seamlessly into the grooming process. Dogs who are new to teeth brushing may need a brief introduction period where the groomer lets them taste the toothpaste and get comfortable with the brush before a full cleaning.',
    faqItems: [
      {
        question: 'Is professional teeth brushing a substitute for veterinary dental cleaning?',
        answer:
          'No, professional teeth brushing at the groomer is a preventive maintenance service, similar to brushing your own teeth at home between dental visits. It removes surface plaque and freshens breath but does not replace a veterinary dental cleaning, which involves anesthesia, scaling below the gum line, and dental X-rays. Regular brushing between vet visits helps slow tartar buildup and can extend the time between professional cleanings. We recommend discussing a complete dental care plan with your veterinarian.',
      },
      {
        question: 'How often should I add teeth brushing to my dog\'s grooming?',
        answer:
          'For the best results, we recommend adding teeth brushing to every grooming appointment, which for most dogs means every 4 to 6 weeks. Consistent brushing is far more effective at controlling plaque than occasional sessions. Between grooming visits, you can support your dog\'s dental health at home with dental chews, water additives, or brushing with a pet-safe toothpaste a few times per week.',
      },
    ],
    relatedServiceSlugs: ['dog-bath', 'nail-trimming', 'dog-haircut'],
  },

  deshedding: {
    whatsIncluded: [
      'Specialized deshedding shampoo and conditioner treatment that loosens the undercoat and nourishes the topcoat',
      'Thorough blow out with a high-velocity dryer to remove loose undercoat before brushing',
      'Professional deshedding with specialized tools like the FURminator or undercoat rake to remove dead hair from the undercoat without damaging the topcoat',
      'Final brush-out and inspection to ensure maximum loose hair removal across the entire body',
    ],
    benefits: [
      'Reduces shedding around your home by up to 80 percent for several weeks following treatment',
      'Promotes a healthier coat and skin by removing trapped dead hair that can cause matting, hot spots, and skin irritation',
      'Improves air quality in your home by reducing airborne pet dander and loose fur',
      'Helps your dog stay cool during warm weather by thinning out the dense undercoat that traps heat',
      'More effective than at-home brushing because professional tools and high-velocity drying reach deep into the undercoat that standard brushes miss',
    ],
    idealFor:
      'Double-coated and heavy-shedding breeds that blow their coat seasonally or shed consistently year-round. This treatment is especially beneficial for Labrador Retrievers, Golden Retrievers, German Shepherds, Huskies, Malamutes, Corgis, Akitas, Australian Shepherds, Border Collies, and Pomeranians. It is also helpful for mixed-breed dogs with thick undercoats. We recommend scheduling deshedding treatments during spring and fall when seasonal coat changes produce the heaviest shedding.',
    sessionDuration:
      'A deshedding treatment takes approximately 1 to 2 hours depending on your dog\'s size and coat density. Small to medium dogs with moderate undercoats typically need about 1 hour, while large breeds with thick double coats like Huskies and German Shepherds may need up to 2 hours for a thorough treatment. The service is also available as an add-on to any bath or haircut appointment.',
    faqItems: [
      {
        question: 'How much does deshedding actually reduce shedding?',
        answer:
          'A professional deshedding treatment can reduce loose hair shedding by up to 80 percent for 4 to 6 weeks after the appointment. Results vary depending on your dog\'s breed, coat cycle, and the time of year. Dogs going through a seasonal coat blow will see dramatic results immediately, while year-round shedders will notice a significant reduction in the fur they leave on furniture, clothing, and floors. For the best ongoing results, we recommend scheduling deshedding treatments every 4 to 8 weeks.',
      },
      {
        question: 'Should I shave my double-coated dog instead of deshedding?',
        answer:
          'No. Shaving a double-coated breed is generally not recommended because the undercoat and topcoat work together to regulate your dog\'s body temperature in both hot and cold weather. Shaving can permanently damage the coat texture, cause uneven regrowth, and actually make your dog more susceptible to sunburn and overheating. A professional deshedding treatment removes the excess undercoat while preserving the protective topcoat, which is the safest and most effective way to manage shedding in double-coated breeds.',
      },
      {
        question: 'Can I do deshedding at home between appointments?',
        answer:
          'Regular brushing at home helps maintain the results of a professional deshedding session. We recommend brushing your double-coated dog 2 to 3 times per week with an undercoat rake or slicker brush. However, home brushing cannot replicate the combination of deshedding shampoo, high-velocity drying, and professional-grade tools used during a salon treatment. Think of at-home brushing as maintenance between professional deshedding sessions for the best results.',
      },
    ],
    relatedServiceSlugs: ['dog-bath', 'dog-haircut', 'flea-tick-treatment'],
  },

  'flea-tick-treatment': {
    whatsIncluded: [
      'Medicated flea and tick shampoo bath that kills fleas, ticks, and their eggs on contact',
      'Thorough coat inspection to identify and remove any visible parasites, flea dirt, or tick attachment sites',
      'Application of a topical flea and tick preventive treatment to provide continued protection after the bath',
      'Full blow dry and brush-out to remove dead parasites and ensure complete coverage of the treatment',
    ],
    benefits: [
      'Eliminates existing fleas and ticks quickly and safely using veterinarian-approved products applied by trained groomers',
      'Provides ongoing protection against reinfestation for weeks following the treatment',
      'Reduces the risk of flea-borne diseases like tapeworms and flea allergy dermatitis, as well as tick-borne illnesses like Lyme disease and ehrlichiosis',
      'Professional application ensures proper product dosage and even coverage that is difficult to achieve at home',
      'Gives your home a head start on flea control by removing parasites and eggs from your dog before they spread to carpets, bedding, and furniture',
    ],
    idealFor:
      'Dogs who spend time outdoors, visit dog parks, hike trails, or live in areas where fleas and ticks are prevalent. This treatment is especially important during spring and summer months in Southern California when flea and tick activity peaks, though parasites can be active year-round in our mild climate. Dogs who have been exposed to other animals with fleas, dogs with flea allergy dermatitis, and dogs whose owners want proactive parasite prevention all benefit from this service. Available as a standalone treatment or as an add-on to any grooming appointment.',
    sessionDuration:
      'A flea and tick treatment takes approximately 45 minutes to 1 hour as a standalone service. The medicated shampoo requires several minutes of contact time to be fully effective, and we allow time for a thorough inspection and complete blow dry afterward. When combined with a bath or haircut, the treatment integrates into the grooming session with minimal additional time.',
    faqItems: [
      {
        question: 'How do I know if my dog has fleas or ticks?',
        answer:
          'Common signs of fleas include excessive scratching, biting at the skin (especially around the tail base and belly), red or irritated skin, small black specks in the fur called flea dirt, and visible small brown insects moving through the coat. Ticks are usually found as small dark bumps attached to the skin, commonly around the ears, neck, and between the toes. If you notice any of these signs, we recommend scheduling a flea and tick treatment right away to prevent the infestation from spreading to your home and other pets.',
      },
      {
        question: 'Is the flea and tick treatment safe for puppies?',
        answer:
          'We use flea and tick products that are safe for puppies over 12 weeks of age and weighing at least 4 pounds. For younger puppies, we recommend consulting with your veterinarian for age-appropriate parasite prevention. Our groomers will verify your dog\'s age and weight before applying any flea and tick products and will select the appropriate product strength for your dog\'s size. If your puppy is too young for treatment but you suspect fleas, we can provide a thorough flea comb-out and bath with gentle shampoo as an alternative.',
      },
      {
        question: 'Should my dog get flea and tick treatment year-round in La Mirada?',
        answer:
          'Yes. While flea and tick activity peaks in warmer months, Southern California\'s mild climate means parasites can be active throughout the year. Veterinarians in the La Mirada area generally recommend year-round flea and tick prevention. A professional grooming treatment every 4 to 8 weeks combined with a monthly preventive from your veterinarian provides the most comprehensive protection. Our groomers can work alongside your vet\'s prevention plan to keep your dog fully protected.',
      },
    ],
    relatedServiceSlugs: ['dog-bath', 'deshedding', 'nail-trimming'],
  },
};

export function getServiceContent(slug: string): ServiceContent | undefined {
  return SERVICE_CONTENT[slug as ServiceSlug];
}
