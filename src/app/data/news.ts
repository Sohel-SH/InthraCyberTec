export type NewsArticle = {
  id: number;
  image: string;
  category: string;
  title: string;
  date: string;
  readTime: string;
  content: string;
};

export const newsArticles: NewsArticle[] = [
  {
    id: 1,
    image: "/images/grid-image/image-01.png",
    category: "Travel",
    title: "What Traveling Greece For 2 Weeks Taught Me About Life",
    date: "Jun 21, 2021",
    readTime: "11 min read",
    content:
      "Spending two weeks in Greece offered more than breathtaking views — it provided perspective. From the calm of the Aegean to the bustle of Athens, each day reminded me to slow down, appreciate simplicity, and seek meaning beyond routine.",
  },
  {
    id: 2,
    image: "/images/grid-image/image-02.png",
    category: "Food Theory",
    title: "Why You Should Never Order 12 Chicken Nuggets and Fries",
    date: "Aug 1, 2021",
    readTime: "7 min read",
    content:
      "There’s more to fast food choices than cravings. We break down portions, nutrition, and better alternatives for satisfying hunger without the crash.",
  },
  {
    id: 3,
    image: "/images/grid-image/image-03.png",
    category: "Travel",
    title: "What Traveling Greece For 2 Weeks Taught Me About Life",
    date: "Jun 21, 2021",
    readTime: "11 min read",
    content:
      "From island hopping to exploring ruins, Greece taught me patience, curiosity, and the value of unexpected detours.",
  },
  {
    id: 4,
    image: "/images/grid-image/image-04.png",
    category: "Travel",
    title: "What Traveling Greece For 2 Weeks Taught Me About Life",
    date: "Jun 21, 2021",
    readTime: "11 min read",
    content:
      "Some journeys become more than trips — they become mirrors that reflect what truly matters.",
  },
  {
    id: 5,
    image: "/images/grid-image/image-05.png",
    category: "Food Theory",
    title: "Why You Should Never Order 12 Chicken Nuggets and Fries",
    date: "Aug 1, 2021",
    readTime: "7 min read",
    content:
      "A nuanced look at portion sizing, satiety, and why smarter choices lead to better energy throughout the day.",
  },
  {
    id: 6,
    image: "/images/grid-image/image-06.png",
    category: "Travel",
    title: "What Traveling Greece For 2 Weeks Taught Me About Life",
    date: "Jun 21, 2021",
    readTime: "11 min read",
    content:
      "A candid reflection on slowing down, embracing minimalism, and learning from locals across the islands.",
  },
];