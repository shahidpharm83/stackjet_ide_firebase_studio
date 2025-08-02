
export type BlogPost = {
  title: string;
  description: string;
  slug: string;
  author: string;
  date: string;
  imageUrl: string;
  content: string;
};

const posts: BlogPost[] = [
  {
    title: 'The Future of AI in Web Development',
    slug: 'future-of-ai',
    description: 'Exploring how artificial intelligence is reshaping the landscape of web development, from code generation to automated testing.',
    author: 'Jane Doe',
    date: 'August 5, 2024',
    imageUrl: 'https://placehold.co/600x400.png',
    content: `
      <p>Artificial intelligence is no longer a futuristic concept; it's a present-day reality that is actively transforming the web development industry. In this post, we'll dive into the most exciting advancements and predict what's coming next.</p>
      <h2 class="text-2xl font-bold mt-6 mb-4">AI-Powered Code Completion</h2>
      <p>Tools like GitHub Copilot and Tabnine are just the beginning. The next generation of AI assistants will not just suggest lines of code, but entire components and logic flows based on natural language descriptions.</p>
      <h2 class="text-2xl font-bold mt-6 mb-4">Automated Testing and Debugging</h2>
      <p>Imagine an AI that can read your code, understand its intent, and automatically generate a comprehensive suite of unit, integration, and end-to-end tests. This will free up developers to focus on building features rather than writing boilerplate test code.</p>
    `,
  },
  {
    title: 'Mastering Modern CSS Layouts',
    slug: 'modern-css-layouts',
    description: 'A deep dive into Flexbox and CSS Grid, the two pillars of modern web layout design. Includes practical examples and common patterns.',
    author: 'John Smith',
    date: 'July 28, 2024',
    imageUrl: 'https://placehold.co/600x400.png',
    content: `
      <p>Gone are the days of floats and table-based layouts. Modern CSS offers two powerful layout systems: Flexbox and Grid. Understanding when and how to use each is key to building responsive, maintainable websites.</p>
      <h2 class="text-2xl font-bold mt-6 mb-4">When to Use Flexbox</h2>
      <p>Flexbox excels at one-dimensional layouts—either a row or a column. It's perfect for aligning items in a navigation bar, distributing space in a component, or centering content vertically.</p>
      <h2 class="text-2xl font-bold mt-6 mb-4">The Power of CSS Grid</h2>
      <p>CSS Grid is designed for two-dimensional layouts, controlling both rows and columns simultaneously. It's the ideal choice for complex page layouts, image galleries, and any design that requires precise alignment on both axes.</p>
    `,
  },
  {
    title: 'A Guide to State Management in React',
    slug: 'react-state-management',
    description: "From useState to global state libraries like Redux and Zustand, we compare the most popular state management solutions in the React ecosystem.",
    author: 'Emily White',
    date: 'July 15, 2024',
    imageUrl: 'https://placehold.co/600x400.png',
    content: `
      <p>Managing state is one of the most critical aspects of building a React application. The right approach can lead to a clean, scalable codebase, while the wrong one can lead to bugs and maintenance nightmares.</p>
      <h2 class="text-2xl font-bold mt-6 mb-4">Local State with Hooks</h2>
      <p>For state that's confined to a single component, hooks like <code>useState</code> and <code>useReducer</code> are often the simplest and best solution. They are built into React and require no external libraries.</p>
      <h2 class="text-2xl font-bold mt-6 mb-4">Global State Solutions</h2>
      <p>When multiple components across your app need to share and update the same piece of state, it's time to reach for a global state management library. We'll explore the pros and cons of established players like Redux and modern alternatives like Zustand and Jotai.</p>
    `,
  },
];

export function getBlogPosts() {
  return posts;
}

export function getBlogPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
