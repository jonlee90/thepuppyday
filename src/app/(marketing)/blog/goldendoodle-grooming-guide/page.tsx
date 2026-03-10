import type { Metadata } from 'next';
import Link from 'next/link';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { BlogPostLayout } from '@/components/marketing/BlogPostLayout';
import { getPostBySlug, BLOG_POSTS } from '@/data/blog-posts';
import { getBusinessInfo } from '@/lib/site-content';

const POST_SLUG = 'goldendoodle-grooming-guide';

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const post = getPostBySlug(POST_SLUG)!;
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: `https://thepuppyday.com/blog/${POST_SLUG}` },
  };
}

const FAQ_ITEMS = [
  {
    question: 'How often should a Goldendoodle be groomed?',
    answer:
      'Every 6 to 8 weeks for most Goldendoodles. Dogs with curly coats or longer styles may need grooming every 5 to 6 weeks. Consistent scheduling prevents matting and keeps the coat healthy. Regular brushing at home between appointments also helps stretch time between grooms.',
  },
  {
    question: 'What is a teddy bear cut on a Goldendoodle?',
    answer:
      'A teddy bear cut keeps the body coat at 1 to 2 inches long while the face is scissored into a round, soft shape. It gives Goldendoodles that classic stuffed-animal look with fluffy cheeks and a rounded head. This style works best on wavy and curly coats.',
  },
  {
    question: 'Can I brush my Goldendoodle at home between grooming appointments?',
    answer:
      "Absolutely, and you should. Brush at least three to five times per week with a slicker brush and steel comb. Always brush before bathing, and pay extra attention to behind the ears, legs, and chest where mats form fastest. Good home brushing is the best thing you can do for your dog's coat.",
  },
];

