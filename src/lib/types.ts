export type TravelStyle = 'relaxed' | 'packed' | 'budget' | 'luxury'

export type StopType = 'hotel' | 'restaurant' | 'attraction' | 'transport'

export type GeocodeStatus = 'resolved' | 'unresolved' | 'manual' | 'pending'

export type Currency = 'USD' | 'PKR'

export interface Trip {
  id: string
  user_id: string
  destination: string
  start_date: string
  end_date: string
  budget: number
  currency: Currency
  travel_style: TravelStyle
  share_slug: string
  cover_image_url: string | null
  cover_photographer_name: string | null
  cover_photographer_url: string | null
  scope_note: string | null
  created_at: string
}

export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: string
}

export interface Stop {
  id: string
  day_id: string
  order_index: number
  type: StopType
  name: string
  lat: number | null
  lng: number | null
  start_time: string | null
  est_cost: number | null
  notes: string | null
  geocode_status: GeocodeStatus
}

export interface Expense {
  id: string
  trip_id: string
  category: string
  amount: number
  description: string
  date: string
}

export interface PackingItem {
  id: string
  trip_id: string
  label: string
  is_checked: boolean
  category: string
}

export interface Note {
  id: string
  trip_id: string
  day_id: string | null
  content: string
  updated_at: string
}

export interface Comment {
  id: string
  trip_id: string
  user_id: string
  content: string
  created_at: string
  author_name?: string
}
