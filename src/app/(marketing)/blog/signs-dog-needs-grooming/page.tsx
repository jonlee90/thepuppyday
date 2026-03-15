import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { BlogPostLayout } from '@/components/marketing/BlogPostLayout';
import { getPostBySlug, BLOG_POSTS } from '@/data/blog-posts';
import { getBusinessInfo } from '@/lib/site-content';

const POST_SLUG = 'signs-dog-needs-grooming';

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
    question: 'How often does a dog really need professional grooming?',
    answer:
      'Most dogs benefit from professional grooming every 4 to 8 weeks. Short-haired breeds can go 8 to 12 weeks, while long-haired or curly-coated breeds like Poodles and Doodles should come in every 4 to 6 weeks. Your dog\'s activity level and coat condition also play a role.',
  },
  {
    question: 'Can matted fur hurt my dog?',
    answer:
      'Yes. Mats pull tightly against the skin and trap dirt, moisture, and bacteria underneath. This can cause skin irritation, hot spots, infections, and restricted movement around the joints. Severe matting can even cut off blood circulation to areas like the ears and legs.',
  },
  {
    question: "What happens if I let my dog's nails grow too long?",
    answer:
      "Overgrown nails change how your dog walks and puts extra stress on their joints, which can lead to posture problems and long-term pain. Nails that get too long can crack, split, or curl into the paw pad, causing injury and risk of infection. Trimming every 3 to 4 weeks prevents this.",
  },
];

