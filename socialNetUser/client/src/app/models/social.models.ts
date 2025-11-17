export interface SocialUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  photoUrl: string;
  friends: string[];
  bio?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
}

export interface FeedResponse {
  user: SocialUser;
  posts: Post[];
}

export interface MessagesResponse {
  user: SocialUser;
  messages: Message[];
}
