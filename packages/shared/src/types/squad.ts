export interface Squad {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
  position: { x: number; y: number };
  createdAt: number;
}
