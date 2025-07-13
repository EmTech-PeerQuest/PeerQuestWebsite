import type { NextApiRequest, NextApiResponse } from 'next';

// Dummy user data for demonstration. Replace with your DB logic.
const users = [
  {
    id: 1,
    username: 'adventurer1',
    displayName: 'Alice',
    avatar: '🧙‍♀️',
    level: 5,
    completedQuests: 12,
    guilds: [{ id: 1, name: 'Guild One' }],
    skills: ['Accounting', 'Swordsmanship'],
    bio: 'A wise adventurer.',
    roleDisplay: 'Mage',
    badges: [
      { icon: '🏅', name: 'Veteran' }
    ]
  },
  {
    id: 2,
    username: 'adventurer2',
    displayName: 'Bob',
    avatar: '🧝‍♂️',
    level: 3,
    completedQuests: 7,
    guilds: [],
    skills: ['Stealth', 'Archery'],
    bio: 'A sneaky elf.',
    roleDisplay: 'Rogue',
    badges: []
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ users });
}
