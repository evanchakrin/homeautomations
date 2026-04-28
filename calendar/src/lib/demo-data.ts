import type {
  EventWithAssignees, FamilyMember, Chore, ChoreCompletion, Meal, List, ListItem, Photo,
} from "@/lib/supabase/types";
import { isoDate, plusDays } from "@/lib/dates";

export const DEMO_HOUSEHOLD = {
  id: "demo",
  name: "The Aurora Family",
  timezone: "America/Los_Angeles",
};

export const DEMO_MEMBERS: FamilyMember[] = [
  { id: "m1", household_id: "demo", name: "Sam",   color: "#3D5A80", emoji: "🧔", user_id: null, points: 42, position: 0 },
  { id: "m2", household_id: "demo", name: "Riley", color: "#E07A5F", emoji: "👩", user_id: null, points: 58, position: 1 },
  { id: "m3", household_id: "demo", name: "Juno",  color: "#81B29A", emoji: "🦊", user_id: null, points: 31, position: 2 },
  { id: "m4", household_id: "demo", name: "Theo",  color: "#F2CC8F", emoji: "🐯", user_id: null, points: 24, position: 3 },
];

const today = new Date();
function at(daysFromToday: number, h: number, m: number = 0): Date {
  const d = plusDays(today, daysFromToday);
  d.setHours(h, m, 0, 0);
  return d;
}

export const DEMO_EVENTS: EventWithAssignees[] = [
  {
    id: "e1", household_id: "demo", title: "Soccer practice", description: null, location: "Field 4",
    starts_at: at(0, 16, 0).toISOString(), ends_at: at(0, 17, 30).toISOString(),
    all_day: false, rrule: null, category: null, created_by: null, member_ids: ["m4"],
  },
  {
    id: "e2", household_id: "demo", title: "Yoga", description: null, location: null,
    starts_at: at(0, 7, 0).toISOString(), ends_at: at(0, 8, 0).toISOString(),
    all_day: false, rrule: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR", category: null, created_by: null, member_ids: ["m2"],
  },
  {
    id: "e3", household_id: "demo", title: "Book club", description: null, location: "Living room",
    starts_at: at(2, 19, 0).toISOString(), ends_at: at(2, 21, 0).toISOString(),
    all_day: false, rrule: null, category: null, created_by: null, member_ids: ["m1", "m2"],
  },
  {
    id: "e4", household_id: "demo", title: "Dentist", description: null, location: "Dr. Patel",
    starts_at: at(1, 10, 30).toISOString(), ends_at: at(1, 11, 30).toISOString(),
    all_day: false, rrule: null, category: null, created_by: null, member_ids: ["m3"],
  },
  {
    id: "e5", household_id: "demo", title: "Date night", description: null, location: "Trattoria",
    starts_at: at(5, 19, 30).toISOString(), ends_at: at(5, 22, 0).toISOString(),
    all_day: false, rrule: null, category: null, created_by: null, member_ids: ["m1", "m2"],
  },
  {
    id: "e6", household_id: "demo", title: "Piano lesson", description: null, location: null,
    starts_at: at(3, 15, 0).toISOString(), ends_at: at(3, 16, 0).toISOString(),
    all_day: false, rrule: "RRULE:FREQ=WEEKLY;BYDAY=TH", category: null, created_by: null, member_ids: ["m3"],
  },
  {
    id: "e7", household_id: "demo", title: "Sam at conference", description: null, location: "Seattle",
    starts_at: at(8, 0, 0).toISOString(), ends_at: at(10, 23, 59).toISOString(),
    all_day: true, rrule: null, category: null, created_by: null, member_ids: ["m1"],
  },
  {
    id: "e8", household_id: "demo", title: "Birthday party", description: null, location: "Park pavilion",
    starts_at: at(6, 14, 0).toISOString(), ends_at: at(6, 17, 0).toISOString(),
    all_day: false, rrule: null, category: null, created_by: null, member_ids: ["m4", "m3"],
  },
  {
    id: "e9", household_id: "demo", title: "Standup", description: null, location: null,
    starts_at: at(0, 9, 30).toISOString(), ends_at: at(0, 10, 0).toISOString(),
    all_day: false, rrule: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", category: null, created_by: null, member_ids: ["m1"],
  },
  {
    id: "e10", household_id: "demo", title: "Family dinner", description: null, location: null,
    starts_at: at(0, 18, 30).toISOString(), ends_at: at(0, 19, 30).toISOString(),
    all_day: false, rrule: "RRULE:FREQ=WEEKLY;BYDAY=SU", category: null, created_by: null, member_ids: ["m1","m2","m3","m4"],
  },
];