export default async function GoldendoodleGroomingGuidePage() {
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
        <p>
          Goldendoodles make up about a third of my daily schedule at this point. I&apos;m not
          exaggerating. Goldendoodle grooming has become such a big part of what we do at Puppy Day
          that I could probably write a book on the subject. These dogs are everywhere in La Mirada,
          Cerritos, Norwalk, and really all of SoCal, and their coats are some of the most
          misunderstood in the grooming world. I want to clear up what&apos;s actually involved so
          you know what to expect, what to ask for, and how to keep that coat looking great between
          visits.
        </p>

        <h2>Goldendoodle Coat Types and Why They Matter</h2>
        <p>
          Not all Goldendoodles have the same coat, and the coat your dog has changes everything
          about how I groom them. There are three main types: wavy, curly, and straight.
        </p>
        <p>
          Wavy coats are the most common. They&apos;ve got a soft, slightly tousled texture
          that&apos;s pretty forgiving. These dogs can go a little longer between brushing sessions
          (three to four times a week works) and they hold most haircut styles well.
        </p>
        <p>
          Curly coats are closest to a Poodle&apos;s. They look amazing when maintained — that
          tight, springy curl gives you the classic teddy bear look. But they mat fast. I&apos;m
          talking two or three days without brushing and you&apos;ll start feeling little knots
          forming at the base of the coat, especially behind the ears and in the armpits. These dogs
          need daily brushing at home, no exceptions.
        </p>
        <p>
          Straight coats are the lowest maintenance for tangles, but they shed more than the other
          two. A lot of owners are surprised by this because they bought a Goldendoodle expecting no
          shedding at all. A good{' '}
          <Link href="/services/deshedding">deshedding treatment</Link> every few grooms helps
          manage it.
        </p>
        <p>
          I had a client in Buena Park who was convinced her Goldendoodle was wavy. Turns out the
          dog had a curly coat that had been kept so short she&apos;d never seen the curl develop.
          Once we let it grow out a bit, the tight ringlets became obvious. Knowing your coat type
          isn&apos;t just trivia. It determines your entire grooming plan.
        </p>

        <h2>Popular Goldendoodle Haircut Styles</h2>
        <p>
          This is where the fun starts. Goldendoodle haircut styles are probably the most common
          conversation I have with doodle parents, and I&apos;ve got strong opinions on all of them.
        </p>

        <h3>The Teddy Bear Cut</h3>
        <p>
          The Goldendoodle teddy bear cut is far and away our most requested style. The body is
          trimmed to about 1 to 2 inches all over, and the face is scissored into a round, soft
          shape that makes your dog look like a stuffed animal. I use curved shears to round out the
          cheeks and blend the topknot down into the ears. Done right, it&apos;s honestly adorable.
        </p>
        <p>
          The maintenance level is moderate. You&apos;ll need to brush three to five times per week
          to keep it looking fluffy and mat-free.
        </p>

        <h3>The Puppy Cut</h3>
        <p>
          A puppy cut is basically a uniform length all over, usually around one inch. It&apos;s
          cleaner and simpler than the teddy bear, and I recommend it for owners who want a
          good-looking dog without a ton of upkeep. It works on all three coat types and it&apos;s
          my go-to suggestion for first-time doodle owners who aren&apos;t sure what they want yet.
        </p>

        <h3>The Lion Cut</h3>
        <p>
          The body is clipped short (usually a #4 or #5 blade), while the head, chest, and tip of
          the tail are left long and full. It&apos;s a bold look. Not every Goldendoodle can pull it
          off, but on a big, confident standard-size doodle with a wavy coat, it looks fantastic.
          It&apos;s also practical for Southern California summers when you want your dog cool but
          still want some personality in the style.
        </p>

        <h3>The Summer Cut</h3>
        <p>
          Speaking of heat, the summer cut is just a short, all-over clip. I take it down to about
          half an inch. When August rolls around and it&apos;s 95 degrees in La Mirada, a lot of
          owners come in asking for this. It&apos;s the easiest to maintain and dries quickly after
          baths or trips to the park.
        </p>

        <h2>How Often Should a Goldendoodle Be Groomed?</h2>
        <p>
          Most Goldendoodles need a professional grooming session every 6 to 8 weeks, which includes
          a full bath, blow-dry, haircut, nail trim, ear cleaning, and sanitary trim. Curly-coated
          dogs or those kept in longer styles may need to come in closer to every 5 to 6 weeks.
        </p>
        <p>
          I see the consequences of skipping appointments all the time. Last week a sweet mini
          Goldendoodle came in after about 14 weeks without a groom. Her owner travels a lot and
          just couldn&apos;t get in. The coat looked okay from the outside, but when I ran a steel
          comb through it, it stopped about a quarter inch from the skin. The entire undercoat was
          one solid sheet of matting. We had to shave her down with a #10 blade to get under it
          safely. She looked like a different dog walking out.
        </p>
        <p>
          That&apos;s not a judgment on the owner. Life happens. But it&apos;s a good example of
          why staying on schedule matters so much with this breed. The coat grows fast and mats
          faster.
        </p>

        <h2>Home Maintenance Between Appointments</h2>
        <p>
          What you do between visits to the salon has more impact on your dog&apos;s coat than
          anything I do on the grooming table. Here&apos;s what I recommend:
        </p>
        <ul>
          <li>
            <strong>Brush three to five times per week.</strong> Daily is even better for curly
            coats. Use a slicker brush first (I like the Chris Christensen Big G), then follow up
            with a steel comb to catch anything hiding near the skin.
          </li>
          <li>
            <strong>Always brush before bathing.</strong> Water tightens mats and makes them nearly
            impossible to get out without clipping. This is probably the most common mistake I see
            doodle owners make.
          </li>
          <li>
            <strong>Focus on trouble spots.</strong> Behind the ears, under the collar, the chest,
            legs, and anywhere your dog&apos;s harness sits. These areas mat fastest because of
            friction.
          </li>
          <li>
            <strong>Check the nails.</strong> If you hear clicking on tile or hardwood, they&apos;re
            too long. A Dremel-style grinder at home between grooms keeps them at a comfortable
            length.
          </li>
          <li>
            <strong>Use a detangling spray.</strong> A light spritz of leave-in conditioner before
            brushing makes the process easier on both of you and cuts your brushing time in half.
          </li>
        </ul>
        <p>
          Our team is always happy to show you brushing techniques when you pick up your dog. Just
          ask. We&apos;d rather spend two minutes demonstrating the right way to line-comb than see
          your pup come back matted. For more on our approach to doodle coats, check out our{' '}
          <Link href="/services/breed-specific-styling">breed-specific styling services</Link>.
        </p>
      </BlogPostLayout>
    </>
  );
}
