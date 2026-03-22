import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { BlogPostLayout } from '@/components/marketing/BlogPostLayout';
import { getPostBySlug, BLOG_POSTS } from '@/data/blog-posts';
import { getBusinessInfo } from '@/lib/site-content';

const POST_SLUG = 'dog-grooming-cost-la-mirada';

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const post = getPostBySlug(POST_SLUG)!;
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: `https://thepuppyday.com/blog/${POST_SLUG}` },
    other: { 'article:modified_time': '2026-03-21' },
  };
}

const FAQ_ITEMS = [
  {
    question: 'How much does a basic dog bath cost in La Mirada?',
    answer:
      'A basic dog bath in La Mirada typically costs between $40 and $85, depending on your dog\'s size. Small dogs under 18 pounds start around $40, while extra-large dogs over 66 pounds can run up to $85. This usually includes shampoo, blow-dry, nail trim, and ear cleaning.',
  },
  {
    question: 'Why does breed-specific styling cost more than a standard haircut?',
    answer:
      'Breed-specific styling requires specialized techniques, hand-scissoring, and a deep understanding of breed standards that take years to learn. Poodles, Bichons, and Doodle mixes all have unique coat textures that demand more time, more tools, and more skill than a simple clipper cut on a short-coated breed.',
  },
  {
    question: 'How often should I budget for professional grooming?',
    answer:
      'Most dogs do well on a 6-8 week grooming schedule, so budgeting for 7-8 sessions per year is a solid starting point. Short-coated breeds can sometimes stretch to 10-12 weeks, while long-coated or curly breeds may need grooming every 4-6 weeks to prevent matting and keep the coat healthy.',
  },
];

