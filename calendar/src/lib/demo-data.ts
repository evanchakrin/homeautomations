import type {
  EventWithAssignees, FamilyMember, Chore, ChoreCompletion, Meal, List, ListItem, Photo,
  LightDevice, AutomationScene, Note,
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

export const DEMO_DEVICES: LightDevice[] = [
  { id: "d1", household_id: "demo", ip: "192.168.39.10", mac: "a8:bb:50:11:22:33", name: "Living room lamp",  room: "Living Room", last_seen: at(0, 12).toISOString(), position: 0 },
  { id: "d2", household_id: "demo", ip: "192.168.39.11", mac: "a8:bb:50:11:22:34", name: "Floor lamp",        room: "Living Room", last_seen: at(0, 12).toISOString(), position: 1 },
  { id: "d3", household_id: "demo", ip: "192.168.39.12", mac: "a8:bb:50:11:22:35", name: "Kitchen overhead",  room: "Kitchen",     last_seen: at(0, 12).toISOString(), position: 2 },
  { id: "d4", household_id: "demo", ip: "192.168.39.13", mac: "a8:bb:50:11:22:36", name: "Bedside",           room: "Bedroom",     last_seen: at(0, 12).toISOString(), position: 3 },
  { id: "d5", household_id: "demo", ip: "192.168.39.14", mac: "a8:bb:50:11:22:37", name: "Hallway",           room: "Hallway",     last_seen: at(0, 12).toISOString(), position: 4 },
];

export const DEMO_SCENES: AutomationScene[] = [
  { id: "s1", household_id: "demo", name: "Wake Up",     emoji: "☀️", description: "All lights, daylight at 80%",
    actions: [{ type: "lights.scene", target: "all", scene: "daylight", dimming: 80 }],
    position: 0, last_run_at: at(0, 6, 30).toISOString() },
  { id: "s2", household_id: "demo", name: "Movie Night", emoji: "🎬", description: "Cozy at 25%",
    actions: [{ type: "lights.scene", target: "all", scene: "cozy", dimming: 25 }],
    position: 1, last_run_at: at(-1, 20).toISOString() },
  { id: "s3", household_id: "demo", name: "Bedtime",     emoji: "🌙", description: "Bedtime scene, very dim",
    actions: [{ type: "lights.scene", target: "all", scene: "bedtime", dimming: 15 }],
    position: 2, last_run_at: at(-1, 22, 30).toISOString() },
  { id: "s4", household_id: "demo", name: "Away",        emoji: "🚪", description: "All off",
    actions: [{ type: "lights.off", target: "all" }],
    position: 3, last_run_at: null },
  { id: "s5", household_id: "demo", name: "Reading",     emoji: "📖", description: "Living room warm white at 60%",
    actions: [{ type: "lights.scene", target: "device:d1", scene: "warm_white", dimming: 60 }, { type: "lights.off", target: "device:d2" }],
    position: 4, last_run_at: null },
  { id: "s6", household_id: "demo", name: "Dinner",      emoji: "🍽️", description: "Kitchen + living room candlelight",
    actions: [{ type: "lights.scene", target: "device:d3", scene: "candlelight" }, { type: "lights.scene", target: "device:d1", scene: "cozy", dimming: 40 }],
    position: 5, last_run_at: null },
];

export const DEMO_NOTES: Note[] = [
  { id: "n1", household_id: "demo", author_member_id: "m2", color: "#E07A5F",
    body: "Soccer cleats need replacing — Theo's outgrew them again.",
    pinned: true,
    created_at: at(-1, 9).toISOString(), updated_at: at(-1, 9).toISOString() },
  { id: "n2", household_id: "demo", author_member_id: "m1", color: "#3D5A80",
    body: "Reminder: trash goes out Tuesday night.",
    pinned: true,
    created_at: at(-2, 18).toISOString(), updated_at: at(-2, 18).toISOString() },
  { id: "n3", household_id: "demo", author_member_id: "m3", color: "#81B29A",
    body: "Field trip permission slip is on the counter — please sign.",
    pinned: false,
    created_at: at(0, 7, 30).toISOString(), updated_at: at(0, 7, 30).toISOString() },
  { id: "n4", household_id: "demo", author_member_id: "m4", color: "#F2CC8F",
    body: "I drew a picture of the cat. it's on the fridge",
    pinned: false,
    created_at: at(-1, 16).toISOString(), updated_at: at(-1, 16).toISOString() },
  { id: "n5", household_id: "demo", author_member_id: "m1", color: "#3D5A80",
    body: "Booked the cabin for the long weekend. Confirmation in email.",
    pinned: false,
    created_at: at(-3, 11).toISOString(), updated_at: at(-3, 11).toISOString() },
  { id: "n6", household_id: "demo", author_member_id: "m2", color: "#E07A5F",
    body: "Date night Saturday — kids w/ Grandma, dinner reservation 7:30.",
    pinned: false,
    created_at: at(-2, 8).toISOString(), updated_at: at(-2, 8).toISOString() },
];
