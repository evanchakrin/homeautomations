export type Role = "owner" | "member";
export type Recurrence = "once" | "daily" | "weekdays" | "weekly" | "monthly";
export type ListKind = "todo" | "grocery" | "notes";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Household = {
  id: string;
  name: string;
  timezone: string;
  created_by: string | null;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  household_id: string;
  name: string;
  color: string;
  emoji: string | null;
  user_id: string | null;
  points: number;
  position: number;
};

export type Event = {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  rrule: string | null;
  category: string | null;
  created_by: string | null;
};

export type EventWithAssignees = Event & { member_ids: string[] };

export type Chore = {
  id: string;
  household_id: string;
  title: string;
  notes: string | null;
  member_id: string | null;
  due_date: string | null;
  recurrence: Recurrence;
  points: number;
};

export type ChoreCompletion = {
  id: string;
  chore_id: string;
  member_id: string | null;
  completed_on: string;
  completed_at: string;
};

export type Meal = {
  id: string;
  household_id: string;
  date: string;
  meal_type: MealType;
  title: string;
  notes: string | null;
};

export type List = {
  id: string;
  household_id: string;
  name: string;
  kind: ListKind;
  position: number;
};

export type ListItem = {
  id: string;
  list_id: string;
  text: string;
  completed_at: string | null;
  member_id: string | null;
  position: number;
};

export type Photo = {
  id: string;
  household_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type LightDevice = {
  id: string;
  household_id: string;
  ip: string;
  mac: string | null;
  name: string;
  room: string | null;
  last_seen: string | null;
  position: number;
};

export type SceneAction =
  | { type: "lights.scene"; target: "all" | string; scene: string; dimming?: number }
  | { type: "lights.brightness"; target: "all" | string; dimming: number }
  | { type: "lights.on"; target: "all" | string }
  | { type: "lights.off"; target: "all" | string }
  | { type: "lights.temp"; target: "all" | string; temp: number; dimming?: number };

export type AutomationScene = {
  id: string;
  household_id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  actions: SceneAction[];
  position: number;
  last_run_at: string | null;
};

export type Note = {
  id: string;
  household_id: string;
  author_member_id: string | null;
  body: string;
  color: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};