export default async function DogGroomingCostPage() {
  const [businessInfo] = await Promise.all([getBusinessInfo()]);
  const post = getPostBySlug(POST_SLUG)!;
  const relatedPosts = post.relatedPostSlugs
    .map((slug) => BLOG_POSTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishDate,
          dateModified: '2026-03-21',
          author: { '@type': 'Organization', name: post.author },
          publisher: {
            '@type': 'Organization',
            name: 'Puppy Day',
            url: 'https://thepuppyday.com',
          },
          url: `https://thepuppyday.com/blog/${POST_SLUG}`,
          keywords: post.keywords.join(', '),
        }}
      />

      <BlogPostLayout
        post={post}
        faqItems={FAQ_ITEMS}
        relatedPosts={relatedPosts}
        phone={businessInfo.phone}
      >
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
          <Image
            src="/images/blog/dog-grooming-cost-la-mirada.jpg"
            alt="Happy Corgis at Puppy Day grooming salon in La Mirada"
            width={900}
            height={900}
            className="w-full object-cover"
            priority
          />
        </div>

        <p>
          I&apos;ve been grooming dogs in La Mirada for over a decade now, and the single most
          common question I get from new clients walking through our door at Puppy Day is about
          pricing. Dog grooming cost in La Mirada ranges anywhere from $40 to $150 depending on
          your dog&apos;s size, coat type, and the services you choose. That&apos;s a wide range,
          I know. So let me break it all down the way I&apos;d explain it to you if you were
          standing at our front counter on Leffingwell Road with your pup on a leash.
        </p>

        <h2>What Does a Basic Dog Grooming Package Include?</h2>
        <p>
          A basic grooming package at most salons in the La Mirada area covers the essentials: a
          bath with quality shampoo and conditioner, blow-dry, brush-out, nail trim, and ear
          cleaning. Think of it as the maintenance visit. Your dog comes in smelling like a dog and
          leaves smelling like a freshly laundered cloud.
        </p>
        <p>
          Here&apos;s what <Link href="/services/dog-bath">basic grooming</Link> typically runs,
          broken down by size:
        </p>
        <ul>
          <li>Small dogs (0–18 lbs): $40–$55</li>
          <li>Medium dogs (19–35 lbs): $50–$65</li>
          <li>Large dogs (36–65 lbs): $60–$75</li>
          <li>X-Large dogs (66+ lbs): $70–$85</li>
        </ul>
        <p>
          The size categories matter because a bigger dog means more shampoo, more water, more
          drying time, and frankly, more of my arm strength. Bathing a 12-pound Maltese takes me
          about 30 minutes start to finish. A 90-pound German Shepherd? That&apos;s easily an hour
          and a half, and my back knows it by the end of the day.
        </p>

        <h2>How Much Does a Premium Full Groom Cost?</h2>
        <p>
          A premium full groom in La Mirada typically costs between $70 and $150, depending on
          your dog&apos;s size and coat type. This includes everything in the basic package plus a
          full <Link href="/services/dog-haircut">dog haircut</Link>, sanitary trim, paw pad
          trimming, and styling.
        </p>
        <p>Here&apos;s the premium range by size:</p>
        <ul>
          <li>Small dogs (0–18 lbs): $70–$90</li>
          <li>Medium dogs (19–35 lbs): $80–$105</li>
          <li>Large dogs (36–65 lbs): $95–$125</li>
          <li>X-Large dogs (66+ lbs): $110–$150</li>
        </ul>
        <p>
          Why the jump from basic to premium? Time and skill. A dog bath is relatively
          straightforward. But once scissors and clippers come out, you&apos;re paying for years of
          training and the groomer&apos;s ability to shape a coat that looks good and feels
          comfortable for your dog. I spend a lot of time with my Kenchii shears doing detail work
          around faces and feet, and that kind of precision work simply can&apos;t be rushed.
        </p>
        <p>
          I had a client from Cerritos bring in a Standard Poodle last fall who hadn&apos;t been
          groomed in five months. The owner wanted a modified continental clip, and what should have
          been a two-hour groom turned into nearly four. The undercoat was so packed that my
          high-velocity dryer was barely pushing through it. That&apos;s an extreme case, but
          it&apos;s a good example of why coat condition matters so much to your final price.
        </p>

        <h2>Why Breed-Specific Styling Costs More</h2>
        <p>
          <Link href="/services/breed-specific-styling">Breed-specific styling</Link> is where
          grooming becomes a real craft. Breeds like Poodles, Bichon Frises, Schnauzers, and all
          the Doodle mixes that are everywhere in SoCal right now require specific techniques that
          go beyond a simple clipper cut.
        </p>
        <p>
          A Goldendoodle&apos;s coat, for instance, is a whole different animal (pun intended)
          compared to a Lab&apos;s. That curly, dense hair needs to be hand-fluffed and scissored
          to get that teddy bear look most owners want. I use a Chris Christensen slicker brush to
          work through the coat section by section before I even pick up my shears. The process
          takes time.
        </p>
        <p>
          French Bulldogs and Labs, which are by far the most popular breeds I see in La Mirada,
          Norwalk, and Whittier, are on the easier end. Short-coated breeds like Frenchies usually
          just need a good bath, deshedding treatment, nail trim, and ear cleaning. But a Shih Tzu
          or a Yorkie with a long coat that the owner wants kept flowing? That&apos;s a completely
          different level of work and attention.
        </p>
        <p>
          Breed-specific styling typically adds $15–$40 on top of a standard full groom price,
          depending on the breed and the style you&apos;re going for.
        </p>

        <h2>What Affects Your Final Dog Grooming Price</h2>
        <p>
          Several things can push your grooming bill higher than the base price. Here are the big
          ones:
        </p>
        <ul>
          <li>
            <strong>Matting:</strong> This is the number one reason a groom costs more than
            expected. If your dog&apos;s coat is tangled or matted, it takes extra time and care to
            work through safely. Severe matting may require a full shave-down. We typically charge
            $1 per minute for dematting work.
          </li>
          <li>
            <strong>Coat condition and length:</strong> A dog who comes in every 6–8 weeks with a
            well-brushed coat is going to cost less than a dog who shows up every 4 months looking
            like a tumble of felt. Period.
          </li>
          <li>
            <strong>Temperament:</strong> Some dogs are anxious or wiggly on the table. That&apos;s
            okay, we&apos;re patient. But it does take longer, and some salons charge a handling fee
            of $10–$15.
          </li>
          <li>
            <strong>Add-on services:</strong> Things like teeth brushing ($10–$15), deshedding
            treatments ($15–$30), flea and tick shampoo ($10–$20), nail grinding instead of
            clipping ($5–$10), or specialty shampoos like Isle of Dogs or medicated formulas
            ($10–$20) all add to the total.
          </li>
        </ul>
        <p>
          I had a Goldendoodle come in last month whose owner had been brushing only the top layer
          of the coat. She was doing everything right on the surface. But when I ran my hands
          through the coat, everything from the neck down to the hips was one solid mat underneath.
          That dog needed a full reset — a close shave with a #7 blade so the coat could grow back
          healthy. It took twice as long as a normal groom because I had to work slowly and
          carefully to avoid nicking the skin under those tight mats.
        </p>
        <p>
          The easiest way to keep your grooming costs predictable? Stick to a regular schedule. For
          most breeds here in Southern California, I recommend booking every 6–8 weeks. Our warm,
          dry SoCal weather is actually great for dogs&apos; coats, but it also means they&apos;re
          outside more, rolling in grass, picking up dirt, and their coats need consistent upkeep.
        </p>

        <h2>How to Save on Dog Grooming Without Cutting Corners</h2>
        <p>
          You don&apos;t have to choose between your dog looking great and your wallet surviving. A
          few practical tips:
        </p>
        <ul>
          <li>
            <strong>Brush at home between grooms.</strong> Even 5 minutes with a slicker brush a
            few times a week makes a massive difference. For double-coated breeds, a Furminator can
            save you $20–$30 in deshedding charges at your next visit.
          </li>
          <li>
            <strong>Keep a consistent schedule.</strong> Dogs who come in regularly are faster to
            groom, which means lower prices. Skipping appointments usually costs you more in the
            long run because of the extra dematting and coat work.
          </li>
          <li>
            <strong>Choose the right service level.</strong> Not every visit needs to be a full
            premium groom. Alternating between a basic dog bath and a full groom is a smart approach
            for many breeds.
          </li>
          <li>
            <strong>Ask about package deals.</strong> Many salons, including ours, offer discounts
            for pre-booked appointments or multi-dog households.
          </li>
        </ul>
        <p>
          For more answers to common questions, check out our{' '}
          <Link href="/faq">FAQ page</Link>.
        </p>
      </BlogPostLayout>
    </>
  );
}