export const DEMO_CHORES: Chore[] = [
  { id: "c1", household_id: "demo", title: "Make bed",          notes: null, member_id: "m3", due_date: null, recurrence: "daily",    points: 1 },
  { id: "c2", household_id: "demo", title: "Feed the cat",      notes: null, member_id: "m4", due_date: null, recurrence: "daily",    points: 2 },
  { id: "c3", household_id: "demo", title: "Take out trash",    notes: null, member_id: "m3", due_date: isoDate(plusDays(today, 1)), recurrence: "weekly",   points: 5 },
  { id: "c4", household_id: "demo", title: "Vacuum living room", notes: null, member_id: null, due_date: isoDate(plusDays(today, 0)), recurrence: "weekly",   points: 3 },
  { id: "c5", household_id: "demo", title: "Empty dishwasher",  notes: null, member_id: "m4", due_date: null, recurrence: "weekdays", points: 2 },
  { id: "c6", household_id: "demo", title: "Pay bills",         notes: null, member_id: "m1", due_date: isoDate(plusDays(today, 0)), recurrence: "monthly",  points: 0 },
];

export const DEMO_COMPLETIONS: ChoreCompletion[] = [
  { id: "cc1", chore_id: "c1", member_id: "m3", completed_on: isoDate(plusDays(today, -1)), completed_at: at(-1, 8).toISOString() },
  { id: "cc2", chore_id: "c2", member_id: "m4", completed_on: isoDate(today), completed_at: at(0, 7).toISOString() },
  { id: "cc3", chore_id: "c1", member_id: "m3", completed_on: isoDate(today), completed_at: at(0, 8).toISOString() },
  { id: "cc4", chore_id: "c5", member_id: "m4", completed_on: isoDate(plusDays(today, -1)), completed_at: at(-1, 19).toISOString() },
];

export const DEMO_MEALS: Meal[] = [
  { id: "ml1", household_id: "demo", date: isoDate(today),                meal_type: "breakfast", title: "Oatmeal & berries", notes: null },
  { id: "ml2", household_id: "demo", date: isoDate(today),                meal_type: "lunch",     title: "Turkey sandwiches", notes: null },
  { id: "ml3", household_id: "demo", date: isoDate(today),                meal_type: "dinner",    title: "Sheet-pan salmon",  notes: null },
  { id: "ml4", household_id: "demo", date: isoDate(plusDays(today, 1)),   meal_type: "dinner",    title: "Tacos",             notes: null },
  { id: "ml5", household_id: "demo", date: isoDate(plusDays(today, 2)),   meal_type: "dinner",    title: "Pasta primavera",   notes: null },
  { id: "ml6", household_id: "demo", date: isoDate(plusDays(today, 3)),   meal_type: "dinner",    title: "Stir-fry",          notes: null },
  { id: "ml7", household_id: "demo", date: isoDate(plusDays(today, 4)),   meal_type: "dinner",    title: "Pizza night",       notes: null },
  { id: "ml8", household_id: "demo", date: isoDate(plusDays(today, 5)),   meal_type: "dinner",    title: "Soup & bread",      notes: null },
];

export const DEMO_LISTS: List[] = [
  { id: "l1", household_id: "demo", name: "Groceries", kind: "grocery", position: 0 },
  { id: "l2", household_id: "demo", name: "To Do",     kind: "todo",    position: 1 },
];

export const DEMO_LIST_ITEMS: Record<string, ListItem[]> = {
  l1: [
    { id: "li1", list_id: "l1", text: "Eggs",       completed_at: null, member_id: null, position: 0 },
    { id: "li2", list_id: "l1", text: "Bananas",    completed_at: null, member_id: null, position: 1 },
    { id: "li3", list_id: "l1", text: "Coffee",     completed_at: null, member_id: null, position: 2 },
    { id: "li4", list_id: "l1", text: "Olive oil",  completed_at: null, member_id: null, position: 3 },
    { id: "li5", list_id: "l1", text: "Milk",       completed_at: at(-1, 12).toISOString(), member_id: null, position: 4 },
    { id: "li6", list_id: "l1", text: "Bread",      completed_at: at(-1, 12).toISOString(), member_id: null, position: 5 },
  ],
  l2: [
    { id: "li7", list_id: "l2", text: "Renew library books",      completed_at: null, member_id: null, position: 0 },
    { id: "li8", list_id: "l2", text: "Schedule HVAC tune-up",    completed_at: null, member_id: null, position: 1 },
    { id: "li9", list_id: "l2", text: "Mail birthday card",       completed_at: at(-2, 10).toISOString(), member_id: null, position: 2 },
  ],
};

export const DEMO_PHOTOS: (Photo & { signedUrl: string | null })[] = [];
