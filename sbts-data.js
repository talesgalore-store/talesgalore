/* ============================================================
   Story Beneath the Story — shared content source
   Add a new entry here and it will automatically appear on:
   - story-beneath-the-story.html (the hub)
   - any product page for a matching book title
   - the homepage "Reflection" widget
   - the Why TalesGalore callout
   `bookTitle` should match the book's title in Contentful exactly
   (matching is case-insensitive) so it can be linked automatically.

   `coverImage` should be the same cover image URL used for that book
   in Contentful (the coverImage asset's URL, same as shown on
   shop.html / product.html). Leave it as an empty string ("") if you
   don't have it yet — the page falls back to a book emoji instead of
   a broken image.
   ============================================================ */

const SBTS_ENTRIES = [
  {
    slug: "giraffes-cant-dance",
    bookTitle: "Giraffes Can't Dance",
    author: "by Giles Andreae and illustrated by Guy Parker-Rees",
    theme: "Confidence & Self-Acceptance",
    coverImage: "https://images.ctfassets.net/tx11zsju5n7c/35MmqFGG1Klt7P21ZxFd7q/e3434f6fa5d00cb213b0e5064b6cfaef/Giraffes_Cant_Dance.jpg",
    body: [
      "There is a quiet moment many children experience, though they may not have words for it yet: feeling like they don't fit in.",
      "It often begins in simple situations—games, performances, group activities—where some children seem naturally confident, while others feel stiff, unsure, or out of place.",
      "In those moments, a child may start believing something very heavy: Everyone else can do this... but I can't.",
      "This is not a lack of ability. It is often a lack of emotional safety.",
      "When children feel watched, judged, or compared, their bodies tighten and their confidence shrinks. What they need most in that moment is not correction—but reassurance that they are safe to try.",
      "Gerald's story reflects something many people carry into adulthood: the fear of looking awkward while learning something new.",
      "But there is a deeper truth underneath his journey: confidence does not come from being perfect—it comes from being allowed to be imperfect.",
      "When Gerald finds his own music, something important shifts. He stops measuring himself against others and starts listening inwardly. And that is where real confidence begins—not in comparison, but in self-acceptance.",
      "The story isn't really about dancing.",
      "It is about discovering that every child has their own rhythm, even if it takes time to find it."
    ],
    reminder: "You don't need to dance like others. You just need to find the music that belongs to you."
  },
  {
    slug: "mindful-journey",
    bookTitle: "Mindful Journey",
    author: "",
    theme: "Mindfulness & Emotions",
    coverImage: "https://images.ctfassets.net/tx11zsju5n7c/2IocOswwalsYWNBWK6xRXy/e97894f58675b11bf9ebe809cbac3677/Mindful_Journey.jpg",
    body: [
      "There is a quiet truth about emotions that children—and adults—often discover the hard way: Not every sad feeling needs to be fixed. Sometimes it simply needs to be noticed.",
      "When Brodie feels heavy and out of sorts, Bea doesn't rush to tell him to \u201ccheer up.\u201d She doesn't scold him for feeling gloomy. Instead, she invites him on a journey.",
      "This reflects something psychologists call attention shifting. When we feel stuck in worry, disappointment, or sadness, our minds can become trapped inside those feelings. The more we focus on them, the bigger they seem.",
      "Mindfulness offers a different path.",
      "It gently invites us to look outward—to the sky above us, the wind around us, the beauty of a landscape, the sound of a bird, or the story hidden in a place. The remarkable thing is that the world itself doesn't change. But our relationship to our thoughts does.",
      "As Bea guides Brodie through Scotland's history, beauty, and wonder, she helps him remember something easy to forget: there is always more happening than the feeling we are experiencing right now.",
      "The mountains remain majestic. The rivers continue to flow. The world is still filled with beauty waiting to be noticed.",
      "And often, that small shift in attention creates space for our hearts to feel lighter. The story isn't really about a bee and a Highland cow.",
      "It is about learning that when life feels heavy, we don't always need to escape our feelings. Sometimes we simply need to slow down, look around, and reconnect with the world beyond them."
    ],
    reminder: "Feelings are visitors. They come and go. But wonder is always waiting to welcome us back."
  },
  {
    slug: "the-jungle-book",
    bookTitle: "The Jungle Book",
    author: "https://images.ctfassets.net/tx11zsju5n7c/4nbPHZygoPGSXSgmCelT2D/82c4de3b7cf4190445f02556871ec9d5/The_Jungle_Book.jpeg",
    theme: "Belonging & Identity",
    coverImage: "",
    body: [
      "One of the deepest human questions is surprisingly simple: \u201cWhere do I belong?\u201d Children begin asking this question long before they can put it into words.",
      "They ask it when they start a new school. When they feel different from others. When they wonder why they don't quite fit in.",
      "Mowgli's story is built around this universal experience.",
      "Raised by wolves, guided by a bear, protected by a panther, and yet human himself, Mowgli belongs everywhere and nowhere at the same time. At first, this feels like a problem. But beneath the adventures lies a profound truth: Identity is not only about where we come from. It is also about the values we choose to carry.",
      "Throughout the jungle, Mowgli learns from many teachers. From Baloo, he learns joy and wisdom. From Bagheera, caution and discipline. Even his enemies teach him something about courage and resilience.",
      "Like all children, he slowly discovers that growing up is not about becoming exactly like the people around us. It is about gathering lessons from many places and shaping them into something uniquely our own.",
      "The jungle itself represents life. It can be beautiful and dangerous. Welcoming and challenging. Sometimes it feels like everyone knows the rules except us.",
      "Yet Mowgli survives not because he is the strongest animal in the jungle. He survives because he learns.",
      "He observes. He adapts. He listens. He grows.",
      "The story isn't really about talking animals or jungle adventures. It is about the lifelong journey of finding your place in the world while staying true to yourself."
    ],
    reminder: "You do not have to be exactly like anyone else to belong. Your differences may become your greatest strength."
  },
  {
    slug: "the-greedy-rabbit",
    bookTitle: "The Greedy Rabbit",
    author: "by Enid Blyton",
    theme: "Contentment & Gratitude",
    coverImage: "https://images.ctfassets.net/tx11zsju5n7c/1gDkLlIRwHiNwikkzXEqMO/8ebe9ae20d5f77faeaf6ee501c2ec17e/The_Greedy_Rabbit.jpg",
    body: [
      "There is a feeling children experience very early in life: the fear of not having enough.",
      "If there are two cookies, they want three. If someone else has something nice, they suddenly want it too.",
      "This doesn't come from being \u201cbad.\u201d It comes from something deeply human: the instinct to hold on tightly to what feels good.",
      "The tricky thing about greed is that it often disguises itself as happiness.",
      "The rabbit believes that more will make everything better—more food, more treats, more for me. But many children slowly discover an important truth: Having more and enjoying more are not the same thing.",
      "When we rush to grab everything, we sometimes miss the joy of what we already have. And when we think only about ourselves, we quietly push away the very things that make life sweeter—friendship, fairness, and togetherness.",
      "The deeper lesson here is not about never wanting things.",
      "It is about learning when enough is enough.",
      "Because happiness rarely comes from taking everything we can. More often, it comes from knowing how to enjoy, share, and stop.",
      "The story is not really about a rabbit being greedy. It is about learning that contentment feels better than endless wanting."
    ],
    reminder: "A full heart matters more than full hands."
  }
];

/* Find an entry by book title (case-insensitive, trims punctuation-insensitive match on core words) */
function findSBTSEntry(bookTitle) {
  if (!bookTitle) return null;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = norm(bookTitle);
  return SBTS_ENTRIES.find(e => norm(e.bookTitle) === target) || null;
}