export default async function SignsDogNeedsGroomingPage() {
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
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
          <Image
            src="/images/blog/signs-dog-needs-grooming.jpg"
            alt="Bulldog peeking over the edge of a grooming tub at Puppy Day in La Mirada"
            width={900}
            height={900}
            className="w-full object-cover"
            priority
          />
        </div>

        <p>
          Most of the dogs I see at Puppy Day don&apos;t come in because their owners planned ahead.
          They come in because something finally tipped them off. Maybe the coat started smelling
          weird, or the nails got so long the clicking on the kitchen floor became impossible to
          ignore. I&apos;ve been grooming dogs here in La Mirada for over ten years, and I can tell
          you the signs your dog needs grooming are almost always there weeks before owners notice
          them. The good news is that once you know what to look for, you&apos;ll never let things
          get too far again.
        </p>

        <h2>1. Matted Fur That Won&apos;t Brush Out</h2>
        <p>
          Mats aren&apos;t just ugly. They&apos;re painful. When fur tangles and tightens against
          the skin, it traps dirt, moisture, and bacteria underneath, and that can lead to hot spots,
          skin infections, and serious discomfort for your dog.
        </p>
        <p>
          I had a Shih Tzu mix come in a few weeks ago from Whittier whose belly was completely
          pelted. The owner had no idea because the top coat still looked decent. But when I lifted
          the dog&apos;s front leg, the mat underneath was so tight against the skin that it had
          started to cut off circulation. That&apos;s not an unusual case. Mats love to hide in
          spots you don&apos;t think to check: behind the ears, in the armpits, between the back
          legs, and under the collar.
        </p>
        <p>
          If you can&apos;t slide a steel comb smoothly from the tip of the hair all the way down to
          the skin, your dog has mats forming. And once they get dense, home brushing won&apos;t fix
          it. That&apos;s when you need a professional groom, and sometimes a full shave-down to
          start fresh.
        </p>

        <h2>2. Nails Clicking on the Floor</h2>
        <p>
          This one&apos;s simple. If you hear your dog&apos;s nails tapping on tile or hardwood,
          they&apos;re too long.
        </p>
        <p>
          Overgrown nails change how your dog walks. They push the toes into unnatural positions,
          which puts strain on the joints and can mess with posture over time. Really long nails can
          curl and grow into the paw pad, which is exactly as painful as it sounds. I recommend{' '}
          <Link href="/services/nail-trimming">nail trimming</Link> every 3 to 4 weeks, though dogs
          who walk a lot on concrete (sidewalks, driveways) naturally wear their nails down and can
          go a bit longer.
        </p>

        <h2>3. Bad Smell That Survives a Home Bath</h2>
        <p>
          A dog who still smells after you&apos;ve bathed them at home is telling you something. The
          odor is usually coming from a place your home setup can&apos;t reach: deep in a thick
          undercoat, in the ears, or from skin that needs a proper medicated or deodorizing shampoo.
        </p>
        <p>
          Our SoCal weather keeps dogs active year-round, and that means they&apos;re picking up
          dirt and oils constantly. A salon{' '}
          <Link href="/services/dog-bath">dog bath</Link> with a high-velocity dryer gets all the
          way down to the skin in a way a garden hose and towel dry just can&apos;t. I use Isle of
          Dogs shampoo for most coats, and for dogs with persistent odor issues, a medicated oatmeal
          formula usually does the trick.
        </p>

        <h2>4. Excessive Shedding on Your Furniture</h2>
        <p>
          Some shedding is normal. Finding tumbleweeds of fur under your couch every single day is
          not. Breeds like German Shepherds, Huskies, and Golden Retrievers (all of which I see
          constantly here in La Mirada and the surrounding Cerritos and Norwalk areas) blow their
          undercoats seasonally, and without proper removal, that loose hair just keeps piling up.
        </p>
        <p>
          A <Link href="/services/deshedding">deshedding treatment</Link> is the fastest way to get
          it under control. We use a Furminator tool combined with a high-velocity blow-out that
          loosens and removes dead undercoat you&apos;d never get with brushing alone. One session
          usually fills an entire trash bag with fur. It&apos;s honestly wild to see how much comes
          off a single dog.
        </p>

        <h2>5. Dirty or Waxy Ears</h2>
        <p>
          Lift your dog&apos;s ear flap and take a look. Healthy ears are pale pink with minimal
          buildup. If you see dark brown or black waxy residue, or if there&apos;s a yeasty, sour
          smell, your dog needs an ear cleaning at minimum and possibly a vet visit for infection.
        </p>
        <p>
          Floppy-eared breeds like Cocker Spaniels, Basset Hounds, and Goldendoodles are especially
          prone to this because the ear flap traps moisture and limits airflow. I clean ears as part
          of every full groom, and I always let owners know if something looks off so they can follow
          up with their vet.
        </p>

        <h2>6. Tear Stains Around the Eyes</h2>
        <p>
          Those reddish-brown streaks running down from the inner corners of your dog&apos;s eyes
          aren&apos;t just a cosmetic issue. They can indicate excessive tearing from irritation,
          blocked tear ducts, or hair growing into the eyes. Maltese, Shih Tzus, and Bichons are the
          biggest offenders I see on my table.
        </p>
        <p>
          I carefully trim the hair around the eyes and clean the stained area with a gentle,
          tear-safe solution during grooms. Left alone, the moisture in those stains can cause skin
          irritation and even a mild yeast infection on the face. A groom every 6 to 8 weeks keeps
          this manageable for most small breeds.
        </p>

        <h2>How Do I Know When to Groom My Dog?</h2>
        <p>
          The right dog grooming frequency depends on your dog&apos;s breed, coat type, and
          lifestyle, but most dogs should see a groomer every 4 to 8 weeks. Short-coated breeds like
          Beagles or Boxers can stretch to 8 to 12 weeks. Curly or long-coated breeds (Poodles,
          Doodles, Yorkies) do best at 4 to 6 weeks.
        </p>
        <p>
          A good rule I give clients: run your hands over your dog&apos;s entire body once a week.
          Feel for tangles, check the nails, sniff the ears, look at the eyes. If something&apos;s
          off, don&apos;t wait for your next scheduled appointment. Catching things early is always
          cheaper and less stressful for your dog than waiting until there&apos;s a problem.
        </p>

        <h2>7. A Dull, Greasy, or Rough Coat</h2>
        <p>
          A healthy coat has a natural shine to it and feels soft when you run your fingers through
          it. If your dog&apos;s fur looks flat, feels oily, or has a rough, straw-like texture,
          something&apos;s off. It could be diet-related, but more often it&apos;s a buildup of
          natural oils, dead skin, and environmental grime that a good bath and blow-out will fix.
        </p>
        <p>
          I had a Lab come in last month whose coat felt almost sticky. The owner had been bathing
          him at home with a human shampoo (which strips the natural oils and makes things worse).
          After one proper bath with a quality dog-specific conditioner and a thorough blow-dry, that
          coat was gleaming again. The difference was night and day.
        </p>
      </BlogPostLayout>
    </>
  );
}
