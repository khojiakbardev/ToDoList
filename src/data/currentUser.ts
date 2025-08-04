import { User } from '@/types/issue';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alice Johnson',
  role: 'admin', // Change to 'contributor' to test read-only mode
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2', 
    name: 'Ali Valiyev',
    role: 'contributor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: 'user-3',
    name: 'Sardor Karimov', 
    role: 'contributor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: 'user-4',
    name: 'Nilufar Toshmatova',
    role: 'contributor', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: 'user-5',
    name: 'Akmal Rustamov',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: 'user-6',
    name: 'Bobur Ergashev',
    role: 'contributor',
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: 'user-7',
    name: 'Madina Yo\'ldosheva',
    role: 'contributor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=32&h=32&fit=crop&crop=face'
  }
];